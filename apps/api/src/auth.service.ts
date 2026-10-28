import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "./prisma.service";
import * as bcrypt from "bcrypt";
import { randomBytes } from "node:crypto";
@Injectable()
export class AuthService {
 constructor(private db:PrismaService,private jwt:JwtService,private config:ConfigService){}
 async register(input:{email:string;password:string;fullName:string}){
  if(this.config.get("ALLOW_SELF_REGISTRATION")!=="true") throw new ForbiddenException("Самостоятельная регистрация отключена. Используйте приглашение администратора.");
  const email=input.email.trim().toLowerCase();
  if(input.password.length<12) throw new ConflictException("Пароль должен содержать не менее 12 символов");
  if(await this.db.user.findUnique({where:{email}})) throw new ConflictException("Пользователь уже существует");
  const user=await this.db.user.create({data:{email,fullName:input.fullName,passwordHash:await bcrypt.hash(input.password,12),role:"MANAGER"}});
  return this.issue(user.id,user.email,user.role);
 }
 async login(emailRaw:string,password:string){
  const user=await this.db.user.findUnique({where:{email:emailRaw.trim().toLowerCase()}});
  if(!user||!user.isActive||!(await bcrypt.compare(password,user.passwordHash))) throw new UnauthorizedException("Неверный email или пароль");
  return this.issue(user.id,user.email,user.role);
 }
 async refresh(userId:string,token:string){
  const user=await this.db.user.findUnique({where:{id:userId}});
  if(!user||!user.isActive||!user.refreshHash||!(await bcrypt.compare(token,user.refreshHash))) throw new UnauthorizedException("Refresh token недействителен");
  return this.issue(user.id,user.email,user.role);
 }
 private async issue(id:string,email:string,role:string){
  const accessToken=await this.jwt.signAsync({sub:id,email,role},{secret:this.config.getOrThrow("JWT_ACCESS_SECRET"),expiresIn:"15m"});
  const refreshToken=randomBytes(48).toString("base64url");
  await this.db.user.update({where:{id},data:{refreshHash:await bcrypt.hash(refreshToken,12)}});
  return {accessToken,refreshToken,tokenType:"Bearer",expiresIn:900,user:{id,email,role}};
 }
}
