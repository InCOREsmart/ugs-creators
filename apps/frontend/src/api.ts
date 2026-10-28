export type ApiError = { statusCode?: number; message?: string | string[]; code?: string };
export type Creator = { id:string; displayName:string; taxStatus:string; engagementRate:number|null; user?:{fullName:string;email:string}; createdAt:string; audienceMetrics?:Record<string,unknown>; priceList?:Record<string,unknown> };
export type CreatorAssignment = { id:string; status:"ASSIGNED"|"ACCEPTED"|"DECLINED"; creator?:{id:string;displayName:string;user?:{email:string;fullName:string}} };
export type Campaign = { id:string; name:string; status:string; budgetKopecks:number|string; deadline:string|null; createdAt:string; organization?:{id:string;name:string}; creatorAssignments?:CreatorAssignment[] };
export type Page<T> = { items:T[]; page:number; limit:number; total:number };
export type Organization = { id:string; name:string; legalName?:string|null; inn?:string|null; createdAt:string };
export type MediaAsset = { id:string; campaignId:string; fileName:string; contentType:string; originalBytes:string; status:"UPLOAD_PENDING"|"QUEUED"|"PROCESSING"|"READY"|"FAILED"; durationSeconds:number|null; width:number|null; height:number|null; variants:unknown; thumbnailKey:string|null; errorMessage:string|null; createdAt:string; updatedAt:string };
export type UploadTicket = { uploadUrl:string; objectKey:string; mediaId?:string; requiredHeaders:Record<string,string>; expiresInSeconds:number };
const CONFIGURED_API_BASE = (import.meta.env.VITE_API_URL ?? "").trim().replace(/\/$/, "");
const IS_GITHUB_PAGES = typeof window !== "undefined" && window.location.hostname.endsWith("github.io");
export const IS_DEMO_MODE = IS_GITHUB_PAGES && !CONFIGURED_API_BASE;
const API_BASE = CONFIGURED_API_BASE || (IS_GITHUB_PAGES ? "" : "/api/v1");
let accessToken: string | null = null;
type DemoUser = { id:string; email:string; password:string; fullName:string; role:"SUPER_ADMIN"|"ORG_ADMIN"|"CREATOR" };
const DEMO_USERS_KEY = "creator-demo-users-v1";
function readDemoUsers():DemoUser[] {
  try { const value = localStorage.getItem(DEMO_USERS_KEY); if (!value) return []; const users=JSON.parse(value) as Array<DemoUser & {role:string}>; const migrated=users.map(user=>({...user,role:(String(user.role)==="MANAGER" ? "SUPER_ADMIN" : user.role) as DemoUser["role"]})); localStorage.setItem(DEMO_USERS_KEY,JSON.stringify(migrated)); return migrated; }
  catch { return []; }
}
function demoAuth(email:string,password:string,fullName?:string,requestedRole:"SUPER_ADMIN"|"ORG_ADMIN"|"CREATOR"="SUPER_ADMIN") {
  const normalizedEmail=email.trim().toLowerCase();
  const users=readDemoUsers();
  if (fullName !== undefined) {
    if (users.some(user=>user.email===normalizedEmail)) throw new Error("Аккаунт с таким email уже зарегистрирован.");
    const user:DemoUser={id:globalThis.crypto?.randomUUID?.() ?? `demo-${Date.now()}`,email:normalizedEmail,password,fullName:fullName.trim(),role:requestedRole};
    users.push(user);
    localStorage.setItem(DEMO_USERS_KEY,JSON.stringify(users));
    return {accessToken:`demo-token-${user.id}`,refreshToken:"demo-refresh-token",tokenType:"Bearer",expiresIn:3600,user:{id:user.id,email:user.email,role:user.role,fullName:user.fullName}};
  }
  const user=users.find(item=>item.email===normalizedEmail && item.password===password);
  if(!user) throw new Error("Неверный email или пароль. Сначала создайте аккаунт.");
  return {accessToken:`demo-token-${user.id}`,refreshToken:"demo-refresh-token",tokenType:"Bearer",expiresIn:3600,user:{id:user.id,email:user.email,role:user.role,fullName:user.fullName}};
}
export function setAccessToken(token:string|null){accessToken=token}
type DemoState = { creators:Creator[]; organizations:Organization[]; campaigns:Campaign[]; media:MediaAsset[]; activities:{id:string;title:string;detail:string;date:string}[]; documents:{id:string;title:string;creator:string;campaign:string;status:string;amount:number}[]; payouts:{id:string;creator:string;campaign:string;amount:number;status:string;date:string}[] };
const DEMO_STATE_KEY = "creator-workspace-state-v1";
const now = new Date().toISOString();
const creatorSeeds = [
 ["Анна Морозова","anna.morozova@example.test",5.8,"SELF_EMPLOYED",128400,24,"Россия",85000],
 ["Марк Волков","mark.volkov@example.test",4.9,"IP",215000,31,"Россия",120000],
 ["Елена Соколова","elena.sokolova@example.test",7.2,"SELF_EMPLOYED",76200,19,"Россия",65000],
 ["Даниил Крылов","dan.krylov@example.test",3.6,"INDIVIDUAL",342000,27,"Казахстан",95000],
 ["Полина Белова","polina.belova@example.test",8.1,"SELF_EMPLOYED",58400,22,"Россия",70000],
 ["Артём Фомин","artem.fomin@example.test",4.2,"IP",178000,29,"Россия",110000],
 ["Виктория Орлова","v.orlova@example.test",6.7,"SELF_EMPLOYED",93400,18,"Беларусь",60000],
 ["Илья Громов","ilya.gromov@example.test",3.9,"INDIVIDUAL",402000,34,"Россия",135000],
 ["Ксения Лебедева","ksenia.lebedeva@example.test",9.4,"SELF_EMPLOYED",46700,21,"Россия",55000],
 ["Роман Захаров","roman.zakharov@example.test",5.1,"IP",196000,26,"Армения",100000],
 ["Алина Павлова","alina.pavlova@example.test",7.6,"SELF_EMPLOYED",81500,23,"Россия",75000]
] as const;
function seedDemoState():DemoState {
 const creators:Creator[]=creatorSeeds.map((x,i)=>({id:`creator-${i+1}`,displayName:x[0],user:{fullName:x[0],email:x[1]},taxStatus:x[3],engagementRate:x[2],createdAt:new Date(Date.now()-(i+2)*86400000).toISOString(),audienceMetrics:{followers:x[4],ageMedian:x[5],geo:x[6],genderFemale:62+(i%4)*5},priceList:{reel:x[7],post:Math.round(x[7]*.7),story:Math.round(x[7]*.35)}}));
 const organizations:Organization[]=[{id:"brand-1",name:"Север Studio",legalName:"ООО «Север Студио»",inn:"7701234567",createdAt:now},{id:"brand-2",name:"Luma Beauty",legalName:"ООО «Люма Бьюти»",inn:"7812345678",createdAt:now}];
 const campaigns:Campaign[]=[
 {id:"campaign-1",name:"Осенний запуск коллекции",status:"CONTENT_CREATION",budgetKopecks:185000000,deadline:new Date(Date.now()+5*86400000).toISOString(),createdAt:now,organization:organizations[0],creatorAssignments:[{id:"assign-1",status:"ACCEPTED",creator:{id:"creator-1",displayName:creators[0].displayName,user:creators[0].user}},{id:"assign-2",status:"ACCEPTED",creator:{id:"creator-3",displayName:creators[2].displayName,user:creators[2].user}},{id:"assign-3",status:"ASSIGNED",creator:{id:"creator-5",displayName:creators[4].displayName,user:creators[4].user}}]},
 {id:"campaign-2",name:"Beauty без фильтров",status:"APPROVAL",budgetKopecks:240000000,deadline:new Date(Date.now()+2*86400000).toISOString(),createdAt:now,organization:organizations[1],creatorAssignments:[{id:"assign-4",status:"ACCEPTED",creator:{id:"creator-2",displayName:creators[1].displayName,user:creators[1].user}},{id:"assign-5",status:"ACCEPTED",creator:{id:"creator-9",displayName:creators[8].displayName,user:creators[8].user}}]},
 {id:"campaign-3",name:"Обзор продукта в коротком видео",status:"NEGOTIATION",budgetKopecks:96000000,deadline:new Date(Date.now()+9*86400000).toISOString(),createdAt:now,organization:organizations[0],creatorAssignments:[{id:"assign-6",status:"ASSIGNED",creator:{id:"creator-4",displayName:creators[3].displayName,user:creators[3].user}}]},
 {id:"campaign-4",name:"Уходовая рутина: 7 дней",status:"PUBLICATION",budgetKopecks:155000000,deadline:new Date(Date.now()+1*86400000).toISOString(),createdAt:now,organization:organizations[1],creatorAssignments:[{id:"assign-7",status:"ACCEPTED",creator:{id:"creator-7",displayName:creators[6].displayName,user:creators[6].user}}]},
 {id:"campaign-5",name:"Городские маршруты",status:"PAYMENT",budgetKopecks:72000000,deadline:new Date(Date.now()-1*86400000).toISOString(),createdAt:now,organization:organizations[0],creatorAssignments:[{id:"assign-8",status:"ACCEPTED",creator:{id:"creator-8",displayName:creators[7].displayName,user:creators[7].user}}]},
 {id:"campaign-6",name:"Новая палитра",status:"COMPLETED",budgetKopecks:118000000,deadline:new Date(Date.now()-6*86400000).toISOString(),createdAt:now,organization:organizations[1],creatorAssignments:[{id:"assign-9",status:"ACCEPTED",creator:{id:"creator-11",displayName:creators[10].displayName,user:creators[10].user}}]}
 ];
 return {creators,organizations,campaigns,media:[],activities:[{id:"act-1",title:"Контент отправлен на согласование",detail:"Beauty без фильтров · Полина Белова",date:now},{id:"act-2",title:"Назначен креатор",detail:"Осенний запуск коллекции · Анна Морозова",date:now},{id:"act-3",title:"Платёж ожидает подтверждения",detail:"Городские маршруты · Илья Громов",date:now}],documents:[{id:"doc-1",title:"Договор на интеграцию № 024",creator:"Анна Морозова",campaign:"Осенний запуск коллекции",status:"На согласовании",amount:85000},{id:"doc-2",title:"Акт оказанных услуг № 018",creator:"Илья Громов",campaign:"Городские маршруты",status:"Подписан",amount:135000},{id:"doc-3",title:"Договор на публикацию № 031",creator:"Полина Белова",campaign:"Beauty без фильтров",status:"Черновик",amount:70000}],payouts:[{id:"pay-1",creator:"Илья Громов",campaign:"Городские маршруты",amount:135000,status:"К выплате",date:now},{id:"pay-2",creator:"Анна Морозова",campaign:"Осенний запуск коллекции",amount:85000,status:"Ожидает подтверждения",date:now},{id:"pay-3",creator:"Полина Белова",campaign:"Beauty без фильтров",amount:70000,status:"Запланирована",date:now}]};
}
function readDemoState():DemoState {
 try { const raw=localStorage.getItem(DEMO_STATE_KEY); if(raw) return JSON.parse(raw) as DemoState; } catch {}
 const state=seedDemoState(); localStorage.setItem(DEMO_STATE_KEY,JSON.stringify(state)); return state;
}
function writeDemoState(state:DemoState){localStorage.setItem(DEMO_STATE_KEY,JSON.stringify(state));}
function requestedCampaignVisible(c:Campaign){return true;}
function demoRequest<T>(path:string,init:RequestInit={}):T {
 const state=readDemoState(); const method=(init.method||"GET").toUpperCase(); const body=init.body && typeof init.body==="string" ? JSON.parse(init.body) : {};
 if(path.startsWith("/creators")) {
  if(method==="POST"){const item:Creator={id:`creator-${Date.now()}`,displayName:String(body.displayName||body.fullName||"Новый креатор"),user:{fullName:String(body.fullName||body.displayName||"Новый креатор"),email:String(body.email||"")},taxStatus:String(body.taxStatus||"INDIVIDUAL"),engagementRate:Number(body.engagementRate||0),createdAt:new Date().toISOString(),audienceMetrics:{followers:0,geo:"Не указано"},priceList:{}};state.creators.unshift(item);writeDemoState(state);return item as T;}
  const q=new URLSearchParams(path.split("?")[1]||"").get("q")?.toLowerCase()||"";const items=state.creators.filter(c=>(c.displayName+" "+(c.user?.email||"")).toLowerCase().includes(q));return {items,page:1,limit:100,total:items.length} as T;
 }
 if(path.startsWith("/organizations")) {
  if(path==="/organizations"&&method==="POST"){const item:Organization={id:`brand-${Date.now()}`,name:String(body.name||"Новый бренд"),legalName:body.legalName as string||"",createdAt:new Date().toISOString()};state.organizations.push(item);writeDemoState(state);return item as T;}
  return state.organizations as T;
 }
 if(path.startsWith("/campaigns")) {
  const respond=path.match(/\/campaigns\/assignments\/([^/]+)\/respond/);
  if(respond){state.campaigns=state.campaigns.map(c=>({...c,creatorAssignments:c.creatorAssignments?.map(a=>a.id===respond[1]?{...a,status:body.status}:a)}));writeDemoState(state);return {id:respond[1],status:body.status} as T;}
  const assign=path.match(/\/campaigns\/([^/]+)\/creators/);
  if(assign){const campaign=state.campaigns.find(c=>c.id===assign[1]);const creator=state.creators.find(c=>c.id===body.creatorId);if(campaign&&creator){campaign.creatorAssignments=[...(campaign.creatorAssignments||[]),{id:`assign-${Date.now()}`,status:"ASSIGNED",creator:{id:creator.id,displayName:creator.displayName,user:creator.user}}];writeDemoState(state);return campaign.creatorAssignments[campaign.creatorAssignments.length-1] as T;} }
  if(path==="/campaigns"&&method==="POST"){const org=state.organizations.find(o=>o.id===body.organizationId);const item:Campaign={id:`campaign-${Date.now()}`,name:String(body.name||"Новая кампания"),status:"SEARCH",budgetKopecks:Number(body.budgetKopecks||0),deadline:body.deadline as string||null,createdAt:new Date().toISOString(),organization:org,creatorAssignments:[]};state.campaigns.unshift(item);writeDemoState(state);return item as T;}
  const visible=state.campaigns.filter(c=>requestedCampaignVisible(c));return {items:visible,page:1,limit:100,total:visible.length} as T;
 }
 if(path.startsWith("/media")){if(path==="/media/local"&&method==="POST"){const item:MediaAsset={id:`media-${Date.now()}`,campaignId:String(body.campaignId),fileName:String(body.fileName),contentType:String(body.contentType),originalBytes:String(body.sizeBytes||0),status:"READY",durationSeconds:null,width:null,height:null,variants:{localPreview:true},thumbnailKey:null,errorMessage:null,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};state.media.unshift(item);state.activities.unshift({id:`act-${Date.now()}`,title:"Материал добавлен в медиатеку",detail:item.fileName,date:item.createdAt});writeDemoState(state);return item as T;}if(path==="/media/process"&&method==="POST")return {jobId:`job-${Date.now()}`,status:"QUEUED"} as T;if(path==="/media/upload-url")return {uploadUrl:"",objectKey:`local/${Date.now()}`,mediaId:`media-${Date.now()}`,requiredHeaders:{},expiresInSeconds:0} as T;const campaignId=path.split("/").pop();return state.media.filter(m=>m.campaignId===campaignId) as T;}
 if(path==="/workspace") return {documents:state.documents,payouts:state.payouts,activities:state.activities} as T;
 const workflowMatch=path.match(/^\/workspace\/(documents|payouts)\/([^/]+)$/);
 if(workflowMatch&&method==="PATCH"){const collection=workflowMatch[1]==="documents"?"documents":"payouts";const list=state[collection] as Array<{id:string;status:string}>;const item=list.find(x=>x.id===workflowMatch[2]);if(item){item.status=String(body.status||item.status);state.activities.unshift({id:`act-${Date.now()}`,title:collection==="documents"?"Изменён статус документа":"Изменён статус выплаты",detail:`${item.id} · ${item.status}`,date:new Date().toISOString()});writeDemoState(state);}return item as T;}
 return {} as T;
}
async function request<T>(path:string,init:RequestInit={}):Promise<T>{
 if (IS_DEMO_MODE) return demoRequest<T>(path,init);
 const headers=new Headers(init.headers); headers.set("Accept","application/json");
 if(init.body && !(init.body instanceof FormData)) headers.set("Content-Type","application/json");
 if(accessToken) headers.set("Authorization",`Bearer ${accessToken}`);
 const response=await fetch(`${API_BASE}${path}`,{...init,headers,credentials:"include"});
 if(!response.ok){let payload:ApiError={message:`Request failed (${response.status})`};try{payload=await response.json() as ApiError}catch{};const message=Array.isArray(payload.message)?payload.message.join(", "):payload.message;throw new Error(message||payload.code||`Request failed (${response.status})`)}
 if(response.status===204)return undefined as T;return response.json() as Promise<T>;
}
export const api={
 health:()=>request<{status:string}>("/health/ready"),
 login:(email:string,password:string)=>IS_DEMO_MODE ? Promise.resolve(demoAuth(email,password) as {accessToken:string;refreshToken:string;tokenType:string;expiresIn:number;user:{id:string;email:string;role:string}}) : request<{accessToken:string;refreshToken:string;tokenType:string;expiresIn:number;user:{id:string;email:string;role:string}}>("/auth/login",{method:"POST",body:JSON.stringify({email,password})}),
 register:(email:string,password:string,fullName:string,role:"SUPER_ADMIN"|"ORG_ADMIN"|"CREATOR"="SUPER_ADMIN")=>IS_DEMO_MODE ? Promise.resolve(demoAuth(email,password,fullName,role)) : request<{accessToken:string;refreshToken:string;user:unknown}>("/auth/register",{method:"POST",body:JSON.stringify({email,password,fullName})}),
 logout:()=>IS_DEMO_MODE ? Promise.resolve({success:true}) : request<{success:boolean}>("/auth/logout",{method:"POST"}),
 creators:(page=1,limit=25,q="")=>request<Page<Creator>>(`/creators?page=${page}&limit=${limit}&q=${encodeURIComponent(q)}`),
 createCreator:(data:Record<string,unknown>)=>request<Creator>("/creators",{method:"POST",body:JSON.stringify(data)}),
 campaigns:(page=1,limit=25)=>request<Page<Campaign>>(`/campaigns?page=${page}&limit=${limit}`),
 updateCampaignStatus:(id:string,status:string)=>request<Campaign>(`/campaigns/${encodeURIComponent(id)}`,{method:"PATCH",body:JSON.stringify({status})}),
 assignCreator:(campaignId:string,creatorId:string)=>request<CreatorAssignment>(`/campaigns/${encodeURIComponent(campaignId)}/creators`,{method:"POST",body:JSON.stringify({creatorId})}),
 respondToAssignment:(assignmentId:string,status:"ACCEPTED"|"DECLINED")=>request<CreatorAssignment>(`/campaigns/assignments/${encodeURIComponent(assignmentId)}/respond`,{method:"PATCH",body:JSON.stringify({status})}),
 organizations:()=>request<Organization[]>("/organizations/mine"),
 createOrganization:(data:{name:string;legalName?:string;inn?:string})=>request<Organization>("/organizations",{method:"POST",body:JSON.stringify(data)}),
 addOrganizationMember:(id:string,data:{email:string;role:"ORG_ADMIN"|"MANAGER"})=>request<{id:string;organizationId:string;userId:string;role:string}>(`/organizations/${id}/members`,{method:"POST",body:JSON.stringify(data)}),
 createCampaign:(data:{name:string;organizationId:string;budgetKopecks?:number;deadline?:string})=>request<Campaign>("/campaigns",{method:"POST",body:JSON.stringify(data)}),
 requestUpload:(data:{campaignId:string;fileName:string;contentType:string;sizeBytes:number})=>request<UploadTicket>("/media/upload-url",{method:"POST",body:JSON.stringify(data)}),
 media:(campaignId:string)=>request<MediaAsset[]>(`/media/campaign/${encodeURIComponent(campaignId)}`),
 addLocalMedia:(data:{campaignId:string;fileName:string;contentType:string;sizeBytes:number})=>request<MediaAsset>("/media/local",{method:"POST",body:JSON.stringify(data)}),
 workspace:()=>request<{documents:{id:string;title:string;creator:string;campaign:string;status:string;amount:number}[];payouts:{id:string;creator:string;campaign:string;amount:number;status:string;date:string}[];activities:{id:string;title:string;detail:string;date:string}[]}>("/workspace"),
 updateWorkflow:(kind:"documents"|"payouts",id:string,status:string)=>request<unknown>(`/workspace/${kind}/${encodeURIComponent(id)}`,{method:"PATCH",body:JSON.stringify({status})}),
 enqueueVideo:(data:{objectKey:string;campaignId:string})=>request<{jobId:string;status:string}>("/media/process",{method:"POST",body:JSON.stringify(data)}),
};
