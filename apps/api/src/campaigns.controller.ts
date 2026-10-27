import { Body, Controller, Get, Param, Post, Patch, Query, Req, UseGuards, NotFoundException, ForbiddenException } from "@nestjs/common";
import { IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";
import { PrismaService } from "./prisma.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
class CreateCampaignDto { @IsString() @MinLength(2) name!:string; @IsString() organizationId!:string; @IsOptional() @IsInt() @Min(0) budgetKopecks?:number; @IsOptional() @IsString() deadline?:string; }
class UpdateCampaignDto { @IsOptional() @IsString() @MinLength(2) name?:string; @IsOptional() @IsString() status?:string; @IsOptional() @IsInt() @Min(0) budgetKopecks?:number; @IsOptional() @IsString() deadline?:string; }
const statuses=["SEARCH","NEGOTIATION","BRIEF_ACCEPTED","CONTRACT","CONTENT_CREATION","APPROVAL","PUBLICATION","PAYMENT","COMPLETED","CANCELLED"];
@Controller("campaigns") @UseGuards(JwtAuthGuard)
export class CampaignsController {
 constructor(private db:PrismaService){}
 @Get() async list(@Query("page") pageRaw="1",@Query("limit") limitRaw="20",@Req() req:any){
  const page=Math.max(1,Number(pageRaw)||1),limit=Math.min(100,Math.max(1,Number(limitRaw)||20));
  const where=req.user.role==="SUPER_ADMIN"?{}:{createdBy:req.user.sub};
  const [items,total]=await Promise.all([this.db.campaign.findMany({where,skip:(page-1)*limit,take:limit,orderBy:{updatedAt:"desc"},include:{organization:{select:{id:true,name:true}}}}),this.db.campaign.count({where})]);
  return {items:items.map((item:any)=>({...item,budgetKopecks:Number(item.budgetKopecks)})),page,limit,total};
 }
 @Post() async create(@Body() dto:CreateCampaignDto,@Req() req:any){
  const org=await this.db.organization.findUnique({where:{id:dto.organizationId}});
  if(!org) throw new NotFoundException("Организация не найдена");
  const created=await this.db.campaign.create({data:{name:dto.name,organizationId:dto.organizationId,budgetKopecks:BigInt(dto.budgetKopecks??0),deadline:dto.deadline?new Date(dto.deadline):undefined,createdBy:req.user.sub}}); return {...created,budgetKopecks:Number(created.budgetKopecks)};
 }
 @Patch(":id") async update(@Param("id") id:string,@Body() dto:UpdateCampaignDto,@Req() req:any){
  const old=await this.db.campaign.findUnique({where:{id}});
  if(!old) throw new NotFoundException("Кампания не найдена");
  if(req.user.role!=="SUPER_ADMIN"&&old.createdBy!==req.user.sub) throw new ForbiddenException();
  if(dto.status&&!statuses.includes(dto.status)) throw new ForbiddenException("Недопустимый статус кампании");
  const updated=await this.db.campaign.update({where:{id},data:{...dto,budgetKopecks:dto.budgetKopecks===undefined?undefined:BigInt(dto.budgetKopecks),deadline:dto.deadline?new Date(dto.deadline):undefined}}); return {...updated,budgetKopecks:Number(updated.budgetKopecks)};
 }
}
