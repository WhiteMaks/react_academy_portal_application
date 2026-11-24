import React, {FC, FormEvent, useEffect, useRef, useState} from "react";
import {Link, useLocation, useNavigate} from "react-router-dom";
import {athleteActions, fetchAthletes} from "../../data/state/athlete/AthleteReducer";
import {useGlobalDispatch, useGlobalSelector} from "../../data/state/store";
import Button from "../component/common/button/Button";
import FormMessage from "../component/common/form_message/FormMessage";
import AthleteV1Response from "../../api/models/athlete/AthleteV1Response";
import {formatBirthDateDmy} from "../../api/models/athlete/birthDate";
import AthleteStatusBadge from "../component/athlete_status_badge/AthleteStatusBadge";
import style from "./AthletesPage.module.css";
const fullName=(a:AthleteV1Response)=>[a.secondName,a.firstName,a.middleName].filter(Boolean).join(" ");
const errorText=(kind?:string,isCoach=false)=>kind==="unauthorized"?"Сессия завершена. Войдите снова, чтобы открыть список.":kind==="forbidden"&&isCoach?"Доступ запрещён. Попросите администратора проверить права.":kind==="forbidden"?"У вашей учётной записи нет доступа к списку.":isCoach?"Ошибка сервиса: не удалось загрузить список тренеров. Проверьте соединение и повторите попытку.":"Не удалось загрузить список. Проверьте соединение и повторите попытку.";
const LIMIT=50;
const SEARCH_DEBOUNCE_MS=350;
const coachCount=(n:number,status:"active"|"archived")=>{
 const last=n%10,lastTwo=n%100;
 const plural=last===1&&lastTwo!==11?"one":last>=2&&last<=4&&(lastTwo<12||lastTwo>14)?"few":"many";
 if(status==="archived")return `${n} ${plural==="one"?"архивная":plural==="few"?"архивные":"архивных"} ${plural==="one"?"карточка":plural==="few"?"карточки":"карточек"}`;
 return `${n} ${plural==="one"?"активная":plural==="few"?"активные":"активных"} ${plural==="one"?"карточка":plural==="few"?"карточки":"карточек"}`;
};
const athleteCount=(n:number,status:"active"|"archived")=>`${n} ${status==="archived"?"архивных":"активных"} ${n%10===1&&n%100!==11?"карточка":n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?"карточки":"карточек"}`;
interface Props {isCoach?:boolean;}
const AthletesPage:FC<Props>=({isCoach=false})=>{
 const dispatch=useGlobalDispatch();const state=useGlobalSelector(g=>g.athleteReducer);const location=useLocation();const navigate=useNavigate();
 const route=isCoach?"/coaches":"/athletes";const label=isCoach?"Тренеры":"Спортсмены";const directory=isCoach?"coaches":"athletes";const created=Boolean((location.state as {created?:boolean}|null)?.created);const returned=(location.state as {returnTo?:{q?:string;status?:"active"|"archived";page?:number};saveNotice?:string}|null);const status=state.selectedStatus[directory];const list=state.catalogs[directory][status];const [query,setQuery]=useState(returned?.returnTo?.q??list.query);const [notice,setNotice]=useState(returned?.saveNotice??"");
 const stateRef=useRef(state);stateRef.current=state;const initializedRoute=useRef<string|null>(null);
 const load=(nextStatus:"active"|"archived",q=query,offset=0)=>{dispatch(athleteActions.selectAthleteCatalogStatus({isCoach,status:nextStatus}));dispatch(fetchAthletes({status:nextStatus,q:q.trim()||undefined,limit:LIMIT,offset,isCoach}));};
 useEffect(()=>{
  const routeKey=`${location.key}:${isCoach}`;
  if(initializedRoute.current===routeKey)return;
  initializedRoute.current=routeKey;
  const current=stateRef.current;const returnTo=returned?.returnTo;const directoryKey=isCoach?"coaches":"athletes";const status=returnTo?.status??current.selectedStatus[directoryKey];const offset=Math.max(0,(returnTo?.page??1)-1)*LIMIT;const catalog=current.catalogs[directoryKey][status];const targetQuery=returnTo?.q??catalog.query;
  if(created){dispatch(athleteActions.selectAthleteCatalogStatus({isCoach:false,status:"active"}));dispatch(fetchAthletes({status:"active",limit:LIMIT,offset:0,isCoach:false}));setQuery("");navigate("/athletes",{replace:true,state:null});return;}
  if(notice)setNotice("");
  dispatch(athleteActions.selectAthleteCatalogStatus({isCoach,status}));setQuery(targetQuery);
  if((!catalog.loaded&&!catalog.loading)||catalog.query!==targetQuery||catalog.offset!==offset)dispatch(fetchAthletes({status,q:targetQuery||undefined,limit:LIMIT,offset,isCoach}));
  if(returnTo!==undefined||notice)navigate(route,{replace:true,state:null});
 },[created,dispatch,isCoach,location.key,navigate,notice,returned?.returnTo,route]);
 useEffect(()=>{
  const trimmedQuery=query.trim();
  if(trimmedQuery===list.query.trim())return;
  const timeout=window.setTimeout(()=>dispatch(fetchAthletes({status,q:trimmedQuery||undefined,limit:LIMIT,offset:0,isCoach})),SEARCH_DEBOUNCE_MS);
  return ()=>window.clearTimeout(timeout);
 },[dispatch,query,list.query,status,isCoach]);
 const submit=(e:FormEvent)=>{e.preventDefault();load(status,query,0)};
 const queryIsDirty=query.trim()!==list.query.trim();
 const pages=Math.max(1,Math.ceil(list.total/LIMIT));const page=Math.floor(list.offset/LIMIT)+1;const first=list.total===0?0:list.offset+1;const last=Math.min(list.offset+list.athletes.length,list.total);
 const isEmpty=list.loaded&&!list.loading&&!list.errorKind&&list.total===0;
 return <main className={`${style.page} ${style.listPage}`} aria-busy={list.loading}>
  <header className={style.header}><div><nav className={style.breadcrumb} aria-label="Навигационная цепочка"><span>Рабочее место</span><span aria-hidden="true">/</span><span>{label}</span></nav><h1>{label}</h1><p>{isCoach?"Карточки со статусом тренера. Отдельный аккаунт и доступ в кабинет не создаются.":"Карточки спортсменов; тренеры находятся в отдельном разделе."}</p></div>{!isCoach&&<Link className={style.addLink} to="/athletes/new">＋ Добавить спортсмена</Link>}</header>
  {notice&&<FormMessage variant="notice">{notice}</FormMessage>}
  {created&&<FormMessage variant="notice">Спортсмен добавлен.</FormMessage>}
  <section className={style.catalogSurface} aria-label={`Каталог: ${label.toLowerCase()}`}>
   <div className={style.catalogControls}>
    <form className={style.searchForm} onSubmit={submit}><label htmlFor="athlete-search">Поиск по ФИО или дате рождения</label><div className={style.searchRow}><input id="athlete-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Фамилия, имя или ДД.ММ.ГГГГ" maxLength={200}/>{query&&<button className={style.clearSearch} type="button" onClick={()=>{setQuery("");load(status,"",list.offset)}} aria-label="Очистить поиск">Очистить</button>}</div></form>
    <div className={style.statusSwitch} role="group" aria-label={`Статус: ${label.toLowerCase()}`}><button type="button" aria-pressed={status==="active"} className={status==="active"?style.selectedStatus:""} onClick={()=>load("active",query,0)}>Активные</button><button type="button" aria-pressed={status==="archived"} className={status==="archived"?style.selectedStatus:""} onClick={()=>load("archived",query,0)}>Архив</button></div>
   </div>
   <div className={style.tableCount} aria-live="polite">{list.total===0&&(!isCoach||Boolean(list.query.trim()))?"0 результатов":isCoach?coachCount(list.total,status):athleteCount(list.total,status)}</div>
   {list.errorKind&&<section className={style.statePanel}><FormMessage>{errorText(list.errorKind,isCoach)}</FormMessage>{list.errorKind==="unauthorized"&&<Link className={style.inlineLink} to="/logout">Завершить сессию и войти снова</Link>}<Button onClick={()=>load(status,query,queryIsDirty?0:list.offset)}>Повторить</Button></section>}
   {(list.athletes.length>0||isEmpty||list.loading)&&<table className={style.table}><thead><tr><th>ФИО</th><th>Дата рождения</th><th>{isCoach&&status==="active"?"Активность":"Статус"}</th></tr></thead><tbody>{list.loading?<><tr className={style.loadingNotice}><td colSpan={3} role="status">{isCoach?"Загрузка: получаем список тренеров…":`Загружаем ${status==="active"?"активных":"архивных"} спортсменов…`}</td></tr>{Array.from({length:3},(_,i)=><tr className={style.skeletonRow} key={i} aria-hidden="true"><td colSpan={3}><i/></td></tr>)}</>:isEmpty?<tr className={style.emptyRow}><td colSpan={3}><div className={style.empty}><h2>{list.query?"Ничего не найдено":status==="archived"?"Архив пока пуст":isCoach?"Здесь пока нет тренеров":"Пока нет спортсменов"}</h2><p>{list.query?isCoach?`По запросу «${list.query}» тренеры не найдены. Измените запрос или очистите поиск.`:"Измените запрос или очистите поле поиска.":status==="archived"?"Архивированные карточки появятся здесь.":isCoach?"Назначьте статус «Тренер» в карточке спортсмена.":"Добавьте первую карточку, чтобы она появилась в списке."}</p></div></td></tr>:list.athletes.map(a=><tr key={a.id}><td><Link className={`${style.inlineLink} ${style.athleteListLink}`} to={`/athletes/${a.id}`} state={{returnTo:{path:route,q:list.query,status:status,page}}}><strong>{fullName(a)}</strong><span>{isCoach?"Профиль со статусом тренера":"Карточка спортсмена"}</span></Link></td><td data-label="Дата рождения"><span className={style.mobileDateLabel}>Дата рождения · </span>{formatBirthDateDmy(a.birthDate)||"—"}</td><td data-label={isCoach&&status==="active"?"Активность":"Статус"}><span className={style.mobileStatusLabel}>{isCoach&&status==="active"?"Активность":"Статус"} · </span><AthleteStatusBadge active={a.isActive}/></td></tr>)}</tbody></table>}
   <div className={style.pagination}><span className={style.resultRange}>Показаны {first}–{last} из {list.total}</span><div className={style.pageControls}><span>Страница {page} из {pages}</span><Button disabled={first<=1||list.loading||queryIsDirty} onClick={()=>load(status,list.query,Math.max(0,list.offset-LIMIT))}>Назад</Button><Button disabled={last>=list.total||list.loading||queryIsDirty} onClick={()=>load(status,list.query,list.offset+LIMIT)}>Далее</Button></div></div>
  </section>
 </main>;
};export default AthletesPage;
