import { useCallback, useEffect, useMemo, useState } from "react";
import CreatorIcon, { type CreatorIconName } from "./CreatorIcon";
import ModulesPanel from "./ModulesPanel";
import { api, IS_DEMO_MODE, setAccessToken, type Campaign, type Creator, type MediaAsset, type Organization } from "./api";

type Section = "Обзор" | "Организации" | "Креаторы" | "Кампании" | "Контент" | "Договоры" | "Выплаты" | "Аналитика" | "Модули";
type Session = { id: string; email: string; role: string; fullName?: string };
const nav: { label: Section; icon: CreatorIconName }[] = [
  { label: "Обзор" as Section, icon: "dashboard" },
  { label: "Организации" as Section, icon: "projects" },
  { label: "Креаторы" as Section, icon: "team" },
  { label: "Кампании" as Section, icon: "projects" },
  { label: "Контент" as Section, icon: "video" },
  { label: "Договоры" as Section, icon: "contract" },
  { label: "Выплаты" as Section, icon: "payments" },
  { label: "Аналитика" as Section, icon: "analytics" },
  { label: "Модули" as Section, icon: "settings" },
];
const roleName: Record<string, string> = { SUPER_ADMIN: "Кабинет владельца", ORG_ADMIN: "Кабинет бизнеса", MANAGER: "Менеджер", CREATOR: "Кабинет креатора" };
const statusName: Record<string, string> = { SEARCH: "Поиск", NEGOTIATION: "Переговоры", BRIEF_ACCEPTED: "Бриф принят", CONTRACT: "Договор", CONTENT_CREATION: "Создание контента", APPROVAL: "Согласование", PUBLICATION: "Публикация", PAYMENT: "Оплата", COMPLETED: "Завершена", CANCELLED: "Отменена" };

function BrandMark({ className = "brand-logo", decorative = false }: { className?: string; decorative?: boolean }) {
  return <svg className={className} viewBox="0 0 96 96" fill="none" role={decorative ? undefined : "img"} aria-label={decorative ? undefined : "Логотип CREATOR"} aria-hidden={decorative ? true : undefined} xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="5" width="86" height="86" rx="27" fill="#F7F5F0"/>
    <path d="M62 27.5A27 27 0 1 0 62 68.5" stroke="#26312F" strokeWidth="8" strokeLinecap="round"/>
    <path d="M59 21H76V38" stroke="#8199B5" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M76 21L55 42" stroke="#8199B5" strokeWidth="7" strokeLinecap="round"/>
  </svg>;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [currentPath, setCurrentPath] = useState(() => (window.location.pathname.replace(import.meta.env.BASE_URL, "/").replace(/\/$/, "") || "/"));
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [registerRole, setRegisterRole] = useState<"SUPER_ADMIN"|"ORG_ADMIN"|"CREATOR">("ORG_ADMIN");
  const [registration, setRegistration] = useState({phone:"",legalName:"",companyLegalName:"",taxStatus:"SELF_EMPLOYED",taxId:"",companyInn:"",kpp:"",ogrn:"",legalAddress:"",bankName:"",bankBik:"",bankAccount:"",bankCorrAccount:"",accountHolder:"",acceptTerms:false,acceptPrivacy:false,acceptOffer:false});
  const updateRegistration = (key:keyof typeof registration,value:string|boolean) => setRegistration(current=>({...current,[key]:value}));
  const [active, setActive] = useState<Section>("Обзор");
  const [query, setQuery] = useState("");
  const [creators, setCreators] = useState<Creator[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showCreateOrganization, setShowCreateOrganization] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [campaignOrgId, setCampaignOrgId] = useState("");
  const [campaignBudget, setCampaignBudget] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [organizationLegalName, setOrganizationLegalName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [mediaCampaignId, setMediaCampaignId] = useState("");
  const [mediaBusy, setMediaBusy] = useState(false);
  const [mediaMessage, setMediaMessage] = useState("");
  const [assignmentCampaignId, setAssignmentCampaignId] = useState("");
  const [assignmentCreatorId, setAssignmentCreatorId] = useState("");
  const [assignmentBusy, setAssignmentBusy] = useState(false);
  const [workflow, setWorkflow] = useState<{documents:{id:string;title:string;creator:string;campaign:string;status:string;amount:number}[];payouts:{id:string;creator:string;campaign:string;amount:number;status:string;date:string}[];activities:{id:string;title:string;detail:string;date:string}[]}>({documents:[],payouts:[],activities:[]});

  const loadData = useCallback(async () => {
    if (!session) return;
    setLoading(true); setError("");
    try {
      if (session.role === "CREATOR") {
        setCreators([]);
        const result = await api.campaigns(1, 100);
        setCampaigns(result.items);
      } else {
        const [creatorResult, campaignResult, organizationResult] = await Promise.all([api.creators(1, 100, query), api.campaigns(1, 100), api.organizations()]);
        setCreators(creatorResult.items);
        setCampaigns(campaignResult.items);
        setOrganizations(organizationResult);
        if (!campaignOrgId && organizationResult.length) setCampaignOrgId(organizationResult[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить данные API");
    } finally { setLoading(false); }
  }, [session, query, campaignOrgId]);

  useEffect(() => { void loadData(); }, [loadData]);
  const loadWorkflow = useCallback(async () => { try { setWorkflow(await api.workspace()); } catch {} }, []);
  useEffect(() => { if (session) void loadWorkflow(); }, [session, loadWorkflow]);
  async function updateWorkflow(kind:"documents"|"payouts",id:string,status:string) { await api.updateWorkflow(kind,id,status); await loadWorkflow(); }
  useEffect(() => { const syncPath = () => setCurrentPath(window.location.pathname.replace(import.meta.env.BASE_URL, "/").replace(/\/$/, "") || "/"); window.addEventListener("popstate", syncPath); return () => window.removeEventListener("popstate", syncPath); }, []);

  const loadMedia = useCallback(async (campaignId:string) => {
    if (!campaignId || session?.role === "CREATOR") { setMediaAssets([]); return; }
    try { setMediaAssets(await api.media(campaignId)); setMediaMessage(""); }
    catch (e) { setMediaMessage(e instanceof Error ? e.message : "Не удалось загрузить список материалов"); }
  }, [session]);

  useEffect(() => {
    if (active === "Контент" && session?.role !== "CREATOR" && campaigns.length) {
      const id = campaigns.some(c => c.id === mediaCampaignId) ? mediaCampaignId : campaigns[0].id;
      if (id !== mediaCampaignId) setMediaCampaignId(id);
      void loadMedia(id);
    }
  }, [active, session, campaigns, mediaCampaignId, loadMedia]);

  async function assignCreator(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); if(!assignmentCampaignId || !assignmentCreatorId)return; setAssignmentBusy(true);setError("");
    try { await api.assignCreator(assignmentCampaignId,assignmentCreatorId); await loadData(); setAssignmentCreatorId(""); }
    catch(e) { setError(e instanceof Error ? e.message : "Не удалось назначить креатора"); }
    finally { setAssignmentBusy(false); }
  }

  async function changeCampaignStatus(id:string,status:string) { setError(""); try { await api.updateCampaignStatus(id,status); await loadData(); await loadWorkflow(); } catch(e) { setError(e instanceof Error ? e.message : "Не удалось изменить этап кампании"); } }

  async function respondToAssignment(assignmentId:string,status:"ACCEPTED"|"DECLINED") {
    setError("");try { await api.respondToAssignment(assignmentId,status); await loadData(); }catch(e){setError(e instanceof Error ? e.message : "Не удалось сохранить ответ");}
  }

  async function uploadMedia(file:File) {
    if (!mediaCampaignId) { setMediaMessage("Сначала выберите кампанию."); return; }
    if (!/^video\/(mp4|quicktime|webm)$/.test(file.type)) { setMediaMessage("Поддерживаются видео MP4, QuickTime и WebM."); return; }
    if (file.size < 1 || file.size > 20 * 1024 * 1024 * 1024) { setMediaMessage("Размер файла должен быть не больше 20 ГБ."); return; }
    setMediaBusy(true); setMediaMessage("Добавляем материал в медиатеку…");
    try {
      if (IS_DEMO_MODE) {
        await api.addLocalMedia({campaignId:mediaCampaignId,fileName:file.name,contentType:file.type,sizeBytes:file.size});
        await loadMedia(mediaCampaignId);
        setMediaMessage("Материал добавлен. Внешнее хранилище не требуется.");
      } else {
        const ticket = await api.requestUpload({campaignId:mediaCampaignId,fileName:file.name,contentType:file.type,sizeBytes:file.size});
        setMediaMessage("Загружаем файл в хранилище…");
        const uploaded = await fetch(ticket.uploadUrl,{method:"PUT",headers:ticket.requiredHeaders,body:file});
        if (!uploaded.ok) throw new Error(`Хранилище отклонило загрузку (${uploaded.status})`);
        setMediaMessage("Файл загружен. Ставим на проверку и обработку…");
        await api.enqueueVideo({objectKey:ticket.objectKey,campaignId:mediaCampaignId});
        await loadMedia(mediaCampaignId);
        setMediaMessage("Загрузка завершена. Статус обработки обновится после проверки файла.");
      }
    } catch (e) { setMediaMessage(e instanceof Error ? e.message : "Не удалось загрузить видео"); }
    finally { setMediaBusy(false); }
  }

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoginBusy(true); setError("");
    try {
      const result = authMode === "register"
        ? await api.register(email, password, fullName.trim(), registerRole, registration)
        : await api.login(email, password);
      setAccessToken(result.accessToken);
      setSession(result.user as Session);
      setPassword("");
      setFullName("");
    } catch (err) { setError(err instanceof Error ? err.message : authMode === "register" ? "Не удалось зарегистрироваться" : "Не удалось войти"); }
    finally { setLoginBusy(false); }
  }
  async function logout() { try { await api.logout(); } catch {} finally { setAccessToken(null); setSession(null); setCreators([]); setCampaigns([]); setOrganizations([]); setError(""); } }

  async function submitCampaign(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError("");
    try { await api.createCampaign({name:campaignName,organizationId:campaignOrgId,budgetKopecks:Math.round(Number(campaignBudget || 0)*100)}); setCampaignName(""); setCampaignBudget(""); setShowCreateCampaign(false); await loadData(); }
    catch (err) { setError(err instanceof Error ? err.message : "Не удалось создать кампанию"); }
  }
  async function submitOrganization(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError("");
    try { const org=await api.createOrganization({name:organizationName,legalName:organizationLegalName || undefined}); setOrganizations(current=>[...current,org]); setCampaignOrgId(org.id); setOrganizationName(""); setOrganizationLegalName(""); setShowCreateOrganization(false); }
    catch (err) { setError(err instanceof Error ? err.message : "Не удалось создать организацию"); }
  }

  const filteredCreators = useMemo(() => creators.filter(c => {
    const name = c.displayName + " " + (c.user?.fullName ?? "") + " " + (c.user?.email ?? "");
    return name.toLowerCase().includes(query.toLowerCase());
  }), [creators, query]);

  if (!["/", "/login", "/app", "/dashboard"].includes(currentPath)) return <main className="not-found-page"><section className="not-found-card"><BrandMark className="brand-logo" /><span className="not-found-code">404</span><h1>Кажется, эта страница потерялась.</h1><p>Ссылка ведёт в пустоту. Вернитесь в рабочее пространство, а мы оставим навигацию в порядке.</p><a className="button primary" href={import.meta.env.BASE_URL}>Вернуться в CREATOR</a></section></main>;

  if (!session) return <div className="app-shell login-shell"><main className="main login-main"><div className="content login-content"><div className="brand login-brand"><BrandMark className="brand-logo" /><span>CREATOR <b>studio</b></span></div><section className="panel login-panel"><div className="eyebrow">CREATOR WORKSPACE</div><h1>{authMode === "register" ? "Создайте аккаунт CREATOR." : "Идеи заслуживают сильной реализации."}</h1><p>{authMode === "register" ? "Создайте учётную запись для работы с кампаниями и сотрудничеством." : "Войдите в CREATOR, чтобы управлять кампаниями, контентом и сотрудничеством в одном месте."}</p><form onSubmit={login} className="form-grid">{authMode === "register" && <label>Имя и фамилия<input type="text" autoComplete="name" required minLength={2} maxLength={120} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Как к вам обращаться"/></label>}{authMode === "register" && <label>Тип аккаунта<select value={registerRole} onChange={e=>setRegisterRole(e.target.value as "SUPER_ADMIN"|"ORG_ADMIN"|"CREATOR")}><option value="SUPER_ADMIN">Управление платформой</option><option value="ORG_ADMIN">Бизнес / бренд</option><option value="CREATOR">Креатор</option></select></label>}{authMode === "register" && registerRole !== "SUPER_ADMIN" && <div className="registration-fields">
<div className="registration-section"><b>Контактные данные</b><span>Для связи по кампаниям и документам</span></div>
<label>Телефон<input type="tel" autoComplete="tel" required value={registration.phone} onChange={e=>updateRegistration("phone",e.target.value)} placeholder="+7 900 000-00-00"/></label>
{registerRole === "CREATOR" ? <>
<div className="registration-section"><b>Юридические данные креатора</b><span>Для оформления договоров и выплат</span></div>
<label>ФИО по документам<input required value={registration.legalName} onChange={e=>updateRegistration("legalName",e.target.value)} placeholder="Полностью как в документах"/></label>
<label>Налоговый статус<select required value={registration.taxStatus} onChange={e=>updateRegistration("taxStatus",e.target.value)}><option value="SELF_EMPLOYED">Самозанятый</option><option value="IP">Индивидуальный предприниматель</option><option value="INDIVIDUAL">Физическое лицо</option></select></label>
<label>ИНН<input required inputMode="numeric" value={registration.taxId} onChange={e=>updateRegistration("taxId",e.target.value)} placeholder="ИНН получателя"/></label>
</> : <>
<div className="registration-section"><b>Реквизиты бизнеса</b><span>Для договоров и закрывающих документов</span></div>
<label>Название бренда / компании<input required value={registration.legalName} onChange={e=>updateRegistration("legalName",e.target.value)} placeholder="Название для отображения"/></label>
<label>Полное юридическое наименование<input required value={registration.companyLegalName} onChange={e=>updateRegistration("companyLegalName",e.target.value)} placeholder="Например, ООО «Компания»"/></label>
<label>ИНН организации<input required inputMode="numeric" value={registration.taxId} onChange={e=>updateRegistration("taxId",e.target.value)} placeholder="ИНН"/></label>
<div className="registration-two-col"><label>КПП<input value={registration.kpp} onChange={e=>updateRegistration("kpp",e.target.value)} placeholder="КПП"/></label><label>ОГРН / ОГРНИП<input value={registration.ogrn} onChange={e=>updateRegistration("ogrn",e.target.value)} placeholder="ОГРН"/></label></div>
<label>Юридический адрес<input required value={registration.legalAddress} onChange={e=>updateRegistration("legalAddress",e.target.value)} placeholder="Адрес регистрации"/></label>
</>}
<div className="registration-section"><b>Платёжные реквизиты</b><span>Для расчётов по договорам</span></div>
<label>Получатель платежа<input required value={registration.accountHolder} onChange={e=>updateRegistration("accountHolder",e.target.value)} placeholder="ФИО или юридическое лицо"/></label>
<label>Банк<input required value={registration.bankName} onChange={e=>updateRegistration("bankName",e.target.value)} placeholder="Название банка"/></label>
<div className="registration-two-col"><label>БИК<input required inputMode="numeric" value={registration.bankBik} onChange={e=>updateRegistration("bankBik",e.target.value)} placeholder="БИК"/></label><label>Расчётный счёт<input required inputMode="numeric" value={registration.bankAccount} onChange={e=>updateRegistration("bankAccount",e.target.value)} placeholder="Номер счёта"/></label></div>
<label>Корреспондентский счёт<input value={registration.bankCorrAccount} onChange={e=>updateRegistration("bankCorrAccount",e.target.value)} placeholder="При наличии"/></label>
<div className="registration-notice">Тестовый режим: не указывайте настоящие банковские реквизиты и реальные документы. Данные этой демоверсии сохраняются в браузере и не передаются в защищённую базу.</div>
<div className="registration-section"><b>Согласия и договоры</b><span>Все пункты обязательны для регистрации</span></div><div className="agreement-preview"><details><summary>Условия использования CREATOR</summary><p>Платформа предоставляет инструменты для взаимодействия бизнеса и креаторов, управления кампаниями, контентом, согласованиями и выплатами. Пользователь обязуется предоставлять достоверные сведения, не передавать доступ третьим лицам и соблюдать права на контент. В тестовом режиме отдельные функции могут быть имитацией.</p></details><details><summary>Обработка персональных данных</summary><p>Контактные, юридические и платёжные данные используются для создания профиля, подготовки документов, связи по кампаниям и организации расчётов. В этой демонстрации данные сохраняются локально в браузере. Перед промышленным запуском необходимо опубликовать утверждённую политику, настроить защищённое серверное хранение и сроки удаления данных.</p></details><details><summary>Договор-оферта и электронный документооборот</summary><p>В рабочей версии условия сотрудничества, вознаграждение, порядок приёмки результата, сроки оплаты, ответственность сторон и порядок электронного подписания должны фиксироваться в договоре по каждой кампании. Этот текст является демонстрационным и не заменяет утверждённую юридическую оферту.</p></details></div>
<label className="consent-row"><input type="checkbox" required checked={registration.acceptTerms} onChange={e=>updateRegistration("acceptTerms",e.target.checked)}/><span>Принимаю условия использования платформы CREATOR.</span></label>
<label className="consent-row"><input type="checkbox" required checked={registration.acceptPrivacy} onChange={e=>updateRegistration("acceptPrivacy",e.target.checked)}/><span>Согласен(на) на обработку персональных данных для работы сервиса.</span></label>
<label className="consent-row"><input type="checkbox" required checked={registration.acceptOffer} onChange={e=>updateRegistration("acceptOffer",e.target.checked)}/><span>Принимаю условия договора-оферты и электронного документооборота.</span></label>
</div>}<label>Email<input type="email" autoComplete="username" required value={email} onChange={e => { const value=e.target.value; setEmail(value); setEmailError(value && value.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "Проверьте адрес: нужен формат name@company.ru." : ""); }} aria-invalid={Boolean(emailError)} aria-describedby="email-hint" placeholder="name@company.ru" autoCapitalize="none" spellCheck={false}/></label><small id="email-hint" className={emailError ? "field-hint field-error" : "field-hint"} aria-live="polite">{emailError || "Рабочая почта, привязанная к вашей учётной записи"}</small><label>Пароль<input type="password" autoComplete={authMode === "register" ? "new-password" : "current-password"} required minLength={authMode === "register" ? 12 : undefined} value={password} onChange={e => setPassword(e.target.value)} placeholder={authMode === "register" ? "Не менее 12 символов" : "Введите пароль"}/>{authMode === "register" && <small className="field-hint">Минимум 12 символов</small>}</label>{error && <div role="alert" className="error-state">{error}</div>}<button className="button primary" disabled={loginBusy || Boolean(emailError) || (authMode === "register" && (!registration.acceptTerms || !registration.acceptPrivacy || !registration.acceptOffer))} type="submit">{loginBusy ? <><span className="button-spinner" aria-hidden="true"/>{authMode === "register" ? "Создаём аккаунт…" : "Входим…"}</> : authMode === "register" ? "Зарегистрироваться" : "Войти"}</button></form><div className="auth-switch"><span>{authMode === "register" ? "Уже есть аккаунт?" : "Впервые в CREATOR?"}</span><button className="text-button" type="button" onClick={() => { setAuthMode(mode => mode === "login" ? "register" : "login"); setError(""); setPassword(""); }}>{authMode === "register" ? "Войти" : "Создать аккаунт"}</button></div></section><footer className="login-footer">CREATOR <span>·</span> Защищённое рабочее пространство</footer></div></main></div>;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><BrandMark className="brand-logo" /><span>CREATOR <b>studio</b></span></div>
      <div className="workspace"><BrandMark className="workspace-logo" decorative /><span className="workspace-copy"><b>{roleName[session.role] ?? "Рабочее пространство"}</b><small>{session.fullName || session.email}</small></span></div>
      {session.role !== "CREATOR" && <label className="searchbox"><CreatorIcon name="search" size={16}/><input placeholder="Найти креатора или кампанию" value={query} onChange={e => setQuery(e.target.value)}/></label>}
      <div className="nav-label">{session.role === "SUPER_ADMIN" ? "УПРАВЛЕНИЕ ПЛАТФОРМОЙ" : session.role === "ORG_ADMIN" ? "РАБОТА БРЕНДА" : "МОЯ РАБОТА"}</div>
      <nav>{(session.role === "SUPER_ADMIN" ? nav.filter(item => item.label !== "Модули" || IS_DEMO_MODE) : session.role === "ORG_ADMIN" ? nav.filter(item => ["Обзор","Организации","Креаторы","Кампании","Контент","Договоры","Выплаты","Аналитика"].includes(item.label)) : nav.filter(item => ["Обзор","Кампании","Контент","Договоры","Выплаты"].includes(item.label))).map(({ label, icon }) => <button key={label} className={active === label ? "nav-item active" : "nav-item"} onClick={() => setActive(label)}><CreatorIcon name={icon} size={17}/><span>{session.role === "SUPER_ADMIN" && label === "Организации" ? "Бренды" : label === "Обзор" && session.role === "SUPER_ADMIN" ? "Главная" : label}</span>{label === "Кампании" && campaigns.length > 0 && <em>{campaigns.length}</em>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="nav-item"><CreatorIcon name="settings" size={17}/><span>{roleName[session.role] ?? session.role}</span></div><button className="nav-item" onClick={logout}><CreatorIcon name="logout" size={17}/><span>Выйти</span></button></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="breadcrumbs">{roleName[session.role] ?? "Рабочее пространство"} <span>/</span> <b>{active}</b></div><div className="top-actions"><button className="icon-button" title="Обновить данные" onClick={() => void loadData()}><CreatorIcon name="refresh" size={17}/></button><div className="top-divider"/><span>{roleName[session.role] ?? session.role}</span></div></header>
      <div className="content">
        <div className="page-heading"><div><div className="eyebrow">{session.role === "SUPER_ADMIN" ? "ЦЕНТР УПРАВЛЕНИЯ" : session.role === "ORG_ADMIN" ? "КАБИНЕТ БИЗНЕСА" : "КАБИНЕТ КРЕАТОРА"}</div><h1>{session.role === "SUPER_ADMIN" && active === "Обзор" ? "Главная" : active}</h1><p>{session.role === "SUPER_ADMIN" ? "Единый учёт креаторов, брендов, кампаний, документов и выплат." : session.role === "ORG_ADMIN" ? "Кампании бренда, назначенные авторы, согласование и бюджет." : "Ваши задания, материалы, согласования и начисления."}</p></div></div>
        {error && <div className="error-state" role="alert">{error} <button className="text-button" onClick={() => void loadData()}>Повторить</button></div>}
        {loading && <div className="loading-state" role="status" aria-live="polite"><span className="loader-orbit" aria-hidden="true"></span><b>Собираем рабочее пространство</b><span>Получаем актуальные данные из API</span><div className="skeleton-stack" aria-hidden="true"><i/><i/><i/></div></div>}
        {!loading && active === "Обзор" && <div className="stat-grid">
          <Stat icon={<CreatorIcon name="team"/>} label={session.role === "SUPER_ADMIN" ? "Всего креаторов" : session.role === "ORG_ADMIN" ? "Креаторы кампаний" : "Мои кампании"} value={session.role === "CREATOR" ? String(campaigns.length) : String(creators.length)} note={session.role === "CREATOR" ? "Назначено вам" : "В общем реестре"}/>
          <Stat icon={<CreatorIcon name="projects"/>} label="Кампании" value={String(campaigns.length)} note="Кампании, доступные через API"/>
          <Stat icon={<CreatorIcon name="video"/>} label="Контент" value={String(mediaAssets.length)} note="Медиафайлы отображаются в разделе «Контент»"/>
          <Stat icon={<CreatorIcon name="check"/>} label={session.role === "SUPER_ADMIN" ? "Бренды" : session.role === "ORG_ADMIN" ? "Бюджет" : "Мой статус"} value={session.role === "SUPER_ADMIN" ? String(organizations.length) : session.role === "ORG_ADMIN" ? money(campaigns.reduce((s,c)=>s+Number(c.budgetKopecks)/100,0)) : "Активен"} note={session.role === "SUPER_ADMIN" ? "Организации в системе" : session.role === "ORG_ADMIN" ? "Совокупный бюджет кампаний" : "Учётная запись"}/>
        </div>}
        {(active === "Креаторы" || (active === "Обзор" && session.role !== "CREATOR")) && session.role !== "CREATOR" && <section className="panel creators-panel"><div className="panel-heading creators-heading"><div><h2>Реестр креаторов</h2><p>Профили, аудитория, коммерческие условия и доступность для кампаний</p></div><div className="table-actions"><label className="table-search"><CreatorIcon name="search" size={15}/><input placeholder="Имя, email..." value={query} onChange={e => setQuery(e.target.value)}/></label><button className="button secondary" onClick={() => void loadData()}><CreatorIcon name="refresh" size={15}/>Обновить</button></div></div><div className="table-wrap"><table><thead><tr><th>КРЕАТОР</th><th>EMAIL</th><th>ПОДПИСЧИКИ</th><th>ГЕО</th><th>ER</th><th>REELS, ₽</th><th>НАЛОГОВЫЙ СТАТУС</th></tr></thead><tbody>{filteredCreators.map(c => <tr key={c.id}><td><div className="creator-cell"><div className="avatar avatar-blue">{c.displayName.slice(0,2).toUpperCase()}</div><div><b>{c.displayName}</b><small>{c.user?.fullName ?? "Имя не указано"}</small></div></div></td><td>{c.user?.email ?? "—"}</td><td className="numeric">{Number(c.audienceMetrics?.followers ?? 0).toLocaleString("ru-RU")}</td><td>{String(c.audienceMetrics?.geo ?? "—")}</td><td className="numeric">{c.engagementRate == null ? "—" : String(c.engagementRate) + "%"}</td><td className="numeric">{money(Number(c.priceList?.reel ?? 0))}</td><td>{c.taxStatus}</td></tr>)}</tbody></table>{!loading && filteredCreators.length === 0 && <div className="empty-state">{error ? "Реестр недоступен до восстановления API." : "В реестре пока нет записей."}</div>}</div><div className="table-footer"><span>Записей: {filteredCreators.length}</span></div></section>}
        {(active === "Кампании" || (active === "Обзор" && session.role === "CREATOR")) && <section className="panel"><div className="panel-heading"><div><h2>Кампании</h2><p>Воронка сотрудничества от первого контакта до оплаты</p></div><div className="table-actions">{session.role !== "CREATOR" && <button className="button primary" onClick={() => setShowCreateCampaign(v=>!v)}><CreatorIcon name="plus" size={15}/>Новая кампания</button>}<button className="button secondary" onClick={() => void loadData()}><CreatorIcon name="refresh" size={15}/>Обновить</button></div></div>{showCreateCampaign && <form onSubmit={submitCampaign} className="form-grid form-grid-inline"><label>Название<input required minLength={2} value={campaignName} onChange={e=>setCampaignName(e.target.value)} placeholder="Название кампании" /></label><label>Организация<select required value={campaignOrgId} onChange={e=>setCampaignOrgId(e.target.value)}>{organizations.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label><label>Бюджет, ₽<input type="number" min="0" step="0.01" value={campaignBudget} onChange={e=>setCampaignBudget(e.target.value)} placeholder="0"/></label><button className="button primary" type="submit" disabled={!organizations.length}>Создать</button>{!organizations.length && <p>Сначала добавьте организацию в разделе «Организации».</p>}</form>}{session.role !== "CREATOR" && campaigns.length > 0 && creators.length > 0 && <form onSubmit={assignCreator} className="form-grid form-grid-inline"><label>Кампания для назначения<select required value={assignmentCampaignId} onChange={e=>setAssignmentCampaignId(e.target.value)}><option value="">Выберите кампанию</option>{campaigns.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Креатор<select required value={assignmentCreatorId} onChange={e=>setAssignmentCreatorId(e.target.value)}><option value="">Выберите креатора</option>{creators.map(c=><option key={c.id} value={c.id}>{c.displayName} · {c.user?.email ?? "без email"}</option>)}</select></label><button className="button primary" type="submit" disabled={assignmentBusy || !assignmentCampaignId || !assignmentCreatorId}>{assignmentBusy ? "Назначаем…" : "Назначить креатора"}</button></form>}{campaigns.length === 0 && !loading ? <div className="empty-state">{error ? "Не удалось получить кампании." : "Доступных кампаний пока нет."}</div> : campaigns.map(c => <div className="campaign-row" key={c.id}><div className="campaign-icon"><CreatorIcon name="projects"/></div><div className="campaign-info"><div className="campaign-title">{c.name}<span className="brand-name">{c.organization?.name ?? "Организация"}</span></div><div className="campaign-meta"><span>Бюджет: {new Intl.NumberFormat("ru-RU",{style:"currency",currency:"RUB",maximumFractionDigits:2}).format(Number(c.budgetKopecks)/100)}</span><span>{c.deadline ? "Дедлайн " + new Date(c.deadline).toLocaleDateString("ru-RU") : "Без дедлайна"}</span></div></div><div className="campaign-end">{session.role !== "CREATOR" ? <select aria-label={`Этап кампании ${c.name}`} value={c.status} onChange={e=>void changeCampaignStatus(c.id,e.target.value)}>{Object.entries(statusName).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select> : <span className="status-pill">{statusName[c.status] ?? c.status}</span>}{session.role === "CREATOR" && c.creatorAssignments?.[0] && <><span className="status-pill">{c.creatorAssignments[0].status === "ACCEPTED" ? "Вы приняли" : c.creatorAssignments[0].status === "DECLINED" ? "Отклонено" : "Ожидает ответа"}</span>{c.creatorAssignments[0].status === "ASSIGNED" && <div><button className="button primary" onClick={()=>void respondToAssignment(c.creatorAssignments![0].id,"ACCEPTED")}>Принять</button><button className="button secondary" onClick={()=>void respondToAssignment(c.creatorAssignments![0].id,"DECLINED")}>Отклонить</button></div>}</>}{session.role !== "CREATOR" && c.creatorAssignments?.length ? <small>{c.creatorAssignments.map(a=>a.creator?.displayName ?? "Креатор").join(", ")}</small> : null}</div></div>)}</section>}
        {active === "Организации" && <section className="panel"><div className="panel-heading"><div><h2>Организации</h2><p>Команды изолированы на уровне членства и API</p></div>{["SUPER_ADMIN","ORG_ADMIN"].includes(session.role) && <button className="button primary" onClick={()=>setShowCreateOrganization(v=>!v)}><CreatorIcon name="plus" size={15}/>Добавить организацию</button>}</div>{showCreateOrganization && <form onSubmit={submitOrganization} className="form-grid form-grid-inline"><label>Название<input required minLength={2} value={organizationName} onChange={e=>setOrganizationName(e.target.value)} placeholder="Название организации"/></label><label>Юридическое название<input value={organizationLegalName} onChange={e=>setOrganizationLegalName(e.target.value)} placeholder="Необязательно"/></label><button className="button primary" type="submit">Создать организацию</button></form>}{organizations.length ? organizations.map(o=><div className="campaign-row" key={o.id}><div className="campaign-icon"><CreatorIcon name="projects"/></div><div className="campaign-info"><div className="campaign-title">{o.name}</div><div className="campaign-meta"><span>{o.legalName || "Юридическое название не указано"}</span><span>Создана {new Date(o.createdAt).toLocaleDateString("ru-RU")}</span></div></div><div className="campaign-end"><span className="status-pill">Доступ есть</span></div></div>) : <div className="empty-state">Нет доступных организаций. Создайте организацию или попросите администратора добавить вас в команду.</div>}</section>}
        {active === "Контент" && <section className="panel"><div className="panel-heading"><div><h2>Медиатека кампании</h2><p>Файлы загружаются напрямую в S3-совместимое хранилище, затем проходят проверку и обработку.</p></div><button className="button secondary" disabled={!mediaCampaignId || mediaBusy} onClick={() => void loadMedia(mediaCampaignId)}><CreatorIcon name="refresh" size={15}/>Обновить</button></div>{session.role === "CREATOR" ? <div className="empty-state">Ваш контентный штаб. Материалы заказчика не отображаются в кабинете креатора. Откройте раздел «Кампании», чтобы увидеть назначенные проекты и ответить на приглашения.</div> : <><div><label>Кампания<select value={mediaCampaignId} onChange={e=>setMediaCampaignId(e.target.value)}><option value="">Выберите кампанию</option>{campaigns.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Загрузить видео<input type="file" accept="video/mp4,video/quicktime,video/webm" disabled={!mediaCampaignId || mediaBusy} onChange={e=>{const file=e.currentTarget.files?.[0];if(file)void uploadMedia(file);e.currentTarget.value="";}} /><small>MP4, MOV/QuickTime или WebM, до 20 ГБ</small></label></div>{mediaMessage && <div className="empty-state" role="status" >{mediaBusy && "⏳ "}{mediaMessage}</div>}<div className="table-wrap"><table><thead><tr><th>ФАЙЛ</th><th>РАЗМЕР</th><th>СТАТУС</th><th>ДЕТАЛИ</th><th>ДОБАВЛЕН</th></tr></thead><tbody>{mediaAssets.map(asset=><tr key={asset.id}><td><div className="creator-cell"><div className="avatar avatar-blue"><CreatorIcon name="video" size={16}/></div><div><b>{asset.fileName}</b><small>{asset.contentType}</small></div></div></td><td>{formatBytes(asset.originalBytes)}</td><td><span className="status-pill">{mediaStatus[asset.status] ?? asset.status}</span></td><td>{asset.status === "FAILED" ? (asset.errorMessage || "Ошибка обработки") : asset.durationSeconds ? `${Math.round(asset.durationSeconds)} сек · ${asset.width ?? "?"}×${asset.height ?? "?"}` : asset.status === "READY" ? "Готово к использованию" : "Проверка / обработка"}</td><td>{new Date(asset.createdAt).toLocaleDateString("ru-RU")}</td></tr>)}</tbody></table>{!mediaAssets.length && <div className="empty-state">{campaigns.length ? "Для этой кампании пока нет загруженных материалов." : "Сначала создайте кампанию в разделе «Кампании»."}</div>}</div></>}</section>}
        {active === "Договоры" && <section className="panel"><div className="panel-heading"><div><h2>Документы и согласование</h2><p>Подготовка документов, статусы и суммы по кампаниям</p></div><span className="status-pill">{workflow.documents.length} документа</span></div><div className="table-wrap"><table><thead><tr><th>ДОКУМЕНТ</th><th>КРЕАТОР</th><th>КАМПАНИЯ</th><th>СУММА</th><th>СТАТУС</th><th>ДЕЙСТВИЕ</th></tr></thead><tbody>{workflow.documents.map(d=><tr key={d.id}><td><b>{d.title}</b><small>{d.id}</small></td><td>{d.creator}</td><td>{d.campaign}</td><td className="numeric">{money(d.amount)}</td><td><span className="status-pill">{d.status}</span></td><td><select value={d.status} onChange={e=>void updateWorkflow("documents",d.id,e.target.value)}><option>Черновик</option><option>На согласовании</option><option>Подписан</option><option>Отклонён</option></select></td></tr>)}</tbody></table></div><div className="empty-state">Карточка документа хранит стороны, кампанию, сумму и этап согласования. Финальная генерация юридически значимых документов подключается отдельно.</div></section>}
        {active === "Выплаты" && <section className="panel"><div className="panel-heading"><div><h2>Реестр выплат</h2><p>Планирование гонораров и контроль прохождения оплаты</p></div><span className="status-pill">{workflow.payouts.length} выплаты</span></div><div className="table-wrap"><table><thead><tr><th>КРЕАТОР</th><th>КАМПАНИЯ</th><th>СУММА</th><th>ДАТА</th><th>СТАТУС</th><th>ИЗМЕНИТЬ</th></tr></thead><tbody>{workflow.payouts.map(p=><tr key={p.id}><td><b>{p.creator}</b></td><td>{p.campaign}</td><td className="numeric">{money(p.amount)}</td><td>{new Date(p.date).toLocaleDateString("ru-RU")}</td><td><span className="status-pill">{p.status}</span></td><td><select value={p.status} onChange={e=>void updateWorkflow("payouts",p.id,e.target.value)}><option>Запланирована</option><option>Ожидает подтверждения</option><option>К выплате</option><option>Выплачена</option><option>Приостановлена</option></select></td></tr>)}</tbody></table></div><div className="stat-grid"><Stat icon={<CreatorIcon name="payments"/>} label="Сумма реестра" value={money(workflow.payouts.reduce((s,p)=>s+p.amount,0))} note="По всем выплатам"/><Stat icon={<CreatorIcon name="check"/>} label="Завершено" value={String(workflow.payouts.filter(p=>p.status==="Выплачена").length)} note="Отмечено в реестре"/><Stat icon={<CreatorIcon name="calendar"/>} label="Ожидает действий" value={String(workflow.payouts.filter(p=>p.status!=="Выплачена").length)} note="Не закрытые выплаты"/></div><div className="empty-state">Статус «Выплачена» фиксирует завершение в рабочем реестре. Реальное перечисление денег здесь не выполняется.</div></section>}
        {active === "Модули" && session.role === "SUPER_ADMIN" && IS_DEMO_MODE && <ModulesPanel/>}
        {active === "Аналитика" && <><div className="stat-grid"><Stat icon={<CreatorIcon name="team"/>} label="Креаторы" value={String(creators.length)} note="В реестре"/><Stat icon={<CreatorIcon name="projects"/>} label="Кампании" value={String(campaigns.length)} note="Все этапы воронки"/><Stat icon={<CreatorIcon name="payments"/>} label="Совокупный бюджет" value={money(campaigns.reduce((s,c)=>s+Number(c.budgetKopecks)/100,0))} note="По всем кампаниям"/><Stat icon={<CreatorIcon name="check"/>} label="Завершено" value={String(campaigns.filter(c=>c.status==="COMPLETED").length)} note="Кампании"/></div><section className="panel"><div className="panel-heading"><div><h2>Воронка кампаний</h2><p>Распределение по текущим статусам</p></div></div>{Object.entries(statusName).map(([key,label])=>{const count=campaigns.filter(c=>c.status===key).length;return <div className="campaign-row" key={key}><div className="campaign-info"><b>{label}</b><div className="campaign-meta"><span>{count} кампаний</span></div></div><div className="campaign-end"><div className="progress-track"><span style={{width:(campaigns.length?count/campaigns.length*100:0)+"%"}}/></div></div></div>})}</section><section className="panel"><div className="panel-heading"><div><h2>Последние события</h2><p>Изменения в рабочем пространстве</p></div></div>{workflow.activities.map(a=><div className="campaign-row" key={a.id}><div className="campaign-icon"><CreatorIcon name="check"/></div><div className="campaign-info"><b>{a.title}</b><div className="campaign-meta"><span>{a.detail}</span></div></div><div className="campaign-end"><small>{new Date(a.date).toLocaleDateString("ru-RU")}</small></div></div>)}</section></>}
        {!(active === "Обзор" || active === "Организации" || active === "Креаторы" || active === "Кампании" || active === "Контент" || active === "Договоры" || active === "Выплаты" || active === "Аналитика" || active === "Модули") && <section className="panel"><h2>{active}</h2><p>Рабочее пространство</p></section>}
        <footer>UGS Creators <span>·</span> <span className="footer-right"><CreatorIcon name="check" size={13}/> Авторизованная сессия</span></footer>
      </div>
    </main>
  </div>;
}
const mediaStatus:Record<string,string> = {UPLOAD_PENDING:"Ожидает загрузки",QUEUED:"В очереди",PROCESSING:"Обрабатывается",READY:"Готов",FAILED:"Ошибка"};
function money(value:number){return new Intl.NumberFormat("ru-RU",{style:"currency",currency:"RUB",maximumFractionDigits:0}).format(value)}
function formatBytes(value:string|number){const bytes=Number(value);if(!Number.isFinite(bytes)||bytes<0)return "—";if(bytes<1024)return `${bytes} Б`;const units=["КБ","МБ","ГБ","ТБ"];let n=bytes/1024,i=0;while(n>=1024&&i<units.length-1){n/=1024;i++;}return `${n.toLocaleString("ru-RU",{maximumFractionDigits:1})} ${units[i]}`;}
function Stat({icon,label,value,note}:{icon:React.ReactNode;label:string;value:string;note:string}){return <div className="stat-card"><div className="stat-top"><span className="stat-icon">{icon}</span></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-bottom"><span className="stat-note">{note}</span></div></div>}
