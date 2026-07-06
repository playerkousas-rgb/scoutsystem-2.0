'use client';
import { Suspense, useEffect, useState } from 'react';
import { AppState, loadState, replyStatus } from '@/lib/store';
import { apiTogglePaid } from '@/lib/api';
import { useSearchParams } from 'next/navigation';

function RegistrationsInner(){
  const [s,setS]=useState<AppState|null>(null);const [err,setErr]=useState('');
  const search=useSearchParams();
  const [eventId,setEventId]=useState('');
  const [paidOverrides, setPaidOverrides] = useState<Record<string, boolean>>({});
  const [loadingBatch, setLoadingBatch] = useState(false);

  useEffect(()=>{loadState().then(st=>{setS(st);const q=search?.get('eventId');setEventId(q||st.events[0]?.id||'')}).catch(e=>setErr(e.message))},[]);
  async function togglePaid(mid:string){setErr('');try{const f=await apiTogglePaid(eventId,mid);setS(f)}catch(e:any){setErr(e.message)}}

  function getIsPaid(mid: string) {
    if (!s) return false;
    if (paidOverrides[mid] !== undefined) return paidOverrides[mid];
    const r = replyStatus(s, eventId, mid);
    return !!r?.paid;
  }

  function toggleLocalPaid(mid: string) {
    const cur = getIsPaid(mid);
    setPaidOverrides(prev => ({ ...prev, [mid]: !cur }));
  }

  async function saveBatchPaid() {
    if (!s) return;
    const keys = Object.keys(paidOverrides);
    if (keys.length === 0) return;
    setLoadingBatch(true);
    try {
      for (const mid of keys) {
        const targetPaid = paidOverrides[mid];
        const curReplyPaid = !!replyStatus(s, eventId, mid)?.paid;
        if (targetPaid !== curReplyPaid) {
          await apiTogglePaid(eventId, mid);
        }
      }
      const st = await loadState();
      setS(st);
      setPaidOverrides({});
    } catch(e:any) { setErr(e.message); } finally { setLoadingBatch(false); }
  }

  function csv(){
    if(!s)return;const e=s.events.find(x=>x.id===eventId);if(!e)return;
    const rows=[['姓名','YMIS','支部','小隊','回覆狀態','緊急聯絡人','緊急電話','付款狀態']];
    e.targetMemberIds.forEach(mid=>{
      const m=s.members.find(x=>x.id===mid);if(!m)return;
      const r=replyStatus(s,eventId,mid);const p=s.patrols.find(x=>x.id===m.patrolId);
      const st = r?.type === 'registered' ? '確定參加' : r?.type === 'declined' ? '婉拒不參加' : r?.type === 'interested' ? '有興趣(待確認)' : '尚未回覆';
      const pd = getIsPaid(mid) ? '已完成付款' : '未付款';
      rows.push([m.name,m.ymNumber,m.branchId||'',p?.name||'無分隊/不適用',st,m.emergencyContactName||'',m.emergencyContactPhone||'',pd]);
    });
    const blob=new Blob(['\ufeff'+rows.map(r=>r.map(c=>`"${c}"`).join(',')).join('\n')],{type:'text/csv'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${e.title}_中文報名名單.csv`;a.click();URL.revokeObjectURL(url);
  }
  if(!s)return <div className="card">{err||'載入中...'}</div>;
  const event=s.events.find(e=>e.id===eventId);
  const targets=event?s.members.filter(m=>event.targetMemberIds.includes(m.id)):[];
  
  let totalYes = 0, totalHeart = 0, totalNo = 0, totalPending = 0, totalPaid = 0;
  const map:Record<string,{name:string;yes:number;heart:number;no:number;pending:number;paid:number;total:number}>={};
  targets.forEach(m=>{
    const p=s.patrols.find(x=>x.id===m.patrolId);
    const key=p?.id||'none';
    map[key]||={name:p?.name||'無分隊 / 旅部統籌',yes:0,heart:0,no:0,pending:0,paid:0,total:0};
    map[key].total++;
    const r=replyStatus(s,eventId,m.id);
    if(getIsPaid(m.id)) { map[key].paid++; totalPaid++; }
    if(r?.type==='registered') { map[key].yes++; totalYes++; }
    else if(r?.type==='interested') { map[key].heart++; totalHeart++; }
    else if(r?.type==='declined') { map[key].no++; totalNo++; }
    else { map[key].pending++; totalPending++; }
  });
  const patrolStats=Object.values(map);
  const modifiedCount = Object.keys(paidOverrides).length;

  return <div className="stack"><section className="hero"><span className="badge gold">報名統計與付款管理</span><h1>報名名單及匯出</h1><p>全中文清楚展示總體與小隊報名與付款統計，可暫存多筆切換後批次同步試算表。</p></section>
    {err&&<p className="badge red">{err}</p>}
    <section className="card"><label>選擇活動<select value={eventId} onChange={e=>{setEventId(e.target.value);setPaidOverrides({});}}>{s.events.map(e=><option key={e.id} value={e.id}>{e.title}</option>)}</select></label></section>
    {event&&<>
    <section className="card stack" style={{ background: '#f8fafc', borderLeft: '6px solid #1a73e8' }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>📊 總體報名與付款概況</h2>
        <span className="badge blue" style={{ fontSize: '0.95rem' }}>目標總人數：{targets.length} 人</span>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginTop: 8 }}>
        <div className="card" style={{ background: '#e6f4ea', borderColor: '#ceead6', padding: 12 }}>
          <div className="muted" style={{ fontWeight: 'bold' }}>✅ 確定參加</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#137333' }}>{totalYes} <span style={{fontSize:'0.85rem'}}>人</span></div>
        </div>
        <div className="card" style={{ background: '#fce8e6', borderColor: '#fad2cf', padding: 12 }}>
          <div className="muted" style={{ fontWeight: 'bold' }}>❌ 婉拒不參加</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#c5221f' }}>{totalNo} <span style={{fontSize:'0.85rem'}}>人</span></div>
        </div>
        <div className="card" style={{ background: '#fef7e0', borderColor: '#feefc3', padding: 12 }}>
          <div className="muted" style={{ fontWeight: 'bold' }}>❤️ 有興趣 (待認)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#b06000' }}>{totalHeart} <span style={{fontSize:'0.85rem'}}>人</span></div>
        </div>
        <div className="card" style={{ background: '#f1f3f4', borderColor: '#e8eaed', padding: 12 }}>
          <div className="muted" style={{ fontWeight: 'bold' }}>⚠️ 尚未回覆</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#5f6368' }}>{totalPending} <span style={{fontSize:'0.85rem'}}>人</span></div>
        </div>
        <div className="card" style={{ background: '#e8f0fe', borderColor: '#d2e3fc', padding: 12 }}>
          <div className="muted" style={{ fontWeight: 'bold' }}>💰 已完成付款</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1a73e8' }}>{totalPaid} <span style={{fontSize:'0.85rem'}}>人</span></div>
        </div>
      </div>
    </section>

    <section className="card stack">
      <h3>🦅 各小隊細分統計概況</h3>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
        {patrolStats.map(p => (
          <div className="card stack" key={p.name} style={{ padding: 12 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="badge blue" style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{p.name}</span>
              <span className="muted" style={{ fontSize: '0.8rem' }}>共 {p.total} 人</span>
            </div>
            <div style={{ fontSize: '0.88rem', lineHeight: '1.7', marginTop: 4 }}>
              <div>✅ 確定參加：<strong style={{color:'#137333'}}>{p.yes}</strong> 人</div>
              <div>❌ 婉拒參加：<strong style={{color:'#c5221f'}}>{p.no}</strong> 人</div>
              <div>❤️ 有興趣：<strong style={{color:'#b06000'}}>{p.heart}</strong> 人</div>
              <div>⚠️ 尚未回覆：<strong>{p.pending}</strong> 人</div>
              <div style={{ borderTop: '1px dashed #ddd', paddingTop: 4, marginTop: 4 }}>💰 已付款核對：<strong style={{color:'#1a73e8'}}>{p.paid}</strong> 人</div>
            </div>
          </div>
        ))}
      </div>
    </section>
    <section className="card">
      {modifiedCount > 0 && (
        <div className="row" style={{ padding: '12px 16px', background: '#fffde7', border: '2px solid #f9ab00', borderRadius: 8, marginBottom: 12, justifyContent: 'space-between', alignItems: 'center' }}>
          <span>🔔 有 {modifiedCount} 筆暫存付款變更尚未寫入試算表</span>
          <button className="btn primary" disabled={loadingBatch} style={{ background: '#2e7d32', borderColor: '#1b5e20' }} onClick={saveBatchPaid}>
            {loadingBatch ? '⏳ 批次同步寫入中...' : `💾 一鍵儲存 ${modifiedCount} 筆付款變更`}
          </button>
        </div>
      )}
      <table className="table"><thead><tr><th>姓名</th><th>小隊</th><th>回覆狀態</th><th>緊急電話</th><th>付款狀態</th><th>操作</th></tr></thead>
      <tbody>{targets.map(m=>{
        const r=replyStatus(s,eventId,m.id);
        const p=s.patrols.find(x=>x.id===m.patrolId);
        const isPaidCur = getIsPaid(m.id);
        const isChanged = paidOverrides[m.id] !== undefined;
        return <tr key={m.id} style={isChanged ? { background: '#fffef0' } : {}}>
          <td><strong>{m.name}</strong></td><td>{p?.name||'不適用'}</td>
          <td>
            {(() => {
              const st = r?.type;
              if (st === 'registered') return <span className="badge green" style={{fontWeight:'bold'}}>✅ 確定參加</span>;
              if (st === 'declined') return <span className="badge red" style={{fontWeight:'bold'}}>❌ 婉拒參加</span>;
              if (st === 'interested') return <span className="badge gold" style={{fontWeight:'bold'}}>❤️ 有興趣(待認)</span>;
              return <span className="badge" style={{background:'#f1f3f4',color:'#555'}}>⚠️ 尚未回覆</span>;
            })()}
          </td>
          <td>{m.emergencyContactPhone||'—'}</td>
          <td>{isPaidCur?<span className="badge green" style={{fontWeight:'bold'}}>💰 已付款</span>:<span className="badge red" style={{fontWeight:'bold'}}>❌ 未付款</span>}</td>
          <td>
            <button className={`btn ${isChanged ? 'gold' : ''}`} onClick={()=>toggleLocalPaid(m.id)}>{isChanged ? '↩️ 暫存切換' : '切換付款 (暫存)'}</button>{' '}
            <button className="btn" style={{fontSize:'0.85em'}} onClick={()=>togglePaid(m.id)}>即時單筆同步</button>
          </td>
        </tr>})}</tbody></table>
      <div className="row" style={{marginTop:12}}>
        <button className="btn primary" onClick={csv}>📥 匯出中文報名名單 CSV</button>
        {modifiedCount > 0 && (
          <button className="btn primary" disabled={loadingBatch} style={{ background: '#2e7d32', borderColor: '#1b5e20' }} onClick={saveBatchPaid}>
            {loadingBatch ? '⏳ 批次同步寫入中...' : `💾 一鍵儲存 ${modifiedCount} 筆付款變更`}
          </button>
        )}
      </div>
    </section></>}
  </div>;
}

export default function Page(){
  return <Suspense fallback={<div className="card">載入中...</div>}><RegistrationsInner/></Suspense>;
}
