import { Body, Controller, Get, Post, Query, UseGuards, ConflictException } from "@nestjs/common";
import { IsEmail, IsIn, IsObject, IsOptional, IsString, MinLength } from "class-validator";
import { PrismaService } from "./prisma.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import * as bcrypt from "bcrypt";
class CreateCreatorDto {
 @IsEmail() email!:string;
 @IsString() @MinLength(12) temporaryPassword!:string;
 @IsString() @MinLength(2) fullName!:string;
 @IsString() @MinLength(2) displayName!:string;
 @IsIn(["SELF_EMPLOYED","IP","INDIVIDUAL"]) taxStatus!:"SELF_EMPLOYED"|"IP"|"INDIVIDUAL";
 @IsOptional() @IsObject() priceList?:Record<string,unknown>;
 @IsOptional() @IsObject() audienceMetrics?:Record<string,unknown>;
}
@Controller("creators") @UseGuards(JwtAuthGuard)
export class CreatorsController {
 constructor(private db:PrismaService){}
 @Get() async list(@Query("page") pageRaw="1",@Query("limit") limitRaw="20",@Query("q") q=""){
  const page=Math.max(1,Number(pageRaw)||1),limit=Math.min(100,Math.max(1,Number(limitRaw)||20));
  const where=q?{displayName:{contains:q,mode:"insensitive" as const}}:{};
  const [items,total]=await Promise.all([this.db.creator.findMany({where,skip:(page-1)*limit,take:limit,orderBy:{updatedAt:"desc"},select:{id:true,displayName:true,taxStatus:true,priceList:true,audienceMetrics:true,engagementRate:true,fraudScore:true,createdAt:true,user:{select:{email:true,fullName:true}}}}),this.db.creator.count({where})]);
  return {items,page,limit,total};
 }
 @Post() async create(@Body() dto:CreateCreatorDto){
  const email=dto.email.trim().toLowerCase();
  if(await this.db.user.findUnique({where:{email}})) throw new ConflictException("Пользователь с таким email уже существует");
  return this.db.$transaction(async tx=>{
   const user=await tx.user.create({data:{email,fullName:dto.fullName,passwordHash:await bcrypt.hash(dto.temporaryPassword,12),role:"CREATOR"}});
   return tx.creator.create({data:{userId:user.id,displayName:dto.displayName,taxStatus:dto.taxStatus,priceList:dto.priceList??{},audienceMetrics:dto.audienceMetrics??{}},select:{id:true,displayName:true,taxStatus:true,priceList:true,audienceMetrics:true,createdAt:true,user:{select:{email:true,fullName:true}}}});
  });
 }
}
