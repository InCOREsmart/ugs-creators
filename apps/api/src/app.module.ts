import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ThrottlerModule } from "@nestjs/throttler";
import { HealthController } from "./health.controller";
import { AuthController } from "./auth.controller";
import { CampaignsController } from "./campaigns.controller";
import { MediaController } from "./media.controller";
import { AuthService } from "./auth.service";
import { PrismaService } from "./prisma.service";
import { S3Service } from "./s3.service";
import { VideoQueueService } from "./video-queue.service";
import { JwtStrategy } from "./jwt.strategy";
@Module({imports:[ConfigModule.forRoot({isGlobal:true}),JwtModule.register({}),PassportModule,ThrottlerModule.forRoot([{ttl:60000,limit:100}])],controllers:[HealthController,AuthController,CampaignsController,MediaController],providers:[PrismaService,AuthService,S3Service,VideoQueueService,JwtStrategy]})
export class AppModule {}
