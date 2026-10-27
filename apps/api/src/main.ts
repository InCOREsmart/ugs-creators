import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { AppModule } from "./app.module";
async function bootstrap() {
 const app = await NestFactory.create(AppModule,{cors:{origin:(process.env.CORS_ORIGINS??"http://localhost:5173").split(","),credentials:true}});
 app.use(helmet()); app.setGlobalPrefix("api/v1"); app.useGlobalPipes(new ValidationPipe({whitelist:true,transform:true,forbidNonWhitelisted:true})); app.enableShutdownHooks(); await app.listen(Number(process.env.PORT??3000),"0.0.0.0");
}
void bootstrap();
