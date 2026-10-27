import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { HealthController } from "./health.controller";
import { AuthController } from "./auth.controller";
import { CampaignsController } from "./campaigns.controller";
import { CreatorsController } from "./creators.controller";
import { MediaController } from "./media.controller";
import { AuthService } from "./auth.service";
import { PrismaService } from "./prisma.service";
import { S3Service } from "./s3.service";
import { VideoQueueService } from "./video-queue.service";
import { JwtStrategy } from "./jwt.strategy";
@Module({imports:[ConfigModule.forRoot({isGlobal:true}),JwtModule.register({}),PassportModule,ThrottlerModule.forRoot([{ttl:60000,limit:100}])],controllers:[HealthController,AuthController,CampaignsController,CreatorsController,MediaController],providers:[PrismaService,AuthService,S3Service,VideoQueueService,JwtStrategy,{provide:APP_GUARD,useClass:ThrottlerGuard}]})
export class AppModule {}
