import { useState } from "react";
import { Activity, Bell, BriefcaseBusiness, CheckCircle2, ChevronDown, CircleDollarSign, FileText, LayoutDashboard, Search, Settings, Users, Video, Wallet, ArrowUpRight, MoreHorizontal, Plus, Filter, CalendarDays } from "lucide-react";

type Section = "Обзор" | "Креаторы" | "Кампании" | "Контент" | "Договоры" | "Выплаты" | "Аналитика";
const nav = [
  { label: "Обзор" as Section, icon: LayoutDashboard },
  { label: "Креаторы" as Section, icon: Users },
  { label: "Кампании" as Section, icon: BriefcaseBusiness },
  { label: "Контент" as Section, icon: Video },
  { label: "Договоры" as Section, icon: FileText },
  { label: "Выплаты" as Section, icon: Wallet },
  { label: "Аналитика" as Section, icon: Activity },
];
const creators = [
  { name: "Екатерина Лукьянова", handle: "@katya.luk", platform: "Instagram", followers: "124,8 тыс.", er: "4,8%", campaign: "Осенний запуск", status: "В работе", tone: "blue" },
  { name: "Ксения Соколова", handle: "@ksenia.content", platform: "TikTok", followers: "89,2 тыс.", er: "6,1%", campaign: "UGC · октябрь", status: "На согласовании", tone: "violet" },
  { name: "Алла Левонова", handle: "@alla.daily", platform: "Instagram", followers: "56,4 тыс.", er: "3,9%", campaign: "Beauty routine", status: "Ожидает бриф", tone: "orange" },
  { name: "Анна Зверева", handle: "@anna.creates", platform: "YouTube", followers: "42,7 тыс.", er: "5,2%", campaign: "Осенний запуск", status: "В работе", tone: "green" },
  { name: "Нина Дульберова", handle: "@nina.video", platform: "TikTok", followers: "31,6 тыс.", er: "7,4%", campaign: "—", status: "Свободна", tone: "pink" },
];
const campaigns = [
  { name: "Осенний запуск", brand: "NOVA Beauty", people: "12 креаторов", progress: 76, status: "Контент", date: "31 окт." },
  { name: "UGC · октябрь", brand: "Дом и форма", people: "8 креаторов", progress: 54, status: "Согласование", date: "02 ноя." },
  { name: "Beauty routine", brand: "LUMI", people: "6 креаторов", progress: 32, status: "Создание", date: "05 ноя." },
];
export default function App() {
  const [active, setActive] = useState<Section>("Обзор");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("Заказчик");
  const filtered = creators.filter(c => (c.name + " " + c.handle + " " + c.campaign).toLowerCase().includes(query.toLowerCase()));
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><i/><i/><i/></div><span>UGS <b>Creators</b></span></div>
      <button className="workspace"><span className="workspace-logo">U</span><span className="workspace-copy"><b>UGS Studio</b><small>Рабочее пространство</small></span><ChevronDown size={15}/></button>
      <label className="searchbox"><Search size={16}/><input placeholder="Найти креатора или раздел" value={query} onChange={e => setQuery(e.target.value)}/></label>
      <div className="nav-label">РАБОЧЕЕ ПРОСТРАНСТВО</div>
      <nav>{nav.map(({ label, icon: Icon }) => <button key={label} className={active === label ? "nav-item active" : "nav-item"} onClick={() => setActive(label)}><Icon size={17}/><span>{label}</span>{label === "Кампании" && <em>3</em>}</button>)}</nav>
      <div className="sidebar-bottom"><button className="nav-item"><Settings size={17}/><span>Настройки</span></button><div className="profile-mini"><div className="avatar avatar-blue">ИЧ</div><div className="profile-copy"><b>Игнатий Чередов</b><small>Администратор</small></div><MoreHorizontal size={18}/></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="breadcrumbs">Рабочее пространство <span>/</span> <b>{active}</b></div><div className="top-actions"><button className="icon-button"><Bell size={18}/><i/></button><div className="top-divider"/><button className="role-switch" onClick={() => setRole(role === "Заказчик" ? "Креатор" : "Заказчик")}>{role}<ChevronDown size={14}/></button><div className="avatar avatar-blue">ИЧ</div></div></header>
      <div className="content">
        <div className="page-heading"><div><div className="eyebrow">ВТОРНИК, 27 ОКТЯБРЯ</div><h1>{active === "Обзор" ? "Добрый день, Игнатий" : active}</h1><p>{active === "Обзор" ? "Вот что происходит с вашими кампаниями сегодня." : "Управляйте процессами и держите всё под контролем в одном месте."}</p></div><button className="button primary" onClick={() => setActive(active === "Креаторы" ? "Кампании" : "Креаторы")}><Plus size={16}/>{active === "Креаторы" ? "Новая кампания" : "Добавить креатора"}</button></div>
        <div className="stat-grid">
          <Stat icon={<Users/>} label="Активные креаторы" value="100" change="+12 за месяц" note="из 124 в базе"/>
          <Stat icon={<BriefcaseBusiness/>} label="Активные кампании" value="18" change="+3 за неделю" note="4 требуют внимания"/>
          <Stat icon={<Video/>} label="Контент на согласовании" value="12" change="3 просрочено" note="среднее 1,8 дня" warn/>
          <Stat icon={<CircleDollarSign/>} label="Бюджет кампаний" value="₽ 2,48 млн" change="68% использовано" note="за текущий месяц"/>
        </div>
        <div className="section-grid">
          <section className="panel"><div className="panel-heading"><div><h2>Кампании в работе</h2><p>Текущие проекты и их прогресс</p></div><button className="text-button" onClick={() => setActive("Кампании")}>Все кампании <ArrowUpRight size={14}/></button></div>
            <div>{campaigns.map((c, i) => <div className="campaign-row" key={c.name}><div className={"campaign-icon c"+i}>{i === 0 ? <Activity/> : i === 1 ? <BriefcaseBusiness/> : <Video/>}</div><div className="campaign-info"><div className="campaign-title">{c.name}<span className="brand-name">{c.brand}</span></div><div className="campaign-meta"><span><Users size={13}/>{c.people}</span><span><CalendarDays size={13}/>Дедлайн {c.date}</span></div><div className="progress-track"><div style={{ width: c.progress + "%" }}/></div></div><div className="campaign-end"><span className="status-pill">{c.status}</span><b>{c.progress}%</b></div></div>)}</div>
          </section>
          <section className="panel"><div className="panel-heading"><div><h2>Требуют внимания</h2><p>Задачи, которые нельзя пропустить</p></div><span className="attention-count">4</span></div>
            <Attention icon={<Video/>} title="Согласование задерживается" desc="Ксения Соколова · UGC октябрь" time="2 ч назад"/><Attention icon={<FileText/>} title="Договор ожидает подписи" desc="Анна Зверева · Осенний запуск" time="5 ч назад"/><Attention icon={<Wallet/>} title="Выплата готова к отправке" desc="₽ 45 000 · Beauty routine" time="Сегодня"/><button className="attention-footer" onClick={() => setActive("Кампании")}>Открыть центр задач <ArrowUpRight size={14}/></button>
          </section>
        </div>
        <section className="panel creators-panel"><div className="panel-heading creators-heading"><div><h2>{active === "Креаторы" ? "Все креаторы" : "Недавно активные креаторы"}</h2><p>Результаты, статусы и текущие размещения</p></div><div className="table-actions"><label className="table-search"><Search size={15}/><input placeholder="Поиск по имени..." value={query} onChange={e => setQuery(e.target.value)}/></label><button className="button secondary" onClick={() => setQuery("")}><Filter size={15}/>Сбросить</button></div></div>
          <div className="table-wrap"><table><thead><tr><th>КРЕАТОР</th><th>ПЛАТФОРМА</th><th>ПОДПИСЧИКИ</th><th>ER</th><th>КАМПАНИЯ</th><th>СТАТУС</th><th/></tr></thead><tbody>{filtered.map(c => <tr key={c.handle}><td><div className="creator-cell"><div className={"avatar avatar-"+c.tone}>{c.name.split(" ").map(s => s[0]).slice(0,2).join("")}</div><div><b>{c.name}</b><small>{c.handle}</small></div></div></td><td><span className="platform-dot"/>{c.platform}</td><td className="numeric">{c.followers}</td><td className="numeric">{c.er}</td><td>{c.campaign}</td><td><span className={"creator-status "+(c.status === "В работе" ? "working" : c.status === "На согласовании" ? "review" : c.status === "Свободна" ? "free" : "wait")}>{c.status}</span></td><td><button className="more-button"><MoreHorizontal size={17}/></button></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="empty-state">Ничего не найдено. Попробуйте изменить запрос.</div>}</div>
          <div className="table-footer"><span>Показано {filtered.length} из 124 креаторов</span><button className="text-button" onClick={() => setActive("Креаторы")}>Открыть реестр <ArrowUpRight size={14}/></button></div>
        </section>
        <div className="bottom-grid"><section className="panel"><div className="panel-heading"><div><h2>Эффективность за месяц</h2><p>По всем активным кампаниям</p></div><button className="period-button">Октябрь <ChevronDown size={13}/></button></div><div className="metric-row"><div><small>Охват</small><b>1,84 млн</b><span>↗ 18,6%</span></div><div><small>Переходы</small><b>24 680</b><span>↗ 12,3%</span></div><div><small>Конверсии</small><b>1 284</b><span>↗ 8,4%</span></div></div><div className="chart"><svg viewBox="0 0 700 100" preserveAspectRatio="none"><path d="M0 76 C30 70 35 80 60 64 S95 72 120 55 S155 61 180 38 S220 62 245 50 S275 60 305 30 S340 42 365 36 S390 55 420 31 S455 46 485 20 S520 39 545 28 S580 35 605 16 S650 30 700 8 L700 100 L0 100Z" fill="#7187a81c"/><path d="M0 76 C30 70 35 80 60 64 S95 72 120 55 S155 61 180 38 S220 62 245 50 S275 60 305 30 S340 42 365 36 S390 55 420 31 S455 46 485 20 S520 39 545 28 S580 35 605 16 S650 30 700 8" fill="none" stroke="#7187a8" strokeWidth="2.2"/></svg></div><div className="chart-labels"><span>1 окт.</span><span>7 окт.</span><span>14 окт.</span><span>21 окт.</span><span>27 окт.</span></div></section>
          <section className="panel quick-panel"><div className="panel-heading"><div><h2>Быстрые действия</h2><p>Часто используемые операции</p></div></div><QuickAction icon={<Plus/>} title="Создать кампанию" desc="Новый проект и бриф" onClick={() => setActive("Кампании")}/><QuickAction icon={<Users/>} title="Найти креатора" desc="Поиск по базе и метрикам" onClick={() => setActive("Креаторы")}/><QuickAction icon={<FileText/>} title="Реестр документов" desc="Договоры и акты" onClick={() => setActive("Договоры")}/></section></div>
        <footer>UGS Creators <span>·</span> Управление креаторами без хаоса <span className="footer-right"><CheckCircle2 size={13}/> Интерфейс прототипа</span></footer>
      </div>
    </main>
  </div>;
}
function Stat({icon,label,value,change,note,warn}:{icon:React.ReactNode;label:string;value:string;change:string;note:string;warn?:boolean}){return <div className="stat-card"><div className="stat-top"><span className="stat-icon">{icon}</span><MoreHorizontal size={17} color="#9298a2"/></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-bottom"><span className={warn?"change warn":"change"}>{change}</span><span className="stat-note">{note}</span></div></div>}
function Attention({icon,title,desc,time}:{icon:React.ReactNode;title:string;desc:string;time:string}){return <div className="attention-row"><div className="attention-icon">{icon}</div><div className="attention-copy"><b>{title}</b><span>{desc}</span></div><small>{time}</small></div>}
function QuickAction({icon,title,desc,onClick}:{icon:React.ReactNode;title:string;desc:string;onClick:()=>void}){return <button className="quick-action" onClick={onClick}><span className="quick-icon">{icon}</span><span><b>{title}</b><small>{desc}</small></span><ArrowUpRight size={15}/></button>}
