import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { IsEmail, IsString, MinLength } from "class-validator";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
class RegisterDto { @IsEmail() email!:string; @IsString() @MinLength(12) password!:string; @IsString() @MinLength(2) fullName!:string; }
class LoginDto { @IsEmail() email!:string; @IsString() password!:string; }
class RefreshDto { @IsString() userId!:string; @IsString() refreshToken!:string; }
@Controller("auth")
export class AuthController {
 constructor(private auth:AuthService){}
 @Post("register") register(@Body() dto:RegisterDto){return this.auth.register(dto);}
 @Post("login") login(@Body() dto:LoginDto){return this.auth.login(dto.email,dto.password);}
 @Post("refresh") refresh(@Body() dto:RefreshDto){return this.auth.refresh(dto.userId,dto.refreshToken);}
 @UseGuards(JwtAuthGuard) @Get("me") me(@Req() req:any){return {id:req.user.sub,email:req.user.email,role:req.user.role};}
}
