'use client';
import { useEffect, useMemo, useState } from 'react';
import { AppState, loadState, replyStatus, isMeetingCancelled } from '@/lib/store';
import { apiToggleMeetingCancel } from '@/lib/api';
import { getSession, Session } from '@/lib/session';
import Link from 'next/link';

function ic(t?:string){return t==='registered'?'✅':t==='declined'?'❌':t==='interested'?'❤️':''}
const weekdays=['日','一','二','三','四','五','六'];
function ymd(d:Date){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function monthKey(d:Date){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function addMonths(d:Date,n:number){const x=new Date(d);x.setMonth(x.getMonth()+n);return x}

export default function Calendar(){
  const [s,setS]=useState<AppState|null>(null);
  const [session,setSessionState]=useState<Session|null>(undefined);
  const [err,setErr]=useState('');
  const [child,setChild]=useState('all');
  const [view,setView]=useState<'month'|'list'>('month');
  const [base,setBase]=useState(new Date());

  useEffect(()=>{loadState().then(setS).catch(e=>setErr(e.message));setSessionState(getSession())},[]);

  // Compute days (always called, no conditional hooks)
  const first=new Date(base.getFullYear(),base.getMonth(),1);
  const start=new Date(first);start.setDate(1-first.getDay());
  const days=Array.from({length:42},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d});

  if(session===undefined)return <div className="card">載入中...</div>;
  if(err&&!s)return <div className="card"><p className="badge red">{err}</p></div>;
  if(!s)return <div className="card">載入中...</div>;

  // ===== 公開行事曆（已選旅團但未登入）=====
  if(!session){
    try {
      const pubEvents=(s.events||[]).filter(e=>e.status==='published');
      const pubMeetings=(s.regularMeetings||[]).filter(r=>r.enabled);
      return (
        <div className="stack">
          <section className="hero">
            <span className="badge gold">📅 公開行事曆</span>
            <h1>旅團行事曆</h1>
            <p>登入後可查看個人化行事曆及回覆活動。</p>
            <Link className="btn primary" href="/login">登入</Link>
          </section>
          <section className="card stack">
            <div className="row" style={{justifyContent:'space-between'}}>
              <button className="btn" onClick={()=>setBase(addMonths(base,-1))}>← 上月</button>
              <h2>{monthKey(base)}</h2>
              <button className="btn" onClick={()=>setBase(addMonths(base,1))}>下月 →</button>
            </div>
            <div className="month-grid">
              {weekdays.map(w=><div className="month-head" key={w}>星期{w}</div>)}
              {days.map(d=>{
                const date=ymd(d);
                const items:{type:string;title:string;purple:boolean}[]=[];
                pubEvents.filter(e=>e.date===date).forEach(e=>items.push({type:'event',title:e.title,purple:e.kind==='notice_troop_participation'}));
                pubMeetings.forEach(r=>{if(d.getDay()===r.weekday){try{const c=isMeetingCancelled(s,r.branchId,date);if(!c)items.push({type:'meeting',title:r.title,purple:false})}catch(e){}}});
                return (
                  <div key={date} className={`month-cell ${d.getMonth()!==base.getMonth()?'dim':''}`}>
                    <div className="day-num">{d.getDate()}</div>
                    {items.slice(0,4).map((it,idx)=>(
                      <div key={idx} className={`mini-event ${it.purple?'purple':''}`}>
                        {it.type==='meeting'?'🔵':'🟣'} {it.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      );
    } catch(e:any) {
      return <div className="card"><p className="badge red">行事曆載入失敗：{e?.message||String(e)}</p><Link className="btn primary" href="/login">登入</Link></div>;
    }
  }

  // ===== 已登入的個人化行事曆 =====
  const role=session.role;
  const canCancel=['super_admin','troop_super','admin','group_leader','branch_leader'].includes(role);
  const parent=role==='parent'?s.users.find(u=>u.id===session.userId):null;
  const children=parent?(s.members||[]).filter(m=>(parent.childMemberIds||[]).includes(m.id)||m.parentUserId===parent.id):[];

  function cancelDay(branchId:string,date:string,type:'cancelled'|'recess'='cancelled'){
    setErr('');
    apiToggleMeetingCancel(branchId,date,'領袖標記',type).then(f=>setS(f)).catch(e=>setErr(e.message))
  }

  function visibleEvent(e:any){
    if(role==='member'){const m=(s.members||[]).find(x=>x.id===session.memberId);return !!m&&e.targetMemberIds.includes(m.id)&&replyStatus(s,e.id,m.id)?.type!=='declined'}
    if(role==='parent'&&children.length>0){return children.some(c=>e.targetMemberIds.includes(c.id))}
    return true;
  }

  function rightForEvent(e:any){
    if(['super_admin','troop_super','admin','group_leader','branch_leader','coach'].includes(role)){
      const targets=(s.members||[]).filter(m=>e.targetMemberIds.includes(m.id));
      const counts:any={registered:0,interested:0,declined:0,unresponded:0};
      targets.forEach(m=>{const r=replyStatus(s,e.id,m.id);counts[r?.type||'unresponded']++});
      return `✅${counts.registered} ❤️${counts.interested} ⚠️${counts.unresponded}`;
    }
    if(role==='parent'){
      const cs=(child==='all'?children:children.filter(c=>c.id===child)).filter(c=>e.targetMemberIds.includes(c.id));
      return cs.map(c=>`${child==='all'?c.name:''}${ic(replyStatus(s,e.id,c.id)?.type)||'·'}`).join(' ')||'—';
    }
    if(role==='member'){const r=replyStatus(s,e.id,session.memberId||'');return `${ic(r?.type)} ${r?.type==='interested'?'等待家長確認':''}`}
    return '';
  }

  const pubEvents=(s.events||[]).filter(e=>e.status==='published');
  const visibleEvents=pubEvents.filter(visibleEvent);
  
  const calendarItems:{type:string;date:string;title:string;purple:boolean;cancelled?:boolean;event?:any;meeting?:any}[]=[];
  visibleEvents.forEach(e=>calendarItems.push({type:'event',date:e.date,title:e.title,purple:e.kind==='notice_troop_participation',event:e}));
  (s.regularMeetings||[]).filter(r=>r.enabled).forEach(r=>{
    for(let i=0;i<90;i++){
      const d=new Date();d.setDate(d.getDate()+i);
      const date=ymd(d);
      if(d.getDay()!==r.weekday)continue;
      let cancelled=false;
      try{cancelled=isMeetingCancelled(s,r.branchId,date)}catch(e){}
      if(cancelled&&role==='member')continue;
      calendarItems.push({type:'meeting',date,title:r.title,purple:false,cancelled,meeting:r});
    }
  });

  return (
    <div className="stack">
      <section className="hero">
        <span className="badge gold">📅 行事曆</span>
        <h1>{role==='member'?'我的行事曆':role==='parent'?'子女行事曆':'領袖行事曆'}</h1>
        <p>以月曆為主、清單為輔。領袖可標記不用集會；成員不會看到已取消的集會。</p>
        <div className="row">
          <button className={`btn ${view==='month'?'primary':''}`} onClick={()=>setView('month')}>月曆</button>
          <button className={`btn ${view==='list'?'primary':''}`} onClick={()=>setView('list')}>清單</button>
        </div>
      </section>
      {err&&<p className="badge red">{err}</p>}
      {role==='parent'&&children.length>0&&
        <section className="card row">
          <strong>子女：</strong>
          <button className={`btn ${child==='all'?'primary':''}`} onClick={()=>setChild('all')}>全部</button>
          {children.map(c=><button key={c.id} className={`btn ${child===c.id?'primary':''}`} onClick={()=>setChild(c.id)}>{c.name}</button>)}
        </section>
      }
      {view==='month'?
        <section className="card stack">
          <div className="row" style={{justifyContent:'space-between'}}>
            <button className="btn" onClick={()=>setBase(addMonths(base,-1))}>← 上月</button>
            <h2>{monthKey(base)}</h2>
            <button className="btn" onClick={()=>setBase(addMonths(base,1))}>下月 →</button>
          </div>
          <div className="month-grid">
            {weekdays.map(w=><div className="month-head" key={w}>星期{w}</div>)}
            {days.map(d=>{
              const date=ymd(d);
              const its=calendarItems.filter(i=>i.date===date);
              return (
                <div key={date} className={`month-cell ${d.getMonth()!==base.getMonth()?'dim':''}`}>
                  <div className="day-num">{d.getDate()}</div>
                  {its.slice(0,4).map((it,idx)=>(
                    <div key={idx} className={`mini-event ${it.purple?'purple':''} ${it.cancelled?'cancelled':''}`}>
                      {it.type==='meeting'?'🔵':'🟣'} {it.title}
                      {it.type==='meeting'&&canCancel&& (
                        <div style={{float:'right'}}>
                          {it.cancelled ? (
                            <button style={{border:0,background:'transparent',cursor:'pointer'}} onClick={()=>cancelDay(it.meeting.branchId,it.date)}>↺</button>
                          ) : (
                            <>
                              <button title="標記取消" style={{border:0,background:'transparent',cursor:'pointer'}} onClick={()=>cancelDay(it.meeting.branchId,it.date,'cancelled')}>✕</button>
                              <button title="標記休會" style={{border:0,background:'transparent',cursor:'pointer'}} onClick={()=>cancelDay(it.meeting.branchId,it.date,'recess')}>💤</button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </section>
      :
        <section className="card stack">
          <h2>清單</h2>
          {calendarItems.sort((a,b)=>a.date.localeCompare(b.date)).slice(0,60).map((it,idx)=>(
            <div key={idx} className={`event-line ${it.purple?'event-purple':'event-blue'}`}>
              <div>
                <strong>{it.cancelled? (it.meeting?.type==='recess'?'休會：':'已取消：') : ''}{it.type==='meeting'?'🔵':'🟣'} {it.title}</strong>
                <div className="muted">{it.date}{it.type==='event'?` · ${it.event?.location||'待定'} · ${it.event?.source||''}`:` · ${it.meeting?.startTime||''}-${it.meeting?.endTime||''} · ${it.meeting?.location||''}`}</div>
              </div>
              <div className="row">
                {it.type==='event'?<span>{rightForEvent(it.event)}</span>:<span className={`badge ${it.cancelled?'red':'green'}`}>{it.cancelled?(it.meeting?.type==='recess'?'休會':'取消'):'恆常'}</span>}
                {it.type==='meeting'&&canCancel&& (
                  <>
                    {it.cancelled ? (
                      <button className="btn" onClick={()=>cancelDay(it.meeting.branchId,it.date)}>恢復</button>
                    ) : (
                      <>
                        <button className="btn red" onClick={()=>cancelDay(it.meeting.branchId,it.date,'cancelled')}>✕ 取消</button>
                        <button className="btn" onClick={()=>cancelDay(it.meeting.branchId,it.date,'recess')}>💤 休會</button>
                      </>
                    )}
                  </>
                )}
                {it.type==='event'&&['super_admin','troop_super','admin','group_leader','branch_leader','coach'].includes(role)&&<a className="btn" href={`/admin/registrations?eventId=${it.event.id}`}>查看→</a>}
              </div>
            </div>
          ))}
        </section>
      }
    </div>
  );
}
