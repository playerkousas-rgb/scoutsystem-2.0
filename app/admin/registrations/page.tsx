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

  if(!s)return <div className="card">{err||'載入中...'}</div>;
  const event=s.events.find(e=>e.id===eventId);
  
  const memberTargets = event ? s.members.filter(m => event.targetMemberIds.includes(m.id)) : [];
  const leaderTargets = event ? s.users.filter(u => event.targetMemberIds.includes(u.id) && !memberTargets.some(m => m.id === u.id)) : [];
  const unifiedTargets = [
    ...memberTargets.map(m => ({ ...m, isLeader: false, branchId: m.branchId || 'b3' })),
    ...leaderTargets.map(u => ({ id: u.id, name: u.name, ymNumber: '領袖帳號', branchId: 'leader', patrolId: '', emergencyContactName: '自理', emergencyContactPhone: u.email || '—', isLeader: true }))
  ];

  function csv(){
    if(!s || !event) return;
    const rows=[['姓名','YMIS','支部','小隊/身份','回覆狀態','緊急聯絡人','緊急電話','付款狀態']];
    unifiedTargets.forEach(m => {
      const r=replyStatus(s,eventId,m.id);
      const p=s.patrols.find(x=>x.id===m.patrolId);
      const st = r?.type === 'registered' ? '確定參加' : r?.type === 'declined' ? '婉拒不參加' : r?.type === 'interested' ? '有興趣(待認)' : '尚未回覆';
      const pd = getIsPaid(m.id) ? '已完成付款' : '未付款';
      const bName = m.isLeader ? '領袖團隊' : (m.branchId || '');
      const pName = m.isLeader ? '領袖出席' : (p?.name || '無小隊分組');
      rows.push([m.name, m.ymNumber, bName, pName, st, m.emergencyContactName||'', m.emergencyContactPhone||'', pd]);
    });
    const blob=new Blob(['\ufeff'+rows.map(r=>r.map(c=>`"${c}"`).join(',')).join('\n')],{type:'text/csv'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${event.title}_全中文報名名單.csv`;a.click();URL.revokeObjectURL(url);
  }

  let totalYes = 0, totalHeart = 0, totalNo = 0, totalPending = 0, totalPaid = 0;
  
  const BRANCH_NAMES: Record<string, string> = {
    b1: '🎒 小童軍支部 (Grasshopper)',
    b2: '🐺 幼童軍支部 (Cub Scout)',
    b3: '⚜️ 童軍支部 (Scout)',
    b4: '🧭 深資童軍支部 (Venture)',
    b5: '🚶 樂行童軍支部 (Rover)',
    leader: '👔 旅團領袖與統籌團隊'
  };

  const branchMap: Record<string, { id: string; name: string; yes: number; heart: number; no: number; pending: number; paid: number; total: number }> = {};
  const patrolMap: Record<string, { name: string; yes: number; heart: number; no: number; pending: number; paid: number; total: number }> = {};

  unifiedTargets.forEach(m => {
    const bid = m.branchId || 'b3';
    branchMap[bid] ||= { id: bid, name: BRANCH_NAMES[bid] || bid, yes: 0, heart: 0, no: 0, pending: 0, paid: 0, total: 0 };
    branchMap[bid].total++;

    const r = replyStatus(s, eventId, m.id);
    const isPaidCur = getIsPaid(m.id);
    if (isPaidCur) { branchMap[bid].paid++; totalPaid++; }
    if (r?.type === 'registered') { branchMap[bid].yes++; totalYes++; }
    else if (r?.type === 'interested') { branchMap[bid].heart++; totalHeart++; }
    else if (r?.type === 'declined') { branchMap[bid].no++; totalNo++; }
    else { branchMap[bid].pending++; totalPending++; }

    if (!m.isLeader) {
      const p = s.patrols.find(x => x.id === m.patrolId);
      const pKey = p?.id || ('none_' + bid);
      const pName = p ? `${bid === 'b2' ? '幼童軍' : bid === 'b3' ? '童軍' : bid} · ${p.name}` : `${BRANCH_NAMES[bid]?.split(' ')[1] || bid} · 未分小隊`;
      patrolMap[pKey] ||= { name: pName, yes: 0, heart: 0, no: 0, pending: 0, paid: 0, total: 0 };
      patrolMap[pKey].total++;
      if (isPaidCur) patrolMap[pKey].paid++;
      if (r?.type === 'registered') patrolMap[pKey].yes++;
      else if (r?.type === 'interested') patrolMap[pKey].heart++;
      else if (r?.type === 'declined') patrolMap[pKey].no++;
      else patrolMap[pKey].pending++;
    }
  });

  const branchStats = Object.values(branchMap);
  const patrolStats = Object.values(patrolMap);
  const modifiedCount = Object.keys(paidOverrides).length;

  return <div className="stack"><section className="hero"><span className="badge gold">報名統計與付款管理</span><h1>活動報名名單與分層報名統計</h1><p>全中文展示總體報名概況，先分支部匯總（最多6格），再細分童軍與幼童軍小隊報名統計。</p></section>
    {err&&<p className="badge red">{err}</p>}
    <section className="card"><label>選擇活動<select value={eventId} onChange={e=>{setEventId(e.target.value);setPaidOverrides({});}}>{s.events.map(e=><option key={e.id} value={e.id}>{e.title}</option>)}</select></label></section>
    {event&&<>
    <section className="card stack" style={{ background: '#f8fafc', borderLeft: '6px solid #1a73e8' }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>📊 總體報名與付款概況</h2>
        <span className="badge blue" style={{ fontSize: '0.95rem' }}>目標總人數：{unifiedTargets.length} 人</span>
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
      <h3>🏢 第一層：各支部與領袖報名統計</h3>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {branchStats.map(b => (
          <div className="card stack" key={b.id} style={{ padding: 12, borderTop: '4px solid #1a73e8' }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="badge blue" style={{ fontWeight: 'bold', fontSize: '0.88rem' }}>{b.name}</span>
              <span className="muted" style={{ fontSize: '0.8rem' }}>共 {b.total} 人</span>
            </div>
            <div style={{ fontSize: '0.88rem', lineHeight: '1.7', marginTop: 4 }}>
              <div>✅ 確定參加：<strong style={{color:'#137333'}}>{b.yes}</strong> 人</div>
              <div>❌ 婉拒不參加：<strong style={{color:'#c5221f'}}>{b.no}</strong> 人</div>
              <div>❤️ 有興趣：<strong style={{color:'#b06000'}}>{b.heart}</strong> 人</div>
              <div>⚠️ 尚未回覆：<strong>{b.pending}</strong> 人</div>
              <div style={{ borderTop: '1px dashed #ddd', paddingTop: 4, marginTop: 4 }}>💰 已付款核對：<strong style={{color:'#1a73e8'}}>{b.paid}</strong> 人</div>
            </div>
          </div>
        ))}
      </div>
    </section>

    <section className="card stack">
      <h3>🦅 第二層：各小隊報名統計 (童軍與幼童軍)</h3>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
        {patrolStats.map(p => (
          <div className="card stack" key={p.name} style={{ padding: 12, borderTop: '4px solid #34a853' }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="badge green" style={{ fontWeight: 'bold', fontSize: '0.88rem' }}>{p.name}</span>
              <span className="muted" style={{ fontSize: '0.8rem' }}>共 {p.total} 人</span>
            </div>
            <div style={{ fontSize: '0.88rem', lineHeight: '1.7', marginTop: 4 }}>
              <div>✅ 確定參加：<strong style={{color:'#137333'}}>{p.yes}</strong> 人</div>
              <div>❌ 婉拒不參加：<strong style={{color:'#c5221f'}}>{p.no}</strong> 人</div>
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
      <table className="table"><thead><tr><th>姓名</th><th>支部/團隊</th><th>小隊/身份</th><th>回覆意願狀態</th><th>緊急電話</th><th>付款狀態</th><th>操作</th></tr></thead>
      <tbody>{unifiedTargets.map(m=>{
        const r=replyStatus(s,eventId,m.id);
        const p=s.patrols.find(x=>x.id===m.patrolId);
        const isPaidCur = getIsPaid(m.id);
        const isChanged = paidOverrides[m.id] !== undefined;
        return <tr key={m.id} style={isChanged ? { background: '#fffef0' } : {}}>
          <td><strong>{m.name}</strong></td><td><span className="badge blue">{m.isLeader ? '👔 領袖團隊' : (m.branchId||'—')}</span></td><td>{m.isLeader ? '出席領袖' : (p?.name||'未分隊')}</td>
          <td>
            {(() => {
              const st = r?.type;
              if (st === 'registered') return <span className="badge green" style={{fontWeight:'bold'}}>✅ 確定參加</span>;
              if (st === 'declined') return <span className="badge red" style={{fontWeight:'bold'}}>❌ 婉拒不參加</span>;
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
