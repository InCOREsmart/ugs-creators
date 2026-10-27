import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { randomUUID } from "node:crypto";
@Injectable()
export class VideoQueueService {
 private connection=new IORedis(process.env.REDIS_URL??"redis://localhost:6379",{maxRetriesPerRequest:null});
 private queue=new Queue("video-processing",{connection:this.connection});
 async enqueue(data:{objectKey:string;campaignId:string}){
  const id=randomUUID();
  const job=await this.queue.add("transcode",data,{jobId:id,attempts:3,backoff:{type:"exponential",delay:5000},removeOnComplete:1000,removeOnFail:5000});
  return {jobId:job.id,status:"QUEUED"};
 }
}
