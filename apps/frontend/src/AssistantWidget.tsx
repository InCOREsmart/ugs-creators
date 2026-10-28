import { useMemo, useState } from "react";
import CreatorIcon from "./CreatorIcon";
type Props = { role: string; name?: string };
type Message = { from: "assistant" | "user"; text: string };
const faq = [
 {keys:["начать","перв","что делать","старт"],q:"С чего начать?",a:"Начните с профиля и раздела «Кампании». Креатору нужно проверить доступные задания, а бренду или владельцу создать кампанию и подобрать авторов."},
 {keys:["соцсет","подключ","instagram","тикток","tiktok","youtube","вк"],q:"Как подключить соцсети?",a:"Откройте настройки аккаунта и найдите подключение социальных сетей. В тестовом режиме реальная OAuth-авторизация ещё не подключена. Не вводите здесь пароли от соцсетей."},
 {keys:["кампан","бренд"],q:"Как создать кампанию?",a:"В кабинете бизнеса или владельца откройте «Кампании» → «Создать кампанию», укажите название, организацию и бюджет."},
 {keys:["креатор","блогер","автор"],q:"Как найти креатора?",a:"Откройте «Креаторы», найдите автора через поиск и назначьте его на нужную кампанию."},
 {keys:["видео","контент","загруз","ролик","медиа"],q:"Как загрузить видео?",a:"Откройте «Контент», выберите кампанию и загрузите видео MP4, QuickTime или WebM. Реальное облачное хранилище может быть не подключено в тестовом режиме."},
 {keys:["договор","подпис","документ"],q:"Как работают договоры?",a:"В разделе «Договоры» можно просматривать документы и тестовые статусы. Электронная подпись и юридически значимый документооборот пока не подключены."},
 {keys:["выплат","деньги","оплат","гонорар"],q:"Как работают выплаты?",a:"Раздел «Выплаты» показывает реестр и тестовые статусы. Реальное перечисление денег пока не подключено."},
 {keys:["регистрац","войти","пароль","аккаунт"],q:"Не получается войти",a:"Проверьте email и пароль. При регистрации пароль должен содержать не менее 12 символов. Если ошибка повторяется, передайте её текст администратору."},
 {keys:["цена","стоим","тариф","сколько стоит"],q:"Сколько стоит платформа?",a:"В тестовом режиме тарифы и реальные платежи не настроены. Стоимость будет зависеть от модулей и подключённых интеграций."},
 {keys:["поддерж","оператор","человек","связаться"],q:"Как связаться с поддержкой?",a:"Помощник работает в демонстрационном режиме. Передайте администратору описание проблемы и текст ошибки; автоматическая отправка обращений пока не подключена."}
];
function answerFor(input:string){const q=input.toLowerCase().replace(/ё/g,"е");const found=faq.find(f=>f.keys.some(k=>q.includes(k)));return found?.a ?? "Я работаю в демо-режиме и отвечаю по FAQ CREATOR. Спросите про начало работы, соцсети, кампании, креаторов, контент, договоры, выплаты или регистрацию."}
export default function AssistantWidget({role,name}:Props){
 const [open,setOpen]=useState(true),[draft,setDraft]=useState(""),[messages,setMessages]=useState<Message[]>([]),[showFaq,setShowFaq]=useState(false);
 const greeting=useMemo(()=>{const n=name?.trim()?.split(/\s+/)[0]||"добро пожаловать";if(role==="CREATOR")return `Привет, ${n}! Я помощник CREATOR. Начните с просмотра кампаний и заданий, затем проверьте требования к контенту.`;if(role==="ORG_ADMIN")return `Привет, ${n}! Я помощник CREATOR. Заполните данные бренда, создайте кампанию и подберите креаторов.`;return `Привет, ${n}! Я помощник CREATOR. Проверьте организацию, создайте кампанию и посмотрите доступные модули.`},[role,name]);
 function send(value=draft){value=value.trim();if(!value)return;setMessages(m=>[...m,{from:"user",text:value},{from:"assistant",text:answerFor(value)}]);setDraft("");setShowFaq(false)}
 return <div className={open?"creator-assistant is-open":"creator-assistant"}>{open&&<section className="assistant-window" aria-label="AI-помощник CREATOR">
 <header className="assistant-header"><span className="assistant-avatar"><CreatorIcon name="ideas" size={19}/></span><div><b>Помощник CREATOR</b><small>Демо-режим · ответы по FAQ</small></div><button type="button" className="assistant-close" onClick={()=>setOpen(false)} aria-label="Свернуть">×</button></header>
 <div className="assistant-messages" aria-live="polite"><div className="assistant-bubble">{greeting}</div>{messages.map((m,i)=><div key={i} className={m.from==="user"?"assistant-bubble user-bubble":"assistant-bubble"}>{m.text}</div>)}{showFaq&&<div className="assistant-faq">{faq.map(f=><button type="button" key={f.q} onClick={()=>send(f.q)}>{f.q}<span>›</span></button>)}</div>}</div>
 <div className="assistant-shortcuts"><button type="button" onClick={()=>send("С чего начать?")}>С чего начать</button><button type="button" onClick={()=>setShowFaq(v=>!v)}>Частые вопросы</button></div>
 <form className="assistant-input" onSubmit={e=>{e.preventDefault();send()}}><input aria-label="Ваш вопрос" value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Напишите вопрос…" maxLength={500}/><button type="submit" aria-label="Отправить вопрос" disabled={!draft.trim()}><CreatorIcon name="plus" size={17}/></button></form>
 </section>}{!open&&<button type="button" className="assistant-launcher" onClick={()=>setOpen(true)}><CreatorIcon name="ideas" size={20}/><span>Помощник</span></button>}</div>
}
