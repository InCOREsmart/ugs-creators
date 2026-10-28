import { useEffect, useState } from "react";

type ModuleEvent = { id:string; title:string; detail:string; at:string };
type DemoModuleState = {
  connections: Record<string, boolean>;
  profiles: { url:string; network:string; score:number; status:string; checkedAt:string }[];
  documents: { id:string; title:string; status:string; createdAt:string }[];
  ledger: { id:string; creator:string; amount:number; status:string; createdAt:string }[];
  queue: { id:string; title:string; status:string; createdAt:string }[];
  events: ModuleEvent[];
  ord: { campaign:string; erid:string; status:string; updatedAt:string }[];
};
const KEY = "creator-own-modules-test-v1";
const networks = [
  {id:"youtube",label:"YouTube",detail:"OAuth и YouTube Data API"},
  {id:"vk",label:"VK",detail:"VK API"},
  {id:"telegram",label:"Telegram",detail:"Bot API"},
  {id:"tiktok",label:"TikTok",detail:"Login Kit / Display API"},
  {id:"instagram",label:"Instagram",detail:"Instagram Graph API"},
];
function initial():DemoModuleState {
  return {
    connections:{youtube:false,vk:false,telegram:false,tiktok:false,instagram:false},
    profiles:[],
    documents:[{id:"doc-test-001",title:"Договор на создание UGC-контента",status:"Черновик тестового шаблона",createdAt:new Date().toISOString()}],
    ledger:[{id:"ledger-test-001",creator:"Тестовый креатор",amount:15000,status:"Запланирована",createdAt:new Date().toISOString()}],
    queue:[{id:"job-test-001",title:"Проверка тестового видео",status:"В очереди",createdAt:new Date().toISOString()}],
    events:[{id:"event-test-001",title:"Тестовый контур активирован",detail:"Действия сохраняются только в этом браузере",at:new Date().toISOString()}],
    ord:[{campaign:"Тестовая UGC-кампания",erid:"ERID-TEST-0001",status:"Черновик · не отправлено в ОРД",updatedAt:new Date().toISOString()}],
  };
}
function read():DemoModuleState {
  try { const raw=localStorage.getItem(KEY); if(!raw)return initial(); const parsed=JSON.parse(raw) as DemoModuleState; return {...initial(),...parsed,connections:{...initial().connections,...parsed.connections}}; }
  catch { return initial(); }
}
const money=(n:number)=>new Intl.NumberFormat("ru-RU",{style:"currency",currency:"RUB",maximumFractionDigits:0}).format(n);
export default function ModulesPanel() {
  const [state,setState]=useState<DemoModuleState>(()=>read());
  const [profileUrl,setProfileUrl]=useState("");
  const [network,setNetwork]=useState("youtube");
  const [creator,setCreator]=useState("Тестовый креатор");
  const [amount,setAmount]=useState("15000");
  const [campaign,setCampaign]=useState("Тестовая UGC-кампания");
  const [message,setMessage]=useState("Тестовый контур. Внешние API и реальные платежи не вызываются.");
  useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}},[state]);
  function event(title:string,detail:string){return {id:globalThis.crypto?.randomUUID?.() ?? String(Date.now()),title,detail,at:new Date().toISOString()};}
  function toggleConnection(id:string){const next=!state.connections[id];setState(s=>({...s,connections:{...s.connections,[id]:next},events:[event(next?"Интеграция включена в тесте":"Интеграция отключена в тесте",networks.find(n=>n.id===id)?.label ?? id),...s.events].slice(0,20)}));setMessage("Изменение сохранено в тестовом контуре. Настоящее подключение требует ключей и OAuth.");}
  function checkProfile(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const url=profileUrl.trim();if(!/^https?:\/\//i.test(url)){setMessage("Введите полную ссылку профиля, начинающуюся с https://");return;}const score= Math.min(96,Math.max(35,Math.round(50+(url.length%31)+(network.length*2))));const item={url,network:networks.find(n=>n.id===network)?.label ?? network,score,status:"Предварительная оценка · без запроса к соцсети",checkedAt:new Date().toISOString()};setState(s=>({...s,profiles:[item,...s.profiles].slice(0,20),events:[event("Профиль добавлен в проверку",url),...s.events].slice(0,20)}));setProfileUrl("");setMessage("Создана демонстрационная оценка. Это не проверка реальной аудитории и не подтверждение подлинности профиля.");}
  function addDocument(){const id="doc-test-"+Date.now();setState(s=>({...s,documents:[{id,title:"Документ по кампании: "+campaign,status:"Черновик тестового шаблона",createdAt:new Date().toISOString()},...s.documents],events:[event("Создан тестовый документ",campaign),...s.events].slice(0,20)}));setMessage("Создана карточка документа. Юридически значимый договор не сформирован и не подписан.");}
  function addPayout(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const value=Number(amount);if(!Number.isFinite(value)||value<=0){setMessage("Укажите сумму больше нуля.");return;}setState(s=>({...s,ledger:[{id:"ledger-test-"+Date.now(),creator:creator.trim()||"Тестовый креатор",amount:value,status:"Запланирована",createdAt:new Date().toISOString()},...s.ledger],events:[event("Начисление добавлено в тестовый реестр",money(value)),...s.events].slice(0,20)}));setMessage("Начисление сохранено локально. Денежный перевод не выполнялся.");}
  function addJob(){setState(s=>({...s,queue:[{id:"job-test-"+Date.now(),title:"Тестовая задача обработки видео",status:"В очереди",createdAt:new Date().toISOString()},...s.queue].slice(0,20),events:[event("Задача добавлена в тестовую очередь","Видео / проверка"),...s.events].slice(0,20)}));setMessage("Задача добавлена в локальную имитацию очереди. Redis/worker не вызываются.");}
  function addOrd(){setState(s=>({...s,ord:[{campaign:campaign.trim()||"Тестовая кампания",erid:"ERID-TEST-"+Date.now().toString().slice(-6),status:"Черновик · не отправлено в ОРД",updatedAt:new Date().toISOString()},...s.ord].slice(0,20),events:[event("Создан черновик рекламной записи","Не отправлено во внешнюю систему"),...s.events].slice(0,20)}));setMessage("Создан черновик учёта рекламы. Ничего не отправлено в ОРД или ЕРИР.");}
  function reset(){localStorage.removeItem(KEY);setState(initial());setMessage("Тестовые данные сброшены.");}
  return <div className="module-workspace">
    <div className="notice-banner"><b>ТЕСТОВЫЙ РЕЖИМ</b><span>Данные сохраняются в localStorage этого браузера. Внешние сети, платежи, подписи и ОРД не вызываются.</span><button className="button secondary" onClick={reset}>Сбросить тестовые данные</button></div>
    <div className="stat-grid">
      <div className="stat-card"><div className="stat-label">Интеграции</div><div className="stat-value">{Object.values(state.connections).filter(Boolean).length}/{networks.length}</div><div className="stat-note">Переключатели теста</div></div>
      <div className="stat-card"><div className="stat-label">Профили в проверке</div><div className="stat-value">{state.profiles.length}</div><div className="stat-note">Демо-оценки</div></div>
      <div className="stat-card"><div className="stat-label">Задачи очереди</div><div className="stat-value">{state.queue.length}</div><div className="stat-note">Локальный сценарий</div></div>
      <div className="stat-card"><div className="stat-label">Тестовый реестр</div><div className="stat-value">{money(state.ledger.reduce((sum,item)=>sum+item.amount,0))}</div><div className="stat-note">Не реальные деньги</div></div>
    </div>
    <section className="panel"><div className="panel-heading"><div><h2>1. Интеграции социальных сетей</h2><p>Подготовка точек подключения. Переключатель не подключает настоящий аккаунт.</p></div></div><div className="module-grid">{networks.map(n=><div className="module-card" key={n.id}><div><b>{n.label}</b><small>{n.detail}</small></div><span className="status-pill">{state.connections[n.id]?"Включено в тесте":"Не подключено"}</span><button className={state.connections[n.id]?"button secondary":"button primary"} onClick={()=>toggleConnection(n.id)}>{state.connections[n.id]?"Отключить тест":"Включить тест"}</button></div>)}</div></section>
    <section className="panel"><div className="panel-heading"><div><h2>2. Проверка профиля креатора</h2><p>Сохраняем ссылку и демонстрационный балл. Реальные метрики требуют разрешённого API.</p></div></div><form className="form-grid form-grid-inline" onSubmit={checkProfile}><label>Социальная сеть<select value={network} onChange={e=>setNetwork(e.target.value)}>{networks.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}</select></label><label>Ссылка на профиль<input required type="url" value={profileUrl} onChange={e=>setProfileUrl(e.target.value)} placeholder="https://..."/></label><button className="button primary" type="submit">Проверить в тесте</button></form>{state.profiles.length>0&&<div className="table-wrap"><table><thead><tr><th>СЕТЬ</th><th>ПРОФИЛЬ</th><th>ДЕМО-БАЛЛ</th><th>СТАТУС</th></tr></thead><tbody>{state.profiles.map(p=><tr key={p.url+p.checkedAt}><td>{p.network}</td><td><a href={p.url} target="_blank" rel="noreferrer">{p.url}</a></td><td>{p.score}/100</td><td>{p.status}</td></tr>)}</tbody></table></div>}</section>
    <section className="panel"><div className="panel-heading"><div><h2>3. Документы и шаблоны</h2><p>Тестовые карточки документов без юридической подписи.</p></div><button className="button primary" onClick={addDocument}>Создать черновик</button></div><div className="table-wrap"><table><thead><tr><th>ДОКУМЕНТ</th><th>СТАТУС</th><th>СОЗДАН</th></tr></thead><tbody>{state.documents.map(d=><tr key={d.id}><td><b>{d.title}</b><small>{d.id}</small></td><td>{d.status}</td><td>{new Date(d.createdAt).toLocaleString("ru-RU")}</td></tr>)}</tbody></table></div></section>
    <section className="panel"><div className="panel-heading"><div><h2>4. Очередь фоновых задач</h2><p>Имитация очереди обработки, уведомлений и проверки файлов.</p></div><button className="button primary" onClick={addJob}>Добавить задачу</button></div><div className="table-wrap"><table><thead><tr><th>ЗАДАЧА</th><th>СТАТУС</th><th>СОЗДАНА</th></tr></thead><tbody>{state.queue.map(j=><tr key={j.id}><td>{j.title}<small>{j.id}</small></td><td><span className="status-pill">{j.status}</span></td><td>{new Date(j.createdAt).toLocaleString("ru-RU")}</td></tr>)}</tbody></table></div></section>
    <section className="panel"><div className="panel-heading"><div><h2>5. Финансовый реестр</h2><p>Начисления и статусы без фактического перечисления денег.</p></div></div><form className="form-grid form-grid-inline" onSubmit={addPayout}><label>Креатор<input value={creator} onChange={e=>setCreator(e.target.value)} required/></label><label>Сумма, ₽<input type="number" min="1" step="1" value={amount} onChange={e=>setAmount(e.target.value)} required/></label><button className="button primary" type="submit">Добавить начисление</button></form><div className="table-wrap"><table><thead><tr><th>КРЕАТОР</th><th>СУММА</th><th>СТАТУС</th><th>ДАТА</th></tr></thead><tbody>{state.ledger.map(p=><tr key={p.id}><td>{p.creator}</td><td>{money(p.amount)}</td><td><span className="status-pill">{p.status}</span></td><td>{new Date(p.createdAt).toLocaleDateString("ru-RU")}</td></tr>)}</tbody></table></div></section>
    <section className="panel"><div className="panel-heading"><div><h2>6. Учёт рекламы / ОРД</h2><p>Подготовка черновика. Отправки в ОРД и ЕРИР нет.</p></div><button className="button primary" onClick={addOrd}>Создать черновик</button></div><div className="table-wrap"><table><thead><tr><th>КАМПАНИЯ</th><th>ТЕСТОВЫЙ ИДЕНТИФИКАТОР</th><th>СТАТУС</th></tr></thead><tbody>{state.ord.map(o=><tr key={o.erid}><td>{o.campaign}</td><td>{o.erid}</td><td>{o.status}</td></tr>)}</tbody></table></div></section>
    <section className="panel"><div className="panel-heading"><div><h2>7. Журнал действий</h2><p>Последние события тестового контура.</p></div></div>{state.events.map(ev=><div className="campaign-row" key={ev.id}><div className="campaign-icon">✓</div><div className="campaign-info"><b>{ev.title}</b><div className="campaign-meta"><span>{ev.detail}</span></div></div><div className="campaign-end"><small>{new Date(ev.at).toLocaleString("ru-RU")}</small></div></div>)}</section>
    <div className="empty-state" role="status" aria-live="polite">{message}</div>
  </div>;
}
