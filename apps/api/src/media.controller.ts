import { Body, Controller, Post, Get, Param, UseGuards, BadRequestException, NotFoundException, ForbiddenException, Req } from "@nestjs/common";
import { IsInt, IsString, Min } from "class-validator";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { S3Service } from "./s3.service";
import { VideoQueueService } from "./video-queue.service";
import { PrismaService } from "./prisma.service";
class UploadRequestDto { @IsString() campaignId!:string; @IsString() fileName!:string; @IsString() contentType!:string; @IsInt() @Min(1) sizeBytes!:number; }
class ProcessDto { @IsString() objectKey!:string; @IsString() campaignId!:string; }
@Controller("media") @UseGuards(JwtAuthGuard)
export class MediaController {
 constructor(private s3:S3Service,private queue:VideoQueueService,private db:PrismaService){}
 private async assertCampaignAccess(campaignId:string,user:any){
  const campaign=await this.db.campaign.findUnique({where:{id:campaignId},select:{id:true,createdBy:true,organizationId:true}});
  if(!campaign) throw new NotFoundException("Кампания не найдена");
  if(user.role!=="SUPER_ADMIN"){
   const membership=await this.db.organizationMember.findUnique({where:{organizationId_userId:{organizationId:campaign.organizationId,userId:user.sub}}});
   if(campaign.createdBy!==user.sub&&!membership) throw new ForbiddenException("Нет доступа к кампании");
  }
  if(user.role==="CREATOR") throw new ForbiddenException("Креатор не может загружать материалы в кампанию от имени заказчика");
 }
 @Post("upload-url") async uploadUrl(@Body() dto:UploadRequestDto,@Req() req:any){
  await this.assertCampaignAccess(dto.campaignId,req.user);
  if(!/^video\/(mp4|quicktime|webm)$/.test(dto.contentType)) throw new BadRequestException("Поддерживаются только MP4, QuickTime и WebM");
  if(dto.sizeBytes>20*1024*1024*1024) throw new BadRequestException("Максимальный размер файла 20 ГБ");
  const key=this.s3.makeObjectKey(dto.campaignId,dto.fileName);
  await this.db.mediaAsset.create({data:{campaignId:dto.campaignId,createdBy:req.user.sub,objectKey:key,fileName:dto.fileName,contentType:dto.contentType,originalBytes:BigInt(dto.sizeBytes)}});
  return {objectKey:key,uploadUrl:await this.s3.presignPut(key,dto.contentType),requiredHeaders:{"Content-Type":dto.contentType,"x-amz-server-side-encryption":"AES256"},expiresInSeconds:300,storage:"S3-compatible"};
 }
 @Get("campaign/:campaignId") async list(@Param("campaignId") campaignId:string,@Req() req:any){
  await this.assertCampaignAccess(campaignId,req.user);
  const assets=await this.db.mediaAsset.findMany({where:{campaignId},orderBy:{createdAt:"desc"},select:{id:true,campaignId:true,fileName:true,contentType:true,originalBytes:true,status:true,durationSeconds:true,width:true,height:true,variants:true,thumbnailKey:true,errorMessage:true,createdAt:true,updatedAt:true}});
  return assets.map(a=>({...a,originalBytes:a.originalBytes.toString()}));
 }
 @Post("process") async process(@Body() dto:ProcessDto,@Req() req:any){
  await this.assertCampaignAccess(dto.campaignId,req.user);
  if(!dto.objectKey||dto.objectKey.startsWith("/")||dto.objectKey.split("/").includes("..")||!dto.objectKey.startsWith(`quarantine/${dto.campaignId}/`)) throw new BadRequestException("Некорректный objectKey");
  const asset=await this.db.mediaAsset.findUnique({where:{objectKey:dto.objectKey}});
  if(!asset||asset.campaignId!==dto.campaignId) throw new NotFoundException("Загрузка не найдена");
  if(asset.status!=="UPLOAD_PENDING"&&asset.status!=="FAILED") throw new BadRequestException("Материал уже поставлен в обработку или обработан");
  const queued=await this.queue.enqueue(dto);
  await this.db.mediaAsset.update({where:{id:asset.id},data:{status:"QUEUED",jobId:String(queued.jobId),errorMessage:null}});
  return {...queued,mediaId:asset.id};
 }
}
