export type ApiError = { statusCode?: number; message?: string | string[]; code?: string };
export type Creator = { id:string; displayName:string; taxStatus:string; engagementRate:number|null; user?:{fullName:string;email:string}; createdAt:string };
export type CreatorAssignment = { id:string; status:"ASSIGNED"|"ACCEPTED"|"DECLINED"; creator?:{id:string;displayName:string;user?:{email:string;fullName:string}} };\nexport type Campaign = { id:string; name:string; status:string; budgetKopecks:number|string; deadline:string|null; createdAt:string; organization?:{id:string;name:string}; creatorAssignments?:CreatorAssignment[] };
export type Page<T> = { items:T[]; page:number; limit:number; total:number };
export type Organization = { id:string; name:string; legalName?:string|null; inn?:string|null; createdAt:string };
export type MediaAsset = { id:string; campaignId:string; fileName:string; contentType:string; originalBytes:string; status:"UPLOAD_PENDING"|"QUEUED"|"PROCESSING"|"READY"|"FAILED"; durationSeconds:number|null; width:number|null; height:number|null; variants:unknown; thumbnailKey:string|null; errorMessage:string|null; createdAt:string; updatedAt:string };
export type UploadTicket = { uploadUrl:string; objectKey:string; mediaId?:string; requiredHeaders:Record<string,string>; expiresInSeconds:number };
const API_BASE = (import.meta.env.VITE_API_URL ?? "/api/v1").replace(/\/$/, "");
let accessToken: string | null = null;
export function setAccessToken(token:string|null){accessToken=token}
async function request<T>(path:string,init:RequestInit={}):Promise<T>{
 const headers=new Headers(init.headers); headers.set("Accept","application/json");
 if(init.body && !(init.body instanceof FormData)) headers.set("Content-Type","application/json");
 if(accessToken) headers.set("Authorization",`Bearer ${accessToken}`);
 const response=await fetch(`${API_BASE}${path}`,{...init,headers,credentials:"include"});
 if(!response.ok){let payload:ApiError={message:`Request failed (${response.status})`};try{payload=await response.json() as ApiError}catch{};const message=Array.isArray(payload.message)?payload.message.join(", "):payload.message;throw new Error(message||payload.code||`Request failed (${response.status})`)}
 if(response.status===204)return undefined as T;return response.json() as Promise<T>;
}
export const api={
 health:()=>request<{status:string}>("/health/ready"),
 login:(email:string,password:string)=>request<{accessToken:string;refreshToken:string;tokenType:string;expiresIn:number;user:{id:string;email:string;role:string}}>("/auth/login",{method:"POST",body:JSON.stringify({email,password})}),
 register:(email:string,password:string,fullName:string)=>request<{accessToken:string;refreshToken:string;user:unknown}>("/auth/register",{method:"POST",body:JSON.stringify({email,password,fullName})}),
 creators:(page=1,limit=25,q="")=>request<Page<Creator>>(`/creators?page=${page}&limit=${limit}&q=${encodeURIComponent(q)}`),
 createCreator:(data:Record<string,unknown>)=>request<Creator>("/creators",{method:"POST",body:JSON.stringify(data)}),
 campaigns:(page=1,limit=25)=>request<Page<Campaign>>(`/campaigns?page=${page}&limit=${limit}`),\n assignCreator:(campaignId:string,creatorId:string)=>request<CreatorAssignment>(`/campaigns/${encodeURIComponent(campaignId)}/creators`,{method:"POST",body:JSON.stringify({creatorId})}),\n respondToAssignment:(assignmentId:string,status:"ACCEPTED"|"DECLINED")=>request<CreatorAssignment>(`/campaigns/assignments/${encodeURIComponent(assignmentId)}/respond`,{method:"PATCH",body:JSON.stringify({status})}),
 organizations:()=>request<Organization[]>("/organizations/mine"),
 createOrganization:(data:{name:string;legalName?:string;inn?:string})=>request<Organization>("/organizations",{method:"POST",body:JSON.stringify(data)}),
 addOrganizationMember:(id:string,data:{email:string;role:"ORG_ADMIN"|"MANAGER"})=>request<{id:string;organizationId:string;userId:string;role:string}>(`/organizations/${id}/members`,{method:"POST",body:JSON.stringify(data)}),
 createCampaign:(data:{name:string;organizationId:string;budgetKopecks?:number;deadline?:string})=>request<Campaign>("/campaigns",{method:"POST",body:JSON.stringify(data)}),
 requestUpload:(data:{campaignId:string;fileName:string;contentType:string;sizeBytes:number})=>request<UploadTicket>("/media/upload-url",{method:"POST",body:JSON.stringify(data)}),
 media:(campaignId:string)=>request<MediaAsset[]>(`/media/campaign/${encodeURIComponent(campaignId)}`),
 enqueueVideo:(data:{objectKey:string;campaignId:string})=>request<{jobId:string;status:string}>("/media/process",{method:"POST",body:JSON.stringify(data)}),
};
