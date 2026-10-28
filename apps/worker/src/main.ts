import { Worker, Job } from "bullmq";
import { Redis } from "ioredis";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { spawn } from "node:child_process";
import { createWriteStream, createReadStream } from "node:fs";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", { maxRetriesPerRequest: null });
const bucket = process.env.S3_BUCKET;
const s3 = new S3Client({
 region: process.env.S3_REGION ?? "ru-central1",
 endpoint: process.env.S3_ENDPOINT,
 forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
 credentials: { accessKeyId: process.env.S3_ACCESS_KEY ?? "", secretAccessKey: process.env.S3_SECRET_KEY ?? "" }
});
function run(command:string,args:string[]):Promise<void>{
 return new Promise((resolve,reject)=>{
  const child=spawn(command,args,{stdio:["ignore","ignore","pipe"]});
  let stderr=""; child.stderr.on("data",d=>stderr+=d.toString());
  child.on("error",reject); child.on("close",code=>code===0?resolve():reject(new Error(`${command} exited ${code}: ${stderr.slice(-1500)}`)));
 });
}
async function processVideo(job:Job<{objectKey:string;campaignId:string}>){
 if(!bucket||!process.env.S3_ENDPOINT||!process.env.S3_ACCESS_KEY||!process.env.S3_SECRET_KEY) throw new Error("S3 configuration is incomplete");
 const {objectKey,campaignId}=job.data;
 if(objectKey.startsWith("/")||objectKey.split("/").includes("..")) throw new Error("Invalid object key");
 const dir=await mkdtemp(join(tmpdir(),"ugs-video-"));
 try{
  const source=join(dir,"source-video");
  const response=await s3.send(new GetObjectCommand({Bucket:bucket,Key:objectKey}));
  if(!response.Body) throw new Error("S3 returned an empty object");
  await pipeline(response.Body as NodeJS.ReadableStream,createWriteStream(source));
  const sourceStat=await stat(source);
  if(sourceStat.size===0) throw new Error("Empty video file");
  // Files remain quarantined until malware scanning succeeds.
  await run("clamscan",["--no-summary","--infected",source]);
  const probe=await new Promise<{duration:number;width:number;height:number}>((resolve,reject)=>{
   const child=spawn("ffprobe",["-v","error","-show_entries","format=duration:stream=width,height","-of","json",source]);
   let out="";let err="";child.stdout.on("data",d=>out+=d.toString());child.stderr.on("data",d=>err+=d.toString());
   child.on("error",reject);child.on("close",code=>{if(code!==0)return reject(new Error(err));try{const p=JSON.parse(out);const v=p.streams?.find((s:any)=>s.width&&s.height)??{};resolve({duration:Number(p.format?.duration??0),width:Number(v.width??0),height:Number(v.height??0)});}catch(e){reject(e);}});
  });
  const variants=[360,720,1080].filter(h=>probe.height===0||h<=probe.height);
  const outputs=[];
  for(const height of variants){
   const output=join(dir,`${height}p.mp4`);
   await run("ffmpeg",["-nostdin","-y","-i",source,"-vf",`scale=-2:'min(${height},ih)'`,"-c:v","libx264","-preset","veryfast","-crf","23","-c:a","aac","-b:a","128k","-movflags","+faststart",output]);
   const key=`processed/${campaignId}/${randomUUID()}-${height}p.mp4`;
   await s3.send(new PutObjectCommand({Bucket:bucket,Key:key,Body:createReadStream(output),ContentType:"video/mp4",ServerSideEncryption:"AES256"}));
   outputs.push({height,objectKey:key,bytes:(await stat(output)).size});
  }
  const thumb=join(dir,"thumbnail.jpg");
  await run("ffmpeg",["-nostdin","-y","-ss",String(Math.min(2,Math.max(0,probe.duration/4))),"-i",source,"-frames:v","1","-vf","scale=640:-2",thumb]);
  const thumbnailKey=`previews/${campaignId}/${randomUUID()}.jpg`;
  await s3.send(new PutObjectCommand({Bucket:bucket,Key:thumbnailKey,Body:createReadStream(thumb),ContentType:"image/jpeg",ServerSideEncryption:"AES256"}));
  const result={status:"READY",durationSeconds:probe.duration,width:probe.width,height:probe.height,originalBytes:sourceStat.size,variants:outputs,thumbnailKey};
  await db.mediaAsset.updateMany({where:{objectKey,campaignId},data:{status:"READY",durationSeconds:probe.duration,width:probe.width,height:probe.height,variants:outputs,thumbnailKey,errorMessage:null}});
  return result;
 }finally{await rm(dir,{recursive:true,force:true});}
}
const worker=new Worker("video-processing",async job=>{
 if(job.name!=="transcode") throw new Error(`Unsupported job: ${job.name}`);
 return processVideo(job);
},{connection,concurrency:Number(process.env.VIDEO_CONCURRENCY??2),limiter:{max:4,duration:1000}});
worker.on("failed",async(job,error)=>{
 if(!job)return;
 try { await db.mediaAsset.updateMany({where:{objectKey:job.data.objectKey,campaignId:job.data.campaignId},data:{status:"FAILED",errorMessage:error.message.slice(0,1000)}}); }
 catch(updateError){console.error("Could not persist media failure state",updateError);}
});
process.on("SIGTERM",async()=>{await worker.close();await db.$disconnect();await connection.quit();});
process.on("SIGINT",async()=>{await worker.close();await db.$disconnect();await connection.quit();});
console.log("UGS Creators video worker started");
