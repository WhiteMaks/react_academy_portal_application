import React, {FC, FormEvent, useEffect, useState} from "react";
import {Link, useLocation, useNavigate} from "react-router-dom";
import {fetchAthletes} from "../../data/state/athlete/AthleteReducer";
import {useGlobalDispatch, useGlobalSelector} from "../../data/state/store";
import Button from "../component/common/button/Button";
import FormMessage from "../component/common/form_message/FormMessage";
import AthleteV1Response from "../../api/models/athlete/AthleteV1Response";
import {formatBirthDateDmy} from "../../api/models/athlete/birthDate";
import AthleteStatusBadge from "../component/athlete_status_badge/AthleteStatusBadge";
import style from "./AthletesPage.module.css";
const fullName=(a:AthleteV1Response)=>[a.secondName,a.firstName,a.middleName].filter(Boolean).join(" ");
const errorText=(kind?:string)=>kind==="unauthorized"?"Сессия завершена. Войдите снова, чтобы открыть список спортсменов.":kind==="forbidden"?"У вашей учётной записи нет доступа к списку спортсменов.":"Не удалось загрузить список. Проверьте соединение и повторите попытку.";
const LIMIT=50;
const SEARCH_DEBOUNCE_MS=350;
const athleteCount=(n:number,status:"active"|"archived")=>`${n} ${status==="archived"?"архивных":"активных"} ${n%10===1&&n%100!==11?"карточка":n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?"карточки":"карточек"}`;
const AthletesPage:FC=()=>{
 const dispatch=useGlobalDispatch();const state=useGlobalSelector(g=>g.athleteReducer);const location=useLocation();const navigate=useNavigate();
 const created=Boolean((location.state as {created?:boolean}|null)?.created);const [query,setQuery]=useState(state.listQuery);
 const load=(status:"active"|"archived",q=query,offset=0)=>dispatch(fetchAthletes({status,q:q.trim()||undefined,limit:LIMIT,offset}));
 useEffect(()=>{if(created){dispatch(fetchAthletes({status:"active",limit:LIMIT,offset:0}));setQuery("");navigate("/athletes",{replace:true,state:null});return;}if(!state.loaded&&!state.loading&&!state.listErrorKind)dispatch(fetchAthletes({status:"active",limit:LIMIT,offset:0}));},[created,dispatch,navigate,state.loaded,state.loading,state.listErrorKind]);
 useEffect(()=>{
  const trimmedQuery=query.trim();
  if(trimmedQuery===state.listQuery.trim())return;
  const timeout=window.setTimeout(()=>dispatch(fetchAthletes({status:state.listStatus,q:trimmedQuery||undefined,limit:LIMIT,offset:0})),SEARCH_DEBOUNCE_MS);
  return ()=>window.clearTimeout(timeout);
 },[dispatch,query,state.listQuery,state.listStatus]);
 const submit=(e:FormEvent)=>{e.preventDefault();load(state.listStatus,query,0)};
 const queryIsDirty=query.trim()!==state.listQuery.trim();
 const pages=Math.max(1,Math.ceil(state.total/LIMIT));const page=Math.floor(state.listOffset/LIMIT)+1;const first=state.total===0?0:state.listOffset+1;const last=Math.min(state.listOffset+state.athletes.length,state.total);
 const isEmpty=state.loaded&&!state.loading&&!state.listErrorKind&&state.total===0;
 return <main className={`${style.page} ${style.listPage}`}>
  <header className={style.header}><div><nav className={style.breadcrumb} aria-label="Навигационная цепочка"><span>Рабочее место</span><span aria-hidden="true">/</span><span>Спортсмены</span></nav><h1>Спортсмены</h1><p>Карточки людей, которые занимаются в академии.</p></div><Link className={style.addLink} to="/athletes/new">＋ Добавить спортсмена</Link></header>
  {created&&<FormMessage variant="notice">Спортсмен добавлен.</FormMessage>}
  <section className={style.catalogSurface} aria-label="Каталог спортсменов">
   <div className={style.catalogControls}>
    <form className={style.searchForm} onSubmit={submit}><label htmlFor="athlete-search">Поиск по ФИО или дате рождения</label><div className={style.searchRow}><input id="athlete-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Фамилия, имя или ДД.ММ.ГГГГ" maxLength={200}/>{query&&<button className={style.clearSearch} type="button" onClick={()=>{setQuery("");load(state.listStatus,"",0)}} aria-label="Очистить поиск">Очистить</button>}</div></form>
    <div className={style.statusSwitch} role="group" aria-label="Статус спортсменов"><button type="button" aria-pressed={state.listStatus==="active"} className={state.listStatus==="active"?style.selectedStatus:""} onClick={()=>load("active",query,0)}>Активные</button><button type="button" aria-pressed={state.listStatus==="archived"} className={state.listStatus==="archived"?style.selectedStatus:""} onClick={()=>load("archived",query,0)}>Архив</button></div>
   </div>
   <div className={style.tableCount} aria-live="polite">{state.total===0?"0 результатов":athleteCount(state.total,state.listStatus)}</div>
   {state.listErrorKind&&<section className={style.statePanel}><FormMessage>{errorText(state.listErrorKind)}</FormMessage>{state.listErrorKind==="unauthorized"&&<Link className={style.inlineLink} to="/logout">Завершить сессию и войти снова</Link>}<Button onClick={()=>load(state.listStatus,query,queryIsDirty?0:state.listOffset)}>Повторить</Button></section>}
   {(state.athletes.length>0||isEmpty||state.loading)&&<table className={style.table}><thead><tr><th>ФИО</th><th>Дата рождения</th><th>Статус</th></tr></thead><tbody>{state.loading?<><tr className={style.loadingNotice}><td colSpan={3} role="status">Загружаем {state.listStatus==="active"?"активных":"архивных"} спортсменов…</td></tr>{Array.from({length:3},(_,i)=><tr className={style.skeletonRow} key={i} aria-hidden="true"><td colSpan={3}><i/></td></tr>)}</>:isEmpty?<tr className={style.emptyRow}><td colSpan={3}><div className={style.empty}><h2>{state.listQuery?"Ничего не найдено":state.listStatus==="archived"?"Архив пока пуст":"Пока нет спортсменов"}</h2><p>{state.listQuery?"Измените запрос или очистите поле поиска.":state.listStatus==="archived"?"Архивированные карточки появятся здесь.":"Добавьте первую карточку, чтобы она появилась в списке."}</p></div></td></tr>:state.athletes.map(a=><tr key={a.id}><td><Link className={`${style.inlineLink} ${style.athleteListLink}`} to={`/athletes/${a.id}`}><strong>{fullName(a)}</strong><span>Карточка спортсмена</span></Link></td><td data-label="Дата рождения"><span className={style.mobileDateLabel}>Дата рождения · </span>{formatBirthDateDmy(a.birthDate)||"—"}</td><td data-label="Статус"><span className={style.mobileStatusLabel}>Статус · </span><AthleteStatusBadge active={a.isActive}/></td></tr>)}</tbody></table>}
   <div className={style.pagination}><span className={style.resultRange}>Показаны {first}–{last} из {state.total}</span><div className={style.pageControls}><span>Страница {page} из {pages}</span><Button disabled={first<=1||state.loading||queryIsDirty} onClick={()=>load(state.listStatus,state.listQuery,Math.max(0,state.listOffset-LIMIT))}>Назад</Button><Button disabled={last>=state.total||state.loading||queryIsDirty} onClick={()=>load(state.listStatus,state.listQuery,state.listOffset+LIMIT)}>Далее</Button></div></div>
  </section>
 </main>;
};export default AthletesPage;
