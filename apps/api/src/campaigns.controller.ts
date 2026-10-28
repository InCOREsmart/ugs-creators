import { Body, Controller, Get, Param, Post, Patch, Query, Req, UseGuards, NotFoundException, ForbiddenException } from "@nestjs/common";
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Min, MinLength } from "class-validator";
import { PrismaService } from "./prisma.service";
import { CampaignStatus } from "@prisma/client";
import { JwtAuthGuard } from "./jwt-auth.guard";
class CreateCampaignDto { @IsString() @MinLength(2) name!:string; @IsUUID() organizationId!:string; @IsOptional() @IsInt() @Min(0) budgetKopecks?:number; @IsOptional() @IsString() deadline?:string; }
class AssignCreatorDto { @IsUUID() creatorId!:string; }
class AssignmentResponseDto { @IsIn(["ACCEPTED","DECLINED"]) status!:"ACCEPTED"|"DECLINED"; }
class UpdateCampaignDto { @IsOptional() @IsString() @MinLength(2) name?:string; @IsOptional() @IsIn(["SEARCH","NEGOTIATION","BRIEF_ACCEPTED","CONTRACT","CONTENT_CREATION","APPROVAL","PUBLICATION","PAYMENT","COMPLETED","CANCELLED"]) status?:string; @IsOptional() @IsInt() @Min(0) budgetKopecks?:number; @IsOptional() @IsString() deadline?:string; }
const statuses=["SEARCH","NEGOTIATION","BRIEF_ACCEPTED","CONTRACT","CONTENT_CREATION","APPROVAL","PUBLICATION","PAYMENT","COMPLETED","CANCELLED"];
@Controller("campaigns") @UseGuards(JwtAuthGuard)
export class CampaignsController {
 constructor(private db:PrismaService){}
 @Get() async list(@Query("page") pageRaw="1",@Query("limit") limitRaw="20",@Req() req:any){
  const page=Math.max(1,Number(pageRaw)||1),limit=Math.min(100,Math.max(1,Number(limitRaw)||20));
  const where=req.user.role==="SUPER_ADMIN"?{}:req.user.role==="CREATOR"?{creatorAssignments:{some:{creator:{userId:req.user.sub}}}}:{OR:[{createdBy:req.user.sub},{organization:{members:{some:{userId:req.user.sub}}}}]};
  const [items,total]=await Promise.all([this.db.campaign.findMany({where,skip:(page-1)*limit,take:limit,orderBy:{updatedAt:"desc"},include:{organization:{select:{id:true,name:true}},creatorAssignments:{where:req.user.role==="CREATOR"?{creator:{userId:req.user.sub}}:undefined,include:{creator:{select:{id:true,displayName:true,user:{select:{email:true,fullName:true}}}}}}}}),this.db.campaign.count({where})]);
  return {items:items.map((item:any)=>({...item,budgetKopecks:Number(item.budgetKopecks)})),page,limit,total};
 }
 @Post(":id/creators") async assignCreator(@Param("id") id:string,@Body() dto:AssignCreatorDto,@Req() req:any){
  if(!["SUPER_ADMIN","ORG_ADMIN","MANAGER"].includes(req.user.role)) throw new ForbiddenException("Назначать креаторов может только команда заказчика");
  const campaign=await this.db.campaign.findUnique({where:{id},select:{id:true,organizationId:true,createdBy:true}});
  if(!campaign) throw new NotFoundException("Кампания не найдена");
  if(req.user.role!=="SUPER_ADMIN"){
   const membership=await this.db.organizationMember.findUnique({where:{organizationId_userId:{organizationId:campaign.organizationId,userId:req.user.sub}}});
   if(campaign.createdBy!==req.user.sub&&!membership) throw new ForbiddenException("Нет доступа к кампании");
  }
  const creator=await this.db.creator.findUnique({where:{id:dto.creatorId},select:{id:true}});
  if(!creator) throw new NotFoundException("Креатор не найден");
  return this.db.creatorAssignment.upsert({where:{campaignId_creatorId:{campaignId:id,creatorId:dto.creatorId}},create:{campaignId:id,creatorId:dto.creatorId},update:{status:"ASSIGNED"},include:{creator:{select:{id:true,displayName:true,user:{select:{email:true,fullName:true}}}}}});
 }
 @Patch("assignments/:id/respond") async respondToAssignment(@Param("id") id:string,@Body() dto:AssignmentResponseDto,@Req() req:any){
  if(req.user.role!=="CREATOR") throw new ForbiddenException("Ответить на назначение может только креатор");
  const assignment=await this.db.creatorAssignment.findFirst({where:{id,creator:{userId:req.user.sub}},select:{id:true}});
  if(!assignment) throw new NotFoundException("Назначение не найдено");
  return this.db.creatorAssignment.update({where:{id},data:{status:dto.status}});
 }
 @Post() async create(@Body() dto:CreateCampaignDto,@Req() req:any){
  if(!["SUPER_ADMIN","ORG_ADMIN","MANAGER"].includes(req.user.role)) throw new ForbiddenException("Создавать кампании может только команда заказчика");
  const org=await this.db.organization.findUnique({where:{id:dto.organizationId},select:{id:true}});
  if(!org) throw new NotFoundException("Организация не найдена");
  if(req.user.role!=="SUPER_ADMIN"){
   const membership=await this.db.organizationMember.findUnique({where:{organizationId_userId:{organizationId:dto.organizationId,userId:req.user.sub}}});
   if(!membership) throw new ForbiddenException("Вы не состоите в этой организации");
  }
  const created=await this.db.campaign.create({data:{name:dto.name,organizationId:dto.organizationId,budgetKopecks:BigInt(dto.budgetKopecks??0),deadline:dto.deadline?new Date(dto.deadline):undefined,createdBy:req.user.sub}}); return {...created,budgetKopecks:Number(created.budgetKopecks)};
 }
 @Patch(":id") async update(@Param("id") id:string,@Body() dto:UpdateCampaignDto,@Req() req:any){
  if(!["SUPER_ADMIN","ORG_ADMIN","MANAGER"].includes(req.user.role)) throw new ForbiddenException("Изменять кампании может только команда заказчика");
  const old=await this.db.campaign.findUnique({where:{id}});
  if(!old) throw new NotFoundException("Кампания не найдена");
  if(req.user.role!=="SUPER_ADMIN"){
   const membership=await this.db.organizationMember.findUnique({where:{organizationId_userId:{organizationId:old.organizationId,userId:req.user.sub}}});
   if(old.createdBy!==req.user.sub&&!membership) throw new ForbiddenException("Нет доступа к кампании");
  }
  if(dto.status&&!statuses.includes(dto.status)) throw new ForbiddenException("Недопустимый статус кампании");
  const updated=await this.db.campaign.update({where:{id},data:{name:dto.name,status:dto.status as CampaignStatus|undefined,budgetKopecks:dto.budgetKopecks===undefined?undefined:BigInt(dto.budgetKopecks),deadline:dto.deadline?new Date(dto.deadline):undefined}}); return {...updated,budgetKopecks:Number(updated.budgetKopecks)};
 }
}
