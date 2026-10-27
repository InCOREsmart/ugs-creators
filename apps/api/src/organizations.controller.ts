import { Body, Controller, Get, Param, Post, Req, UseGuards, ForbiddenException, NotFoundException, ConflictException } from "@nestjs/common";
import { IsIn, IsOptional, IsString, MinLength } from "class-validator";
import { UserRole } from "@prisma/client";
import { PrismaService } from "./prisma.service";
import { JwtAuthGuard } from "./jwt-auth.guard";

class CreateOrganizationDto {
 @IsString() @MinLength(2) name!:string;
 @IsOptional() @IsString() legalName?:string;
 @IsOptional() @IsString() inn?:string;
}
class AddMemberDto {
 @IsString() email!:string;
 @IsIn(["ORG_ADMIN","MANAGER"]) role!:"ORG_ADMIN"|"MANAGER";
}
@Controller("organizations") @UseGuards(JwtAuthGuard)
export class OrganizationsController {
 constructor(private db:PrismaService){}
 @Get("mine") async mine(@Req() req:any){
  if(req.user.role==="SUPER_ADMIN") return this.db.organization.findMany({select:{id:true,name:true,legalName:true,inn:true,createdAt:true}});
  return this.db.organization.findMany({where:{members:{some:{userId:req.user.sub}}},select:{id:true,name:true,legalName:true,inn:true,createdAt:true}});
 }
 @Post() async create(@Body() dto:CreateOrganizationDto,@Req() req:any){
  if(!["SUPER_ADMIN","ORG_ADMIN"].includes(req.user.role)) throw new ForbiddenException("Создавать организации может только администратор");
  return this.db.$transaction(async tx=>{
   const org=await tx.organization.create({data:{name:dto.name,legalName:dto.legalName,inn:dto.inn}});
   await tx.organizationMember.create({data:{organizationId:org.id,userId:req.user.sub,role:req.user.role==="SUPER_ADMIN"?"ORG_ADMIN":req.user.role as UserRole}});
   return org;
  });
 }
 @Post(":id/members") async addMember(@Param("id") id:string,@Body() dto:AddMemberDto,@Req() req:any){
  const org=await this.db.organization.findUnique({where:{id},select:{id:true}});
  if(!org) throw new NotFoundException("Организация не найдена");
  if(req.user.role!=="SUPER_ADMIN"){
   const membership=await this.db.organizationMember.findUnique({where:{organizationId_userId:{organizationId:id,userId:req.user.sub}}});
   if(!membership||membership.role!=="ORG_ADMIN") throw new ForbiddenException("Добавлять участников может администратор организации");
  }
  const user=await this.db.user.findUnique({where:{email:dto.email.trim().toLowerCase()}});
  if(!user) throw new NotFoundException("Пользователь не найден. Сначала создайте учётную запись через администратора");
  if(user.role==="CREATOR") throw new ForbiddenException("Учётную запись креатора нельзя добавить в команду заказчика");
  try {
   return await this.db.organizationMember.create({data:{organizationId:id,userId:user.id,role:dto.role},select:{id:true,organizationId:true,userId:true,role:true,createdAt:true}});
  } catch { throw new ConflictException("Пользователь уже состоит в организации или данные конфликтуют"); }
 }
}
