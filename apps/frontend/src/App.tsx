import { useCallback, useEffect, useMemo, useState } from "react";
import CreatorIcon, { type CreatorIconName } from "./CreatorIcon";
import { api, setAccessToken, type Campaign, type Creator, type MediaAsset, type Organization } from "./api";

type Section = "Обзор" | "Организации" | "Креаторы" | "Кампании" | "Контент" | "Договоры" | "Выплаты" | "Аналитика";
type Session = { id: string; email: string; role: string };
const nav: { label: Section; icon: CreatorIconName }[] = [
  { label: "Обзор" as Section, icon: "dashboard" },
  { label: "Организации" as Section, icon: "projects" },
  { label: "Креаторы" as Section, icon: "team" },
  { label: "Кампании" as Section, icon: "projects" },
  { label: "Контент" as Section, icon: "video" },
  { label: "Договоры" as Section, icon: "contract" },
  { label: "Выплаты" as Section, icon: "payments" },
  { label: "Аналитика" as Section, icon: "analytics" },
];
const roleName: Record<string, string> = { SUPER_ADMIN: "Суперадминистратор", ORG_ADMIN: "Администратор организации", MANAGER: "Менеджер", CREATOR: "Креатор" };
const statusName: Record<string, string> = { SEARCH: "Поиск", NEGOTIATION: "Переговоры", BRIEF_ACCEPTED: "Бриф принят", CONTRACT: "Договор", CONTENT_CREATION: "Создание контента", APPROVAL: "Согласование", PUBLICATION: "Публикация", PAYMENT: "Оплата", COMPLETED: "Завершена", CANCELLED: "Отменена" };

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [currentPath, setCurrentPath] = useState(() => (window.location.pathname.replace(import.meta.env.BASE_URL, "/").replace(/\/$/, "") || "/"));
  const [password, setPassword] = useState("");
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
  useEffect(() => { const syncPath = () => setCurrentPath(window.location.pathname.replace(/\/$/, "") || "/"); window.addEventListener("popstate", syncPath); return () => window.removeEventListener("popstate", syncPath); }, []);

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

  async function respondToAssignment(assignmentId:string,status:"ACCEPTED"|"DECLINED") {
    setError("");try { await api.respondToAssignment(assignmentId,status); await loadData(); }catch(e){setError(e instanceof Error ? e.message : "Не удалось сохранить ответ");}
  }

  async function uploadMedia(file:File) {
    if (!mediaCampaignId) { setMediaMessage("Сначала выберите кампанию."); return; }
    if (!/^video\/(mp4|quicktime|webm)$/.test(file.type)) { setMediaMessage("Поддерживаются видео MP4, QuickTime и WebM."); return; }
    if (file.size < 1 || file.size > 20 * 1024 * 1024 * 1024) { setMediaMessage("Размер файла должен быть не больше 20 ГБ."); return; }
    setMediaBusy(true); setMediaMessage("Получаем защищённую ссылку…");
    try {
      const ticket = await api.requestUpload({campaignId:mediaCampaignId,fileName:file.name,contentType:file.type,sizeBytes:file.size});
      setMediaMessage("Загружаем файл в хранилище…");
      const uploaded = await fetch(ticket.uploadUrl,{method:"PUT",headers:ticket.requiredHeaders,body:file});
      if (!uploaded.ok) throw new Error(`Хранилище отклонило загрузку (${uploaded.status})`);
      setMediaMessage("Файл загружен. Ставим на проверку и обработку…");
      await api.enqueueVideo({objectKey:ticket.objectKey,campaignId:mediaCampaignId});
      await loadMedia(mediaCampaignId);
      setMediaMessage("Загрузка завершена. Статус обработки обновится после проверки файла.");
    } catch (e) { setMediaMessage(e instanceof Error ? e.message : "Не удалось загрузить видео"); }
    finally { setMediaBusy(false); }
  }

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoginBusy(true); setError("");
    try {
      const result = await api.login(email, password);
      setAccessToken(result.accessToken);
      setSession(result.user as Session);
      setPassword("");
    } catch (err) { setError(err instanceof Error ? err.message : "Не удалось войти"); }
    finally { setLoginBusy(false); }
  }
  function logout() { setAccessToken(null); setSession(null); setCreators([]); setCampaigns([]); setOrganizations([]); setError(""); }

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

  if (!["/", "/login", "/app", "/dashboard"].includes(currentPath)) return <main className="not-found-page"><section className="not-found-card"><img className="brand-logo" src={`${import.meta.env.BASE_URL}creator-logo.svg`} alt="Логотип CREATOR"/><span className="not-found-code">404</span><h1>Кажется, эта страница потерялась.</h1><p>Ссылка ведёт в пустоту. Вернитесь в рабочее пространство, а мы оставим навигацию в порядке.</p><a className="button primary" href={import.meta.env.BASE_URL}>Вернуться в CREATOR</a></section></main>;

  if (!session) return <div className="app-shell login-shell"><main className="main login-main"><div className="content login-content"><div className="brand login-brand"><img className="brand-logo" src="/creator-logo.svg" alt="Логотип CREATOR" /><span>CREATOR <b>studio</b></span></div><section className="panel login-panel"><div className="eyebrow">ПРОСТРАНСТВО ДЛЯ СОЗДАТЕЛЕЙ</div><h1>Идеи заслуживают сильной реализации.</h1><p>Войдите в CREATOR, чтобы управлять кампаниями, контентом и сотрудничеством в одном месте.</p><form onSubmit={login} className="form-grid"><label>Email<input type="email" autoComplete="username" required value={email} onChange={e => { const value=e.target.value; setEmail(value); setEmailError(value && value.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "Проверьте адрес: нужен формат name@company.ru." : ""); }} aria-invalid={Boolean(emailError)} aria-describedby="email-hint" placeholder="name@company.ru" autoCapitalize="none" spellCheck={false}/></label><small id="email-hint" className={emailError ? "field-hint field-error" : "field-hint"} aria-live="polite">{emailError || "Рабочая почта, привязанная к вашей учётной записи"}</small><label>Пароль<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Введите пароль"/></label>{error && <div role="alert" className="error-state">{error}</div>}<button className="button primary" disabled={loginBusy || Boolean(emailError)} type="submit">{loginBusy ? <><span className="button-spinner" aria-hidden="true"/>Входим…</> : "Войти"}</button></form></section><footer className="login-footer">CREATOR <span>·</span> Защищённое рабочее пространство</footer></div></main></div>;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><img className="brand-logo" src="/creator-logo.svg" alt="Логотип CREATOR" /><span>CREATOR <b>studio</b></span></div>
      <div className="workspace"><img className="workspace-logo" src="/creator-logo.svg" alt="" /><span className="workspace-copy"><b>Рабочее пространство</b><small>{session.email}</small></span></div>
      <label className="searchbox"><CreatorIcon name="search" size={16}/><input placeholder="Поиск по креаторам" value={query} onChange={e => setQuery(e.target.value)}/></label>
      <div className="nav-label">РАБОЧЕЕ ПРОСТРАНСТВО</div>
      <nav>{nav.filter(item => session.role !== "CREATOR" || ["Обзор", "Кампании", "Контент", "Договоры", "Выплаты"].includes(item.label)).map(({ label, icon }) => <button key={label} className={active === label ? "nav-item active" : "nav-item"} onClick={() => setActive(label)}><CreatorIcon name={icon} size={17}/><span>{label}</span>{label === "Кампании" && campaigns.length > 0 && <em>{campaigns.length}</em>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="nav-item"><CreatorIcon name="settings" size={17}/><span>{roleName[session.role] ?? session.role}</span></div><button className="nav-item" onClick={logout}><CreatorIcon name="logout" size={17}/><span>Выйти</span></button></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="breadcrumbs">Рабочее пространство <span>/</span> <b>{active}</b></div><div className="top-actions"><button className="icon-button" title="Обновить данные" onClick={() => void loadData()}><CreatorIcon name="refresh" size={17}/></button><div className="top-divider"/><span>{roleName[session.role] ?? session.role}</span></div></header>
      <div className="content">
        <div className="page-heading"><div><div className="eyebrow">UGS CREATORS · LIVE DATA</div><h1>{active}</h1><p>Данные загружаются из API для вашей учётной записи. Демонстрационные показатели отключены.</p></div></div>
        {error && <div className="error-state" role="alert">{error} <button className="text-button" onClick={() => void loadData()}>Повторить</button></div>}
        {loading && <div className="loading-state" role="status" aria-live="polite"><span className="loader-orbit" aria-hidden="true"></span><b>Собираем рабочее пространство</b><span>Получаем актуальные данные из API</span><div className="skeleton-stack" aria-hidden="true"><i/><i/><i/></div></div>}
        {!loading && active === "Обзор" && <div className="stat-grid">
          <Stat icon={<CreatorIcon name="team"/>} label="Креаторы в доступе" value={session.role === "CREATOR" ? "—" : String(creators.length)} note={session.role === "CREATOR" ? "Личный кабинет креатора" : "Записи, доступные вашей учётной записи"}/>
          <Stat icon={<CreatorIcon name="projects"/>} label="Кампании" value={String(campaigns.length)} note="Кампании, доступные через API"/>
          <Stat icon={<CreatorIcon name="video"/>} label="Контент" value={String(mediaAssets.length)} note="Медиафайлы отображаются в разделе «Контент»"/>
          <Stat icon={<CreatorIcon name="check"/>} label="Соединение" value={error ? "Ошибка" : "API"} note={error ? "Проверьте API и авторизацию" : "Данные получены из backend"}/>
        </div>}
        {(active === "Креаторы" || (active === "Обзор" && session.role !== "CREATOR")) && session.role !== "CREATOR" && <section className="panel creators-panel"><div className="panel-heading creators-heading"><div><h2>Реестр креаторов</h2><p>Реальные записи из API, без тестовых карточек</p></div><div className="table-actions"><label className="table-search"><CreatorIcon name="search" size={15}/><input placeholder="Имя, email..." value={query} onChange={e => setQuery(e.target.value)}/></label><button className="button secondary" onClick={() => void loadData()}><CreatorIcon name="refresh" size={15}/>Обновить</button></div></div><div className="table-wrap"><table><thead><tr><th>КРЕАТОР</th><th>EMAIL</th><th>НАЛОГОВЫЙ СТАТУС</th><th>ER</th><th>ДОБАВЛЕН</th></tr></thead><tbody>{filteredCreators.map(c => <tr key={c.id}><td><div className="creator-cell"><div className="avatar avatar-blue">{c.displayName.slice(0,2).toUpperCase()}</div><div><b>{c.displayName}</b><small>{c.user?.fullName ?? "Имя не указано"}</small></div></div></td><td>{c.user?.email ?? "—"}</td><td>{c.taxStatus}</td><td className="numeric">{c.engagementRate == null ? "—" : String(c.engagementRate) + "%"}</td><td>{new Date(c.createdAt).toLocaleDateString("ru-RU")}</td></tr>)}</tbody></table>{!loading && filteredCreators.length === 0 && <div className="empty-state">{error ? "Реестр недоступен до восстановления API." : "В реестре пока нет записей."}</div>}</div><div className="table-footer"><span>Записей: {filteredCreators.length}</span></div></section>}
        {(active === "Кампании" || (active === "Обзор" && session.role === "CREATOR")) && <section className="panel"><div className="panel-heading"><div><h2>Кампании</h2><p>Список получен из backend, доступ ограничен сервером</p></div><div className="table-actions">{session.role !== "CREATOR" && <button className="button primary" onClick={() => setShowCreateCampaign(v=>!v)}><CreatorIcon name="plus" size={15}/>Новая кампания</button>}<button className="button secondary" onClick={() => void loadData()}><CreatorIcon name="refresh" size={15}/>Обновить</button></div></div>{showCreateCampaign && <form onSubmit={submitCampaign} className="form-grid form-grid-inline"><label>Название<input required minLength={2} value={campaignName} onChange={e=>setCampaignName(e.target.value)} placeholder="Название кампании" /></label><label>Организация<select required value={campaignOrgId} onChange={e=>setCampaignOrgId(e.target.value)}>{organizations.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label><label>Бюджет, ₽<input type="number" min="0" step="0.01" value={campaignBudget} onChange={e=>setCampaignBudget(e.target.value)} placeholder="0"/></label><button className="button primary" type="submit" disabled={!organizations.length}>Создать</button>{!organizations.length && <p>Сначала добавьте организацию в разделе «Организации».</p>}</form>}{session.role !== "CREATOR" && campaigns.length > 0 && creators.length > 0 && <form onSubmit={assignCreator} className="form-grid form-grid-inline"><label>Кампания для назначения<select required value={assignmentCampaignId} onChange={e=>setAssignmentCampaignId(e.target.value)}><option value="">Выберите кампанию</option>{campaigns.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Креатор<select required value={assignmentCreatorId} onChange={e=>setAssignmentCreatorId(e.target.value)}><option value="">Выберите креатора</option>{creators.map(c=><option key={c.id} value={c.id}>{c.displayName} · {c.user?.email ?? "без email"}</option>)}</select></label><button className="button primary" type="submit" disabled={assignmentBusy || !assignmentCampaignId || !assignmentCreatorId}>{assignmentBusy ? "Назначаем…" : "Назначить креатора"}</button></form>}{campaigns.length === 0 && !loading ? <div className="empty-state">{error ? "Не удалось получить кампании." : "Доступных кампаний пока нет."}</div> : campaigns.map(c => <div className="campaign-row" key={c.id}><div className="campaign-icon"><CreatorIcon name="projects"/></div><div className="campaign-info"><div className="campaign-title">{c.name}<span className="brand-name">{c.organization?.name ?? "Организация"}</span></div><div className="campaign-meta"><span>Бюджет: {new Intl.NumberFormat("ru-RU",{style:"currency",currency:"RUB",maximumFractionDigits:2}).format(Number(c.budgetKopecks)/100)}</span><span>{c.deadline ? "Дедлайн " + new Date(c.deadline).toLocaleDateString("ru-RU") : "Без дедлайна"}</span></div></div><div className="campaign-end"><span className="status-pill">{statusName[c.status] ?? c.status}</span>{session.role === "CREATOR" && c.creatorAssignments?.[0] && <><span className="status-pill">{c.creatorAssignments[0].status === "ACCEPTED" ? "Вы приняли" : c.creatorAssignments[0].status === "DECLINED" ? "Отклонено" : "Ожидает ответа"}</span>{c.creatorAssignments[0].status === "ASSIGNED" && <div><button className="button primary" onClick={()=>void respondToAssignment(c.creatorAssignments![0].id,"ACCEPTED")}>Принять</button><button className="button secondary" onClick={()=>void respondToAssignment(c.creatorAssignments![0].id,"DECLINED")}>Отклонить</button></div>}</>}{session.role !== "CREATOR" && c.creatorAssignments?.length ? <small>{c.creatorAssignments.map(a=>a.creator?.displayName ?? "Креатор").join(", ")}</small> : null}</div></div>)}</section>}
        {active === "Организации" && <section className="panel"><div className="panel-heading"><div><h2>Организации</h2><p>Команды изолированы на уровне членства и API</p></div>{["SUPER_ADMIN","ORG_ADMIN"].includes(session.role) && <button className="button primary" onClick={()=>setShowCreateOrganization(v=>!v)}><CreatorIcon name="plus" size={15}/>Добавить организацию</button>}</div>{showCreateOrganization && <form onSubmit={submitOrganization} className="form-grid form-grid-inline"><label>Название<input required minLength={2} value={organizationName} onChange={e=>setOrganizationName(e.target.value)} placeholder="Название организации"/></label><label>Юридическое название<input value={organizationLegalName} onChange={e=>setOrganizationLegalName(e.target.value)} placeholder="Необязательно"/></label><button className="button primary" type="submit">Создать организацию</button></form>}{organizations.length ? organizations.map(o=><div className="campaign-row" key={o.id}><div className="campaign-icon"><CreatorIcon name="projects"/></div><div className="campaign-info"><div className="campaign-title">{o.name}</div><div className="campaign-meta"><span>{o.legalName || "Юридическое название не указано"}</span><span>Создана {new Date(o.createdAt).toLocaleDateString("ru-RU")}</span></div></div><div className="campaign-end"><span className="status-pill">Доступ есть</span></div></div>) : <div className="empty-state">Нет доступных организаций. Создайте организацию или попросите администратора добавить вас в команду.</div>}</section>}
        {active === "Контент" && <section className="panel"><div className="panel-heading"><div><h2>Медиатека кампании</h2><p>Файлы загружаются напрямую в S3-совместимое хранилище, затем проходят проверку и обработку.</p></div><button className="button secondary" disabled={!mediaCampaignId || mediaBusy} onClick={() => void loadMedia(mediaCampaignId)}><CreatorIcon name="refresh" size={15}/>Обновить</button></div>{session.role === "CREATOR" ? <div className="empty-state">Ваш контентный штаб. Материалы заказчика не отображаются в кабинете креатора. Откройте раздел «Кампании», чтобы увидеть назначенные проекты и ответить на приглашения.</div> : <><div><label>Кампания<select value={mediaCampaignId} onChange={e=>setMediaCampaignId(e.target.value)}><option value="">Выберите кампанию</option>{campaigns.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Загрузить видео<input type="file" accept="video/mp4,video/quicktime,video/webm" disabled={!mediaCampaignId || mediaBusy} onChange={e=>{const file=e.currentTarget.files?.[0];if(file)void uploadMedia(file);e.currentTarget.value="";}} /><small>MP4, MOV/QuickTime или WebM, до 20 ГБ</small></label></div>{mediaMessage && <div className="empty-state" role="status" >{mediaBusy && "⏳ "}{mediaMessage}</div>}<div className="table-wrap"><table><thead><tr><th>ФАЙЛ</th><th>РАЗМЕР</th><th>СТАТУС</th><th>ДЕТАЛИ</th><th>ДОБАВЛЕН</th></tr></thead><tbody>{mediaAssets.map(asset=><tr key={asset.id}><td><div className="creator-cell"><div className="avatar avatar-blue"><CreatorIcon name="video" size={16}/></div><div><b>{asset.fileName}</b><small>{asset.contentType}</small></div></div></td><td>{formatBytes(asset.originalBytes)}</td><td><span className="status-pill">{mediaStatus[asset.status] ?? asset.status}</span></td><td>{asset.status === "FAILED" ? (asset.errorMessage || "Ошибка обработки") : asset.durationSeconds ? `${Math.round(asset.durationSeconds)} сек · ${asset.width ?? "?"}×${asset.height ?? "?"}` : asset.status === "READY" ? "Готово к использованию" : "Проверка / обработка"}</td><td>{new Date(asset.createdAt).toLocaleDateString("ru-RU")}</td></tr>)}</tbody></table>{!mediaAssets.length && <div className="empty-state">{campaigns.length ? "Для этой кампании пока нет загруженных материалов." : "Сначала создайте кампанию в разделе «Кампании»."}</div>}</div></>}</section>}
        {!(active === "Обзор" || active === "Организации" || active === "Креаторы" || active === "Кампании" || active === "Контент") && <section className="panel"><div className="panel-heading"><div><h2>{active}</h2><p>Модуль не подключён к рабочим данным API.</p></div></div><div className="empty-state">Раздел не имитирует готовую функциональность. Для включения нужны серверные модели, права доступа и интеграционные тесты.</div></section>}
        <footer>UGS Creators <span>·</span> <span className="footer-right"><CreatorIcon name="check" size={13}/> Авторизованная сессия</span></footer>
      </div>
    </main>
  </div>;
}
const mediaStatus:Record<string,string> = {UPLOAD_PENDING:"Ожидает загрузки",QUEUED:"В очереди",PROCESSING:"Обрабатывается",READY:"Готов",FAILED:"Ошибка"};
function formatBytes(value:string|number){const bytes=Number(value);if(!Number.isFinite(bytes)||bytes<0)return "—";if(bytes<1024)return `${bytes} Б`;const units=["КБ","МБ","ГБ","ТБ"];let n=bytes/1024,i=0;while(n>=1024&&i<units.length-1){n/=1024;i++;}return `${n.toLocaleString("ru-RU",{maximumFractionDigits:1})} ${units[i]}`;}
function Stat({icon,label,value,note}:{icon:React.ReactNode;label:string;value:string;note:string}){return <div className="stat-card"><div className="stat-top"><span className="stat-icon">{icon}</span></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-bottom"><span className="stat-note">{note}</span></div></div>}
