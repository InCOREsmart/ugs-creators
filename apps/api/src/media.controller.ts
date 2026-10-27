import { Body, Controller, Post, UseGuards, BadRequestException } from "@nestjs/common";
import { IsInt, IsString, Min, MinLength } from "class-validator";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { S3Service } from "./s3.service";
import { VideoQueueService } from "./video-queue.service";
class UploadRequestDto { @IsString() campaignId!:string; @IsString() fileName!:string; @IsString() contentType!:string; @IsInt() @Min(1) sizeBytes!:number; }
@Controller("media") @UseGuards(JwtAuthGuard)
export class MediaController {
 constructor(private s3:S3Service,private queue:VideoQueueService){}
 @Post("upload-url") async uploadUrl(@Body() dto:UploadRequestDto){
  if(!/^video\/(mp4|quicktime|webm)$/.test(dto.contentType)) throw new BadRequestException("Поддерживаются только MP4, QuickTime и WebM");
  if(dto.sizeBytes>20*1024*1024*1024) throw new BadRequestException("Максимальный размер файла 20 ГБ");
  const key=this.s3.makeObjectKey(dto.campaignId,dto.fileName);
  return {objectKey:key,uploadUrl:await this.s3.presignPut(key,dto.contentType),expiresInSeconds:300,storage:"S3-compatible"};
 }
 @Post("process") async process(@Body() body:{objectKey:string;campaignId:string}){
  if(!body?.objectKey||!body?.campaignId||body.objectKey.startsWith("/")||body.objectKey.includes("..")) throw new BadRequestException("Некорректный objectKey");
  return this.queue.enqueue({objectKey:body.objectKey,campaignId:body.campaignId});
 }
}
