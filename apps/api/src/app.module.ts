import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ThrottlerModule } from "@nestjs/throttler";
import { HealthController } from "./health.controller";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PrismaService } from "./prisma.service";
import { JwtStrategy } from "./jwt.strategy";
@Module({imports:[ConfigModule.forRoot({isGlobal:true}),JwtModule.register({}),PassportModule,ThrottlerModule.forRoot([{ttl:60000,limit:100}])],controllers:[HealthController,AuthController],providers:[PrismaService,AuthService,JwtStrategy]})
export class AppModule {}
