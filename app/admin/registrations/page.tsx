'use client';
import { Suspense, useEffect, useState } from 'react';
import { AppState, loadState, replyStatus } from '@/lib/store';
import { apiTogglePaid } from '@/lib/api';
import { useSearchParams } from 'next/navigation';

const GROUP_DEFS = [
  { id: 'b1', name: '🎒 小童軍', full: '小童軍支部', color: '#ff9800', border: '#ffe0b2' },
  { id: 'b2', name: '🐺 幼童軍', full: '幼童軍支部', color: '#fbc02d', border: '#fff9c4' },
  { id: 'b3', name: '⚜️ 童軍', full: '童軍支部', color: '#34a853', border: '#ceead6' },
  { id: 'b4', name: '🧭 深資童軍', full: '深資童軍支部', color: '#ea4335', border: '#fad2cf' },
  { id: 'b5', name: '🚶 樂行童軍', full: '樂行童軍支部', color: '#1a73e8', border: '#d2e3fc' },
  { id: 'leader', name: '👔 領袖', full: '旅團領袖與統籌', color: '#9c27b0', border: '#e1bee7' },
  { id: 'parent', name: '👨‍👩‍👧 家長', full: '家長團隊', color: '#00897b', border: '#b2dfdb' }
];

function RegistrationsInner(){
  const [s,setS]=useState<AppState|null>(null);
  const [err,setErr]=useState('');
  const search=useSearchParams();
  const [eventId,setEventId]=useState('');
  const [paidOverrides, setPaidOverrides] = useState<Record<string, boolean>>({});
  const [loadingBatch, setLoadingBatch] = useState(false);

  // 現場點名與簽到狀態 (Live Check-In State)
  const [checkInMap, setCheckInMap] = useState<Record<string, boolean>>({});
  const [cardFilter, setCardFilter] = useState<'all' | 'checked_in' | 'pending' | 'registered'>('all');
  
  // Interactive expansion states
  const [expandedOverallStatus, setExpandedOverallStatus] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [expandedBranchStatus, setExpandedBranchStatus] = useState<{ branchId: string; status: string } | null>(null);
  const [activeListTab, setActiveListTab] = useState<string>('all');

  useEffect(()=>{
    loadState().then(st=>{
      setS(st);
      const q=search?.get('eventId');
      setEventId(q||st.events[0]?.id||'');
    }).catch(e=>setErr(e.message));
  },[]);

  async function togglePaid(mid:string){
    setErr('');
    try{
      const f=await apiTogglePaid(eventId,mid);
      setS(f);
    }catch(e:any){setErr(e.message)}
  }

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

  function toggleCheckIn(mid: string) {
    setCheckInMap(prev => ({ ...prev, [mid]: !prev[mid] }));
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
  
  const internalEvents = s.events.filter(e => e.kind !== 'notice_troop_participation' && e.source !== '圖書館引入');
  const externalEvents = s.events.filter(e => e.kind === 'notice_troop_participation' || e.source === '圖書館引入');

  const memberTargets = event ? s.members.filter(m => event.targetMemberIds.includes(m.id)) : [];
  const userTargets = event ? s.users.filter(u => event.targetMemberIds.includes(u.id) && !memberTargets.some(m => m.id === u.id)) : [];
  const unifiedTargets = [
    ...memberTargets.map(m => ({ ...m, isLeader: false, isParent: false, branchId: m.branchId || 'b3' })),
    ...userTargets.map(u => ({
      id: u.id, name: u.name,
      ymNumber: u.role === 'parent' ? '家長帳號' : '領袖帳號',
      branchId: u.role === 'parent' ? 'parent' : 'leader',
      patrolId: '', emergencyContactName: '自理', emergencyContactPhone: u.email || '—',
      isLeader: u.role !== 'parent', isParent: u.role === 'parent'
    }))
  ];

  const displayTargets = activeListTab === 'all' ? unifiedTargets : unifiedTargets.filter(m => m.branchId === activeListTab);

  function csv(){
    if(!s || !event) return;
    const tabName = activeListTab === 'all' ? '全部總合' : GROUP_DEFS.find(g=>g.id===activeListTab)?.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g,'') || activeListTab;
    const rows=[['姓名','YMIS','所屬單位','小隊/職務','現場點名簽到','回覆出席狀態','緊急聯絡人','緊急電話','付款核對狀態']];
    displayTargets.forEach(m => {
      const r=replyStatus(s,eventId,m.id);
      const p=s.patrols.find(x=>x.id===m.patrolId);
      const st = r?.type === 'registered' ? '確定參加' : r?.type === 'declined' ? '婉拒不參加' : r?.type === 'interested' ? '有興趣(待確認)' : '尚未回覆';
      const pd = getIsPaid(m.id) ? '已完成付款' : '未付款';
      const chk = checkInMap[m.id] ? '已現場簽到' : '未現場簽到';
      const bName = GROUP_DEFS.find(g=>g.id===m.branchId)?.full || m.branchId;
      const pName = m.isLeader ? '領袖團隊' : m.isParent ? '家長' : (p?.name || '未分小隊');
      rows.push([m.name, m.ymNumber, bName, pName, chk, st, m.emergencyContactName||'', m.emergencyContactPhone||'', pd]);
    });
    const blob=new Blob(['\ufeff'+rows.map(r=>r.map(c=>`"${c}"`).join(',')).join('\n')],{type:'text/csv'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${event.title}_${tabName}_考勤點名簽到表.csv`;a.click();URL.revokeObjectURL(url);
  }

  let totalYes = 0, totalHeart = 0, totalNo = 0, totalPending = 0, totalPaid = 0, totalCheckedIn = 0;
  unifiedTargets.forEach(m => {
    const r = replyStatus(s, eventId, m.id);
    if (getIsPaid(m.id)) totalPaid++;
    if (checkInMap[m.id]) totalCheckedIn++;
    if (r?.type === 'registered') totalYes++;
    else if (r?.type === 'interested') totalHeart++;
    else if (r?.type === 'declined') totalNo++;
    else totalPending++;
  });

  const modifiedCount = Object.keys(paidOverrides).length;

  return <div className="stack">
    <section className="hero">
      <span className="badge gold">點名簽到與報名管理</span>
      <h1>📍 現場點名簽到與活動報名對賬</h1>
      <p>現場簽到點名卡片系統：點選「📍 點名簽到」按鈕即可即時登錄現場出席，並支援 7 大支部直式對賬與 CSV 匯出。</p>
    </section>
    {err&&<p className="badge red">{err}</p>}

    {/* 1. 雙下拉選單選擇活動 */}
    <section className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
      <div className="card stack" style={{ borderTop: '4px solid #1a73e8', background: '#f8fafc' }}>
        <strong style={{ fontSize: '1.05rem', color: '#1a73e8' }}>🎪 旅團內部主辦／自辦活動：</strong>
        <select value={eventId} onChange={e=>{setEventId(e.target.value);setPaidOverrides({});setExpandedGroup(null);setExpandedOverallStatus(null);setExpandedBranchStatus(null);}}>
          {internalEvents.length===0&&<option value="">無自辦活動</option>}
          {internalEvents.map(e=><option key={e.id} value={e.id}>{e.title} ({e.date})</option>)}
        </select>
      </div>
      <div className="card stack" style={{ borderTop: '4px solid #f9ab00', background: '#fffef0' }}>
        <strong style={{ fontSize: '1.05rem', color: '#b06000' }}>📚 外部接入／圖書館引入通告：</strong>
        <select value={eventId} onChange={e=>{setEventId(e.target.value);setPaidOverrides({});setExpandedGroup(null);setExpandedOverallStatus(null);setExpandedBranchStatus(null);}}>
          {externalEvents.length===0&&<option value="">無外部接入通告</option>}
          {externalEvents.map(e=><option key={e.id} value={e.id}>{e.title} ({e.date})</option>)}
        </select>
      </div>
    </section>

    {event&&<>
    
    {/* 📍 現場點名與簽到卡片專區 (Live Attendance Check-In Cards) */}
    <section className="card stack" style={{ background: '#f0fdf4', border: '2px solid #22c55e' }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ margin: 0, color: '#15803d', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📍 現場點名與簽到卡片</span>
            <span className="badge green" style={{ fontSize: '0.85rem' }}>即時簽到卡片</span>
          </h2>
          <p className="muted" style={{ margin: '4px 0 0 0' }}>
            點選各卡片上的 **【📍 點名簽到】** 按鈕，即可快速清點現場出席人數（已現場簽到：{totalCheckedIn} / {unifiedTargets.length} 人）。
          </p>
        </div>
        
        {/* 過濾按鈕 */}
        <div className="row" style={{ gap: 6 }}>
          <button className={`btn ${cardFilter==='all'?'primary':''}`} onClick={()=>setCardFilter('all')}>全體卡片 ({unifiedTargets.length})</button>
          <button className={`btn ${cardFilter==='checked_in'?'green':''}`} style={cardFilter==='checked_in'?{background:'#16a34a',color:'#fff'}:{}} onClick={()=>setCardFilter('checked_in')}>🟢 已現場簽到 ({totalCheckedIn})</button>
          <button className={`btn ${cardFilter==='pending'?'gold':''}`} onClick={()=>setCardFilter('pending')}>⚠️ 尚未簽到 ({unifiedTargets.length - totalCheckedIn})</button>
        </div>
      </div>

      {/* 簽到卡片 Grid 網格 */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginTop: 12 }}>
        {unifiedTargets
          .filter(m => {
            if (cardFilter === 'checked_in') return checkInMap[m.id];
            if (cardFilter === 'pending') return !checkInMap[m.id];
            return true;
          })
          .map(m => {
            const r = replyStatus(s, eventId, m.id);
            const p = s.patrols.find(x => x.id === m.patrolId);
            const isCheckedIn = !!checkInMap[m.id];
            const isPaidCur = getIsPaid(m.id);
            const branchObj = GROUP_DEFS.find(g => g.id === m.branchId);

            return (
              <div
                key={m.id}
                className="card stack"
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: isCheckedIn ? '#f0fdf4' : '#ffffff',
                  border: isCheckedIn ? '2px solid #16a34a' : '1px solid #cbd5e1',
                  boxShadow: isCheckedIn ? '0 2px 8px rgba(22,163,74,0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
                  position: 'relative'
                }}
              >
                {/* 頂部標籤與標題 */}
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', backgroundColor: branchObj?.color || '#64748b', color: '#fff', marginBottom: '4px', display: 'inline-block' }}>
                      {branchObj?.name || m.branchId}
                    </span>
                    <h3 style={{ margin: '4px 0 0 0', fontSize: '1.1rem', color: '#0f172a' }}>{m.name}</h3>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {m.isLeader ? '👔 領袖出席' : m.isParent ? '👨‍👩‍👧 家長出席' : (p ? `${p.name}小隊` : '未分小隊')} | YMIS: {m.ymNumber}
                    </div>
                  </div>

                  {/* 簽到狀態 Badge */}
                  <div>
                    {isCheckedIn ? (
                      <span className="badge green" style={{ fontWeight: 'bold', fontSize: '0.85rem', padding: '4px 8px' }}>
                        🟢 已現場簽到
                      </span>
                    ) : (
                      <span className="badge" style={{ background: '#f1f3f4', color: '#64748b', fontSize: '0.8rem', padding: '4px 8px' }}>
                        ⚠️ 未簽到
                      </span>
                    )}
                  </div>
                </div>

                {/* 報名與付款概況小標註 */}
                <div className="row" style={{ gap: 6, fontSize: '0.8rem', marginTop: '4px' }}>
                  <span style={{ color: r?.type === 'registered' ? '#166534' : r?.type === 'declined' ? '#991b1b' : '#b45309' }}>
                    線上報名: {r?.type === 'registered' ? '✅ 確定參加' : r?.type === 'declined' ? '❌ 婉拒' : r?.type === 'interested' ? '❤️ 有興趣' : '⚠️ 尚未回覆'}
                  </span>
                  <span>|</span>
                  <span>{isPaidCur ? '💰 已付款' : '❌ 未付款'}</span>
                </div>

                {/* 按鈕動作列 */}
                <div className="row" style={{ gap: 8, marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                  <button
                    className={`btn ${isCheckedIn ? 'red' : 'primary'}`}
                    style={{ flex: 1, fontSize: '0.85rem', padding: '6px 10px', fontWeight: 'bold', backgroundColor: isCheckedIn ? '#dc2626' : '#16a34a', borderColor: isCheckedIn ? '#dc2626' : '#16a34a' }}
                    onClick={() => toggleCheckIn(m.id)}
                  >
                    {isCheckedIn ? '✕ 取消簽到' : '📍 點名簽到'}
                  </button>
                  <button
                    className={`btn ${isPaidCur ? 'gold' : ''}`}
                    style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                    onClick={() => toggleLocalPaid(m.id)}
                  >
                    {isPaidCur ? '💰 已付' : '未付'}
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </section>

    {/* 總體報名與付款概況 */}
    <section className="card stack" style={{ background: '#f8fafc', borderLeft: '6px solid #1a73e8' }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>📊 總體報名與付款概況 — {event.title}</h2>
        <span className="badge blue" style={{ fontSize: '0.95rem' }}>點選狀態卡片即可下展該分類全員名單</span>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginTop: 8 }}>
        <div className={`card ${expandedOverallStatus==='registered'?'notice-mode active':''}`} style={{ background: '#e6f4ea', borderColor: '#ceead6', padding: 12, cursor: 'pointer' }} onClick={() => setExpandedOverallStatus(expandedOverallStatus==='registered'?null:'registered')}>
          <div className="muted" style={{ fontWeight: 'bold' }}>✅ 確定參加 {expandedOverallStatus==='registered'?'🔽':''}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#137333' }}>{totalYes} <span style={{fontSize:'0.85rem'}}>人</span></div>
        </div>
        <div className={`card ${expandedOverallStatus==='declined'?'notice-mode active':''}`} style={{ background: '#fce8e6', borderColor: '#fad2cf', padding: 12, cursor: 'pointer' }} onClick={() => setExpandedOverallStatus(expandedOverallStatus==='declined'?null:'declined')}>
          <div className="muted" style={{ fontWeight: 'bold' }}>❌ 婉拒不參加 {expandedOverallStatus==='declined'?'🔽':''}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#c5221f' }}>{totalNo} <span style={{fontSize:'0.85rem'}}>人</span></div>
        </div>
        <div className={`card ${expandedOverallStatus==='interested'?'notice-mode active':''}`} style={{ background: '#fef7e0', borderColor: '#feefc3', padding: 12, cursor: 'pointer' }} onClick={() => setExpandedOverallStatus(expandedOverallStatus==='interested'?null:'interested')}>
          <div className="muted" style={{ fontWeight: 'bold' }}>❤️ 有興趣 (待認) {expandedOverallStatus==='interested'?'🔽':''}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#b06000' }}>{totalHeart} <span style={{fontSize:'0.85rem'}}>人</span></div>
        </div>
        <div className={`card ${expandedOverallStatus==='pending'?'notice-mode active':''}`} style={{ background: '#f1f3f4', borderColor: '#e8eaed', padding: 12, cursor: 'pointer' }} onClick={() => setExpandedOverallStatus(expandedOverallStatus==='pending'?null:'pending')}>
          <div className="muted" style={{ fontWeight: 'bold' }}>⚠️ 尚未回覆 {expandedOverallStatus==='pending'?'🔽':''}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#5f6368' }}>{totalPending} <span style={{fontSize:'0.85rem'}}>人</span></div>
        </div>
        <div className={`card ${expandedOverallStatus==='paid'?'notice-mode active':''}`} style={{ background: '#e8f0fe', borderColor: '#d2e3fc', padding: 12, cursor: 'pointer' }} onClick={() => setExpandedOverallStatus(expandedOverallStatus==='paid'?null:'paid')}>
          <div className="muted" style={{ fontWeight: 'bold' }}>💰 已完成付款 {expandedOverallStatus==='paid'?'🔽':''}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1a73e8' }}>{totalPaid} <span style={{fontSize:'0.85rem'}}>人</span></div>
        </div>
      </div>

      {expandedOverallStatus && (
        <div className="card stack" style={{ background: '#fffef0', border: '2px solid #1a73e8', marginTop: 10 }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '1.05rem', color: '#1a73e8' }}>
              📋 總體 · {expandedOverallStatus==='registered'?'✅ 確定參加':expandedOverallStatus==='declined'?'❌ 婉拒不參加':expandedOverallStatus==='interested'?'❤️ 有興趣':expandedOverallStatus==='paid'?'💰 已付款':'⚠️ 尚未回覆'}成員名單：
            </strong>
            <button className="btn" onClick={() => setExpandedOverallStatus(null)}>✕ 關閉</button>
          </div>
          <div className="row" style={{ flexWrap: 'wrap', gap: 6, maxHeight: 200, overflowY: 'auto', padding: 8, background: '#fff', borderRadius: 6 }}>
            {unifiedTargets.filter(m => {
              const r = replyStatus(s, eventId, m.id);
              if (expandedOverallStatus === 'paid') return getIsPaid(m.id);
              if (expandedOverallStatus === 'registered') return r?.type === 'registered';
              if (expandedOverallStatus === 'declined') return r?.type === 'declined';
              if (expandedOverallStatus === 'interested') return r?.type === 'interested';
              return !r?.type || (r.type as string) === 'unresponded';
            }).map(m => (
              <span key={m.id} className="badge" style={{ background: '#f8fafc', border: '1px solid #ccc', fontSize: '0.85rem' }}>
                {m.name} ({GROUP_DEFS.find(g=>g.id===m.branchId)?.name || m.branchId}) {getIsPaid(m.id)?'💰':''}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>

    {/* 第一層：7格直式支部、領袖與家長統計 */}
    <section className="card stack">
      <h3>🏢 第一層：各支部、領袖與家長出席報名統計 (共7格直式呈現)</h3>
      <p className="muted">點選卡片內具體欄位（如「✅ 確定」或「💰 付款」）即可立即在下方展開該支部的對應人員名字。</p>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        {GROUP_DEFS.map(g => {
          const gMembers = unifiedTargets.filter(m => m.branchId === g.id);
          let yesCnt = 0, heartCnt = 0, noCnt = 0, pendCnt = 0, paidCnt = 0;
          gMembers.forEach(m => {
            const r = replyStatus(s, eventId, m.id);
            if (getIsPaid(m.id)) paidCnt++;
            if (r?.type === 'registered') yesCnt++;
            else if (r?.type === 'interested') heartCnt++;
            else if (r?.type === 'declined') noCnt++;
            else pendCnt++;
          });

          return (
            <div key={g.id} className="card stack" style={{ borderTop: `4px solid ${g.color}`, background: '#fff', padding: 12 }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.95rem', color: g.color }}>{g.name}</strong>
                <span className="badge" style={{ fontSize: '0.75rem' }}>{gMembers.length} 人</span>
              </div>

              <div className="stack" style={{ gap: 4, marginTop: 6, fontSize: '0.82rem' }}>
                <div className="row" style={{ justifyContent: 'space-between', cursor: 'pointer', background: '#f0fdf4', padding: '2px 6px', borderRadius: 4 }} onClick={() => setExpandedBranchStatus({ branchId: g.id, status: 'registered' })}>
                  <span>✅ 確定參加</span>
                  <strong>{yesCnt}</strong>
                </div>
                <div className="row" style={{ justifyContent: 'space-between', cursor: 'pointer', background: '#fff1f2', padding: '2px 6px', borderRadius: 4 }} onClick={() => setExpandedBranchStatus({ branchId: g.id, status: 'declined' })}>
                  <span>❌ 婉拒不參加</span>
                  <strong>{noCnt}</strong>
                </div>
                <div className="row" style={{ justifyContent: 'space-between', cursor: 'pointer', background: '#fffbeb', padding: '2px 6px', borderRadius: 4 }} onClick={() => setExpandedBranchStatus({ branchId: g.id, status: 'interested' })}>
                  <span>❤️ 有興趣待認</span>
                  <strong>{heartCnt}</strong>
                </div>
                <div className="row" style={{ justifyContent: 'space-between', cursor: 'pointer', background: '#f8fafc', padding: '2px 6px', borderRadius: 4 }} onClick={() => setExpandedBranchStatus({ branchId: g.id, status: 'pending' })}>
                  <span>⚠️ 尚未回覆</span>
                  <strong>{pendCnt}</strong>
                </div>
                <div className="row" style={{ justifyContent: 'space-between', cursor: 'pointer', background: '#f0f9ff', padding: '2px 6px', borderRadius: 4, marginTop: 2, borderTop: '1px solid #e2e8f0' }} onClick={() => setExpandedBranchStatus({ branchId: g.id, status: 'paid' })}>
                  <span>💰 完成付款</span>
                  <strong>{paidCnt}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {expandedBranchStatus && (
        <div className="card stack" style={{ background: '#fffef0', border: '2px solid #f9ab00', marginTop: 10 }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '1.05rem', color: '#b06000' }}>
              📋 {GROUP_DEFS.find(g=>g.id===expandedBranchStatus.branchId)?.full} · {expandedBranchStatus.status==='registered'?'✅ 確定參加':expandedBranchStatus.status==='declined'?'❌ 婉拒不參加':expandedBranchStatus.status==='interested'?'❤️ 有興趣':expandedBranchStatus.status==='paid'?'💰 已付款':'⚠️ 尚未回覆'}名單：
            </strong>
            <button className="btn" onClick={() => setExpandedBranchStatus(null)}>✕ 關閉</button>
          </div>
          <div className="row" style={{ flexWrap: 'wrap', gap: 6, maxHeight: 200, overflowY: 'auto', padding: 8, background: '#fff', borderRadius: 6 }}>
            {unifiedTargets.filter(m => {
              if (m.branchId !== expandedBranchStatus.branchId) return false;
              const r = replyStatus(s, eventId, m.id);
              if (expandedBranchStatus.status === 'paid') return getIsPaid(m.id);
              if (expandedBranchStatus.status === 'registered') return r?.type === 'registered';
              if (expandedBranchStatus.status === 'declined') return r?.type === 'declined';
              if (expandedBranchStatus.status === 'interested') return r?.type === 'interested';
              return !r?.type || (r.type as string) === 'unresponded';
            }).map(m => (
              <span key={m.id} className="badge" style={{ background: '#f8fafc', border: '1px solid #ccc', fontSize: '0.85rem' }}>
                {m.name} {getIsPaid(m.id)?'💰':''}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>

    {/* 第二層：專屬兩大格童軍與幼童軍小隊報名統計 */}
    <section className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 16 }}>
      {/* 幼童軍大格 */}
      <div className="card stack" style={{ borderTop: '5px solid #fbc02d', background: '#fff' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#b06000' }}>🐺 幼童軍支部 · 各顏色小隊成員意願與付款</h3>
          <span className="badge gold">{unifiedTargets.filter(m=>m.branchId==='b2').length} 人</span>
        </div>
        <p className="muted">直接展示小隊全員名單與標記 (✅參加 ❌婉拒 ⚠️未覆 💰付款，❤️有興趣可同時並存)。</p>
        <div className="stack" style={{ gap: 10 }}>
          {s.patrols.filter(p=>p.branchId==='b2').map(p => {
            const pMembers = unifiedTargets.filter(m => m.patrolId === p.id);
            return (
              <div key={p.id} className="card stack" style={{ padding: '8px 10px', background: '#fcfcfc', border: '1px solid #e0e0e0' }}>
                <div className="row" style={{ justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: 4 }}>
                  <strong style={{ fontSize: '0.9rem', color: '#b06000' }}>{p.name}隊 ({p.short})</strong>
                  <span className="muted" style={{ fontSize: '0.8rem' }}>{pMembers.length} 人</span>
                </div>
                <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {pMembers.length === 0 ? <span className="muted" style={{ fontSize: '0.8rem' }}>無小隊成員</span> :
                    pMembers.map(m => {
                      const r = replyStatus(s, eventId, m.id);
                      const isPaidCur = getIsPaid(m.id);
                      const isChecked = checkInMap[m.id];
                      const st = r?.type;
                      const mainIcon = st === 'registered' ? '✅' : st === 'declined' ? '❌' : st === 'interested' ? '❤️' : '⚠️';
                      const hasHeart = st === 'interested' || ((r as any)?.notes && (r as any).notes.includes('有興趣')) || (st === 'registered' && (r as any)?.notes && (r as any).notes.includes('心'));
                      return (
                        <span key={m.id} style={{
                          padding: '3px 8px', borderRadius: 6, fontSize: '0.83rem',
                          background: isChecked ? '#dcfce7' : st === 'registered' ? '#e6f4ea' : st === 'declined' ? '#fce8e6' : st === 'interested' ? '#fef7e0' : '#f1f3f4',
                          border: isChecked ? '1px solid #16a34a' : '1px solid #ccc', display: 'inline-flex', alignItems: 'center', gap: 3
                        }}>
                          {m.name} {mainIcon}{st !== 'interested' && hasHeart ? '❤️' : ''}{isPaidCur ? '💰' : ''}{isChecked ? '🟢' : ''}
                        </span>
                      );
                    })
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 童軍大格 */}
      <div className="card stack" style={{ borderTop: '5px solid #34a853', background: '#fff' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#137333' }}>⚜️ 童軍支部 · 各動物小隊成員意願與付款</h3>
          <span className="badge green">{unifiedTargets.filter(m=>m.branchId==='b3').length} 人</span>
        </div>
        <p className="muted">直接展示小隊全員名單與標記 (✅參加 ❌婉拒 ⚠️未覆 💰付款，❤️有興趣可同時並存)。</p>
        <div className="stack" style={{ gap: 10 }}>
          {s.patrols.filter(p=>p.branchId==='b3').map(p => {
            const pMembers = unifiedTargets.filter(m => m.patrolId === p.id);
            return (
              <div key={p.id} className="card stack" style={{ padding: '8px 10px', background: '#fcfcfc', border: '1px solid #e0e0e0' }}>
                <div className="row" style={{ justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: 4 }}>
                  <strong style={{ fontSize: '0.9rem', color: '#137333' }}>{p.name}小隊 ({p.short})</strong>
                  <span className="muted" style={{ fontSize: '0.8rem' }}>{pMembers.length} 人</span>
                </div>
                <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {pMembers.length === 0 ? <span className="muted" style={{ fontSize: '0.8rem' }}>無小隊成員</span> :
                    pMembers.map(m => {
                      const r = replyStatus(s, eventId, m.id);
                      const isPaidCur = getIsPaid(m.id);
                      const isChecked = checkInMap[m.id];
                      const st = r?.type;
                      const mainIcon = st === 'registered' ? '✅' : st === 'declined' ? '❌' : st === 'interested' ? '❤️' : '⚠️';
                      const hasHeart = st === 'interested' || ((r as any)?.notes && (r as any).notes.includes('有興趣')) || (st === 'registered' && (r as any)?.notes && (r as any).notes.includes('心'));
                      return (
                        <span key={m.id} style={{
                          padding: '3px 8px', borderRadius: 6, fontSize: '0.83rem',
                          background: isChecked ? '#dcfce7' : st === 'registered' ? '#e6f4ea' : st === 'declined' ? '#fce8e6' : st === 'interested' ? '#fef7e0' : '#f1f3f4',
                          border: isChecked ? '1px solid #16a34a' : '1px solid #ccc', display: 'inline-flex', alignItems: 'center', gap: 3
                        }}>
                          {m.name} {mainIcon}{st !== 'interested' && hasHeart ? '❤️' : ''}{isPaidCur ? '💰' : ''}{isChecked ? '🟢' : ''}
                        </span>
                      );
                    })
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>

    {/* 最底名單：分成各支部、領袖、家長和總合共8個分頁方便匯出 */}
    <section className="card stack">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ margin: 0 }}>📋 出席、簽到與付款核對名單表 (共 8 個分頁對賬與 CSV 匯出)</h3>
        {modifiedCount > 0 && (
          <button className="btn primary" disabled={loadingBatch} style={{ background: '#2e7d32', borderColor: '#1b5e20' }} onClick={saveBatchPaid}>
            {loadingBatch ? '⏳ 批次同步寫入中...' : `💾 一鍵同步儲存 ${modifiedCount} 筆暫存付款`}
          </button>
        )}
      </div>

      <div className="row" style={{ flexWrap: 'wrap', gap: 6, borderBottom: '2px solid #eee', paddingBottom: 8 }}>
        <button className={`btn ${activeListTab==='all'?'primary':''}`} onClick={()=>setActiveListTab('all')}>🌟 全部總合 ({unifiedTargets.length})</button>
        {GROUP_DEFS.map(g => {
          const cnt = unifiedTargets.filter(m => m.branchId === g.id).length;
          return <button key={g.id} className={`btn ${activeListTab===g.id?'primary':''}`} style={activeListTab===g.id ? {background:g.color, borderColor:g.color} : {}} onClick={()=>setActiveListTab(g.id)}>{g.name} ({cnt})</button>;
        })}
      </div>

      <table className="table"><thead><tr><th>姓名</th><th>所屬單位</th><th>小隊/職務</th><th>現場簽到</th><th>線上報名狀態</th><th>緊急電話</th><th>付款核對</th><th>操作</th></tr></thead>
      <tbody>{displayTargets.map(m=>{
        const r=replyStatus(s,eventId,m.id);
        const p=s.patrols.find(x=>x.id===m.patrolId);
        const isPaidCur = getIsPaid(m.id);
        const isChecked = !!checkInMap[m.id];
        const isChanged = paidOverrides[m.id] !== undefined;
        return <tr key={m.id} style={isChecked ? { background: '#f0fdf4' } : isChanged ? { background: '#fffef0' } : {}}>
          <td><strong>{m.name}</strong></td>
          <td><span className="badge blue">{GROUP_DEFS.find(g=>g.id===m.branchId)?.name || m.branchId}</span></td>
          <td>{m.isLeader ? '👔 領袖出席' : m.isParent ? '👨‍👩‍👧 家長出席' : (p?.name || '未分小隊')}</td>
          <td>
            {isChecked ? (
              <span className="badge green" style={{ fontWeight: 'bold' }}>🟢 已現場簽到</span>
            ) : (
              <span className="badge" style={{ background: '#f1f3f4', color: '#555' }}>⚠️ 未簽到</span>
            )}
          </td>
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
            <button className={`btn ${isChecked ? 'red' : 'green'}`} style={{ fontSize: '0.82em' }} onClick={()=>toggleCheckIn(m.id)}>
              {isChecked ? '✕ 取消簽到' : '📍 點名簽到'}
            </button>{' '}
            <button className={`btn ${isChanged ? 'gold' : ''}`} style={{ fontSize: '0.82em' }} onClick={()=>toggleLocalPaid(m.id)}>{isPaidCur ? '❌ 未付' : '💰 已付'}</button>
          </td>
        </tr>})}</tbody></table>

      <div className="row" style={{marginTop:8, justifyContent:'space-between'}}>
        <button className="btn primary" onClick={csv}>📥 匯出當前頁簽 ({activeListTab === 'all' ? '全部總合' : GROUP_DEFS.find(g=>g.id===activeListTab)?.name}) 中文點名簽到 CSV</button>
        {modifiedCount > 0 && (
          <button className="btn primary" disabled={loadingBatch} style={{ background: '#2e7d32', borderColor: '#1b5e20' }} onClick={saveBatchPaid}>
            {loadingBatch ? '⏳ 批次同步寫入中...' : `💾 一鍵同步儲存 ${modifiedCount} 筆暫存付款`}
          </button>
        )}
      </div>
    </section></>}
  </div>;
}

export default function Page(){
  return <Suspense fallback={<div className="card">載入中...</div>}><RegistrationsInner/></Suspense>;
}
