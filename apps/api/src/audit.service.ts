import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
@Injectable()
export class AuditService {
 constructor(private db:PrismaService){}
 async record(input:{actorUserId?:string;action:string;entityType:string;entityId?:string;requestId?:string;ipAddress?:string;details?:Record<string,unknown>}){
  // Audit is deliberately append-only from application code; restrict DB grants in production.
  await this.db.$executeRaw`INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, request_id, ip_address, details, created_at)
   VALUES (${input.actorUserId??null}::uuid, ${input.action}, ${input.entityType}, ${input.entityId??null}::uuid, ${input.requestId??null}, ${input.ipAddress??null}::inet, ${JSON.stringify(input.details??{})}::jsonb, now())`;
 }
}
