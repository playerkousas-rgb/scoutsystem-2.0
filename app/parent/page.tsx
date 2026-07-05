'use client';
import { useEffect, useState } from 'react';
import { AppState, loadState, replyStatus } from '@/lib/store';
import { apiSetReply } from '@/lib/api';
import { getSession } from '@/lib/session';
import Collapsible from '@/components/Collapsible';
import Link from 'next/link';

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

  return (
    <div className="stack">
      <section className="card stack" style={{ background: 'linear-gradient(135deg, #7b1fa2 0%, #9c27b0 100%)', color: '#fff' }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: 0 }}>👤 {parent.name}</h2>
              <p style={{ opacity: 0.9, margin: 0 }}>身份：家長</p>
            </div>
            <div className="row">
              <Link href="/profile" className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>個人設定 / 改密碼</Link>
            </div>
        </div>
      </section>

      <section className="hero">
        <span className="badge gold">家長控制台</span>
        <p>管理子女活動報名與資訊。</p>
      </section>
      
      {err&&<p className="badge red">{err}</p>}
      
      {children.length===0 ? (
        <section className="card"><p className="muted">尚未連結任何子女。請聯絡領袖在成員資料庫中連結你的帳號。</p></section>
      ) : (
        children.map(c => (
          <Collapsible title={`${c.name} 的活動`} defaultOpen={true} key={c.id}>
            <div className="stack">
              {s.events.filter(e => e.status === 'published' && e.targetMemberIds.includes(c.id)).map(e => {
                const r = replyStatus(s, e.id, c.id);
                return (
                  <div className="event-line event-blue" key={e.id}>
                    <div>
                      <strong>{e.title}</strong>
                      <div className="muted">{e.date} · {e.location}{e.fee?` · ${e.fee}`:''}</div>
                      {e.paymentUrl && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <a href={e.paymentUrl} target="_blank" rel="noopener noreferrer" className="btn gold" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}>前往付款</a>
                        </div>
                      )}
                    </div>
                    <div className="row">
                      <span className="badge gold">{r?.type||'未回覆'}</span>
                      <button className="btn primary" disabled={loadingId===e.id+c.id} onClick={()=>respond(e.id,c.id,'registered')}>✅ 參加</button>
                      <button className="btn" disabled={loadingId===e.id+c.id} onClick={()=>respond(e.id,c.id,'declined')}>❌ 不參加</button>
                    </div>
                  </div>
                );
              })}
              {s.events.filter(e => e.status === 'published' && e.targetMemberIds.includes(c.id)).length === 0 && <p className="muted">暫無待回覆活動。</p>}
            </div>
          </Collapsible>
        ))
      )}

      <Collapsible title="🆘 家庭聯絡資料">
        <div className="stack card" style={{ background: '#f8f9fa' }}>
          <div className="row"><strong>家長：</strong><span>{parent.name}</span></div>
          <div className="row"><strong>Email：</strong><span>{parent.email}</span></div>
          {children.map(c => (
            <div key={c.id} className="stack" style={{ borderTop: '1px solid #ddd', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
              <div className="row"><strong>子女：</strong><span>{c.name} ({c.ymNumber})</span></div>
              <div className="row"><strong>支部：</strong><span>{c.branchId}</span></div>
            </div>
          ))}
        </div>
      </Collapsible>

      <div className="row" style={{ marginTop: '2rem' }}>
        <Link className="btn" href="/profile">修改個人資料 / 改密碼</Link>
        <Link className="btn" href="/calendar">行事曆</Link>
      </div>
    </div>
  );
}
