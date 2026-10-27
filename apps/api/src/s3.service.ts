import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
@Injectable()
export class S3Service {
 private client:S3Client; private bucket:string;
 constructor(config:ConfigService){
  this.bucket=config.getOrThrow("S3_BUCKET");
  this.client=new S3Client({region:config.get("S3_REGION")??"ru-central1",endpoint:config.getOrThrow("S3_ENDPOINT"),forcePathStyle:config.get("S3_FORCE_PATH_STYLE")==="true",credentials:{accessKeyId:config.getOrThrow("S3_ACCESS_KEY"),secretAccessKey:config.getOrThrow("S3_SECRET_KEY")}});
 }
 makeObjectKey(campaignId:string,fileName:string){const safe=fileName.normalize("NFKC").replace(/[^a-zA-Z0-9._-]/g,"_").slice(-100);return `quarantine/${campaignId}/${randomUUID()}-${safe}`;}
 async presignPut(key:string,contentType:string){return getSignedUrl(this.client,new PutObjectCommand({Bucket:this.bucket,Key:key,ContentType:contentType,ServerSideEncryption:"AES256"}),{expiresIn:300});}
 async presignGet(key:string,seconds=180){return getSignedUrl(this.client,new GetObjectCommand({Bucket:this.bucket,Key:key}),{expiresIn:Math.min(600,Math.max(30,seconds))});}
 async promote(key:string,contentType:string,body:Buffer){await this.client.send(new PutObjectCommand({Bucket:this.bucket,Key:key,Body:body,ContentType:contentType,ServerSideEncryption:"AES256"}));}
}
