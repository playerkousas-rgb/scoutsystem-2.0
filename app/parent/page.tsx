'use client';
import { useEffect, useState } from 'react';
import { AppState, loadState, replyStatus } from '@/lib/store';
import { apiSetReply } from '@/lib/api';
import { getSession } from '@/lib/session';
export default function Parent(){
  const [s,setS]=useState<AppState|null>(null);const [err,setErr]=useState('');
  const [loadingId,setLoadingId]=useState('');
  useEffect(()=>{loadState().then(setS).catch(e=>setErr(e.message))},[]);
  const session=getSession();
  if(err)return <div className="card"><p className="badge red">{err}</p></div>;
  if(!s)return <div className="card">載入中...</div>;
  const parent=s.users.find(u=>u.id===(session?.userId))||s.users.find(u=>u.role==='parent');
  if(!parent)return <div className="card">找不到家長帳號。</div>;
  const children=s.members.filter(m=>(parent.childMemberIds||[]).includes(m.id)||m.parentUserId===parent.id);
  async function respond(eid:string,mid:string,type:'registered'|'declined'){
    setLoadingId(eid+mid);setErr('');
    try{const f=await apiSetReply({eventId:eid,memberId:mid,type,parentUserId:parent.id});setS(f)}catch(e:any){setErr(e.message)}finally{setLoadingId('')}
  }
  return <div className="stack"><section className="hero"><span className="badge gold">家長控制台</span><h1>子女活動回覆</h1><p>為子女回覆 ✅ 參加 / ❌ 不參加，直接寫入後台 EventReplies。</p></section>
    {err&&<p className="badge red">{err}</p>}
    {children.length===0?<section className="card"><p className="muted">尚未連結任何子女。請聯絡領袖在成員資料庫中連結你的帳號。</p></section>:
    children.map(c=><section className="card stack" key={c.id}><h2>{c.name} <span className="badge blue">{c.ymNumber}</span></h2>
      {s.events.filter(e=>e.status==='published'&&e.targetMemberIds.includes(c.id)).map(e=>{
        const r=replyStatus(s,e.id,c.id);
        return <div className="event-line event-blue" key={e.id}><div><strong>{e.title}</strong><div className="muted">{e.date} · {e.location}{e.fee?` · ${e.fee}`:''}</div></div>
          <div className="row"><span className="badge gold">{r?.type||'未回覆'}</span>
            <button className="btn primary" disabled={loadingId===e.id+c.id} onClick={()=>respond(e.id,c.id,'registered')}>✅ 參加</button>
            <button className="btn" disabled={loadingId===e.id+c.id} onClick={()=>respond(e.id,c.id,'declined')}>❌ 不參加</button>
          </div></div>;
      })}
      {s.events.filter(e=>e.status==='published'&&e.targetMemberIds.includes(c.id)).length===0&&<p className="muted">暫無待回覆活動。</p>}
    </section>)}
  </div>;
}
