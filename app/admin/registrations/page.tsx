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
  const [s,setS]=useState<AppState|null>(null);const [err,setErr]=useState('');
  const search=useSearchParams();
  const [eventId,setEventId]=useState('');
  const [paidOverrides, setPaidOverrides] = useState<Record<string, boolean>>({});
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [expandedPatrol, setExpandedPatrol] = useState<string | null>(null);
  const [activeListTab, setActiveListTab] = useState<string>('all');

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
    const rows=[['姓名','YMIS','所屬單位','小隊/職務','回覆出席狀態','緊急聯絡人','緊急電話','付款核對狀態']];
    displayTargets.forEach(m => {
      const r=replyStatus(s,eventId,m.id);
      const p=s.patrols.find(x=>x.id===m.patrolId);
      const st = r?.type === 'registered' ? '確定參加' : r?.type === 'declined' ? '婉拒不參加' : r?.type === 'interested' ? '有興趣(待確認)' : '尚未回覆';
      const pd = getIsPaid(m.id) ? '已完成付款' : '未付款';
      const bName = GROUP_DEFS.find(g=>g.id===m.branchId)?.full || m.branchId;
      const pName = m.isLeader ? '領袖團隊' : m.isParent ? '家長' : (p?.name || '未分小隊');
      rows.push([m.name, m.ymNumber, bName, pName, st, m.emergencyContactName||'', m.emergencyContactPhone||'', pd]);
    });
    const blob=new Blob(['\ufeff'+rows.map(r=>r.map(c=>`"${c}"`).join(',')).join('\n')],{type:'text/csv'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${event.title}_${tabName}_報名名單.csv`;a.click();URL.revokeObjectURL(url);
  }

  let totalYes = 0, totalHeart = 0, totalNo = 0, totalPending = 0, totalPaid = 0;
  unifiedTargets.forEach(m => {
    const r = replyStatus(s, eventId, m.id);
    if (getIsPaid(m.id)) totalPaid++;
    if (r?.type === 'registered') totalYes++;
    else if (r?.type === 'interested') totalHeart++;
    else if (r?.type === 'declined') totalNo++;
    else totalPending++;
  });

  const modifiedCount = Object.keys(paidOverrides).length;

  return <div className="stack">
    <section className="hero">
      <span className="badge gold">報名統計與分層對賬</span>
      <h1>活動報名名單與分層對賬管理</h1>
      <p>雙下拉選單分流自辦與外部通告，7大直式格完整呈現各支部與領袖出席，雙大格歸納童軍及幼童軍小隊統計。最底附設8分頁對賬名單一鍵匯出。</p>
    </section>
    {err&&<p className="badge red">{err}</p>}

    {/* 1. 雙下拉選單選擇活動 */}
    <section className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
      <div className="card stack" style={{ borderTop: '4px solid #1a73e8', background: '#f8fafc' }}>
        <strong style={{ fontSize: '1.05rem', color: '#1a73e8' }}>🎪 旅團內部主辦／自辦活動：</strong>
        <select value={eventId} onChange={e=>{setEventId(e.target.value);setPaidOverrides({});setExpandedGroup(null);setExpandedPatrol(null);}}>
          {internalEvents.length===0&&<option value="">無自辦活動</option>}
          {internalEvents.map(e=><option key={e.id} value={e.id}>{e.title} ({e.date})</option>)}
        </select>
      </div>
      <div className="card stack" style={{ borderTop: '4px solid #f9ab00', background: '#fffef0' }}>
        <strong style={{ fontSize: '1.05rem', color: '#b06000' }}>📚 外部接入／圖書館引入通告：</strong>
        <select value={eventId} onChange={e=>{setEventId(e.target.value);setPaidOverrides({});setExpandedGroup(null);setExpandedPatrol(null);}}>
          {externalEvents.length===0&&<option value="">無外部接入通告</option>}
          {externalEvents.map(e=><option key={e.id} value={e.id}>{e.title} ({e.date})</option>)}
        </select>
      </div>
    </section>

    {event&&<>
    <section className="card stack" style={{ background: '#f8fafc', borderLeft: '6px solid #1a73e8' }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>📊 總體報名與付款概況 — {event.title}</h2>
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

    {/* 2. 第一層：7格直式支部、領袖與家長統計 */}
    <section className="card stack">
      <h3>🏢 第一層：各支部、領袖與家長出席報名統計 (共7格直式呈現)</h3>
      <p className="muted">點選底部「👁️ 展開名單」即可即時查看該分類下所有成員的具體出席狀況。</p>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        {GROUP_DEFS.map(g => {
          const grpMembers = unifiedTargets.filter(m => m.branchId === g.id);
          let yes=0, no=0, heart=0, pend=0, paid=0;
          grpMembers.forEach(m => {
            const r = replyStatus(s, eventId, m.id);
            if (getIsPaid(m.id)) paid++;
            if (r?.type === 'registered') yes++;
            else if (r?.type === 'declined') no++;
            else if (r?.type === 'interested') heart++;
            else pend++;
          });
          const isExp = expandedGroup === g.id;
          return (
            <div className="card stack" key={g.id} style={{ padding: 12, borderTop: `5px solid ${g.color}`, background: isExp ? '#fffef0' : '#fff' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1rem', color: g.color }}>{g.name}</div>
              <div className="muted" style={{ fontSize: '0.82rem' }}>共 {grpMembers.length} 人</div>
              <div style={{ fontSize: '0.88rem', lineHeight: '1.8', margin: '4px 0' }}>
                <div>✅ 確定：<strong style={{color:'#137333'}}>{yes}</strong></div>
                <div>❌ 婉拒：<strong style={{color:'#c5221f'}}>{no}</strong></div>
                <div>❤️ 興趣：<strong style={{color:'#b06000'}}>{heart}</strong></div>
                <div>⚠️ 未覆：<strong>{pend}</strong></div>
                <div style={{ borderTop: '1px solid #eee', paddingTop: 2 }}>💰 付款：<strong style={{color:'#1a73e8'}}>{paid}</strong></div>
              </div>
              <button className="btn" style={{ fontSize: '0.78rem', padding: '4px 6px', marginTop: 'auto' }} onClick={() => setExpandedGroup(isExp ? null : g.id)}>
                {isExp ? '🔼 收起名單' : `👁️ 查看名單 (${grpMembers.length})`}
              </button>
            </div>
          );
        })}
      </div>

      {expandedGroup && (
        <div className="card stack" style={{ background: '#fffef0', border: '2px solid #f9ab00', marginTop: 8 }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '1.05rem' }}>📋 {GROUP_DEFS.find(g=>g.id===expandedGroup)?.full} · 出席與報名詳細名單：</strong>
            <button className="btn" onClick={() => setExpandedGroup(null)}>✕ 關閉</button>
          </div>
          <div className="row" style={{ flexWrap: 'wrap', gap: 8, maxHeight: 220, overflowY: 'auto', padding: 8, background: '#fff', borderRadius: 6 }}>
            {unifiedTargets.filter(m => m.branchId === expandedGroup).length === 0 ? <p className="muted">此群組暫無對象</p> :
              unifiedTargets.filter(m => m.branchId === expandedGroup).map(m => {
                const r = replyStatus(s, eventId, m.id);
                const st = r?.type;
                const badgeStyle = st === 'registered' ? {background:'#e6f4ea',color:'#137333',border:'1px solid #ceead6'} : st === 'declined' ? {background:'#fce8e6',color:'#c5221f',border:'1px solid #fad2cf'} : st === 'interested' ? {background:'#fef7e0',color:'#b06000',border:'1px solid #feefc3'} : {background:'#f1f3f4',color:'#5f6368',border:'1px solid #ddd'};
                return (
                  <span key={m.id} style={{ ...badgeStyle, padding: '4px 8px', borderRadius: 6, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {st === 'registered' ? '✅' : st === 'declined' ? '❌' : st === 'interested' ? '❤️' : '⚠️'} {m.name} {getIsPaid(m.id) ? '(💰已付)' : ''}
                  </span>
                );
              })
            }
          </div>
        </div>
      )}
    </section>

    {/* 3. 第二層：專屬兩大格童軍與幼童軍小隊報名統計 */}
    <section className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
      {/* 幼童軍大格 */}
      <div className="card stack" style={{ borderTop: '5px solid #fbc02d', background: '#fff' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#b06000' }}>🐺 幼童軍支部 · 各顏色小隊報名統計</h3>
          <span className="badge gold">{unifiedTargets.filter(m=>m.branchId==='b2').length} 人</span>
        </div>
        <p className="muted">按幼童軍九色小隊細分出席。點擊小隊可展開查看成員名單。</p>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: 8 }}>
          {s.patrols.filter(p=>p.branchId==='b2').map(p => {
            const pMembers = unifiedTargets.filter(m => m.patrolId === p.id);
            let yes=0, no=0, heart=0, pend=0, paid=0;
            pMembers.forEach(m => {
              const r = replyStatus(s, eventId, m.id);
              if(getIsPaid(m.id)) paid++;
              if(r?.type==='registered') yes++; else if(r?.type==='declined') no++; else if(r?.type==='interested') heart++; else pend++;
            });
            const isExp = expandedPatrol === p.id;
            return (
              <div key={p.id} className="card stack" style={{ padding: 8, background: isExp ? '#fffde7' : '#fcfcfc', border: '1px solid #e0e0e0' }}>
                <strong style={{ fontSize: '0.9rem' }}>{p.name}隊 ({p.short})</strong>
                <div style={{ fontSize: '0.8rem', lineHeight: '1.6' }}>
                  <div>✅ {yes} | ❌ {no}</div>
                  <div>❤️ {heart} | ⚠️ {pend}</div>
                </div>
                <button className="btn" style={{ fontSize: '0.72rem', padding: '2px 4px' }} onClick={() => setExpandedPatrol(isExp ? null : p.id)}>
                  {isExp ? '收起' : `名單 (${pMembers.length})`}
                </button>
              </div>
            );
          })}
        </div>
        {expandedPatrol && s.patrols.find(p=>p.id===expandedPatrol && p.branchId==='b2') && (
          <div className="card stack" style={{ background: '#fffde7', border: '1px solid #fbc02d', marginTop: 8 }}>
            <strong>📋 {s.patrols.find(p=>p.id===expandedPatrol)?.name}隊成員名單：</strong>
            <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
              {unifiedTargets.filter(m => m.patrolId === expandedPatrol).map(m => {
                const r = replyStatus(s, eventId, m.id);
                return <span key={m.id} className="badge" style={{ background: '#fff', border: '1px solid #ccc' }}>{r?.type==='registered'?'✅':r?.type==='declined'?'❌':r?.type==='interested'?'❤️':'⚠️'} {m.name}</span>;
              })}
            </div>
          </div>
        )}
      </div>

      {/* 童軍大格 */}
      <div className="card stack" style={{ borderTop: '5px solid #34a853', background: '#fff' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#137333' }}>⚜️ 童軍支部 · 各動物小隊報名統計</h3>
          <span className="badge green">{unifiedTargets.filter(m=>m.branchId==='b3').length} 人</span>
        </div>
        <p className="muted">按童軍動物名稱小隊細分出席。點擊小隊可展開查看成員名單。</p>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: 8 }}>
          {s.patrols.filter(p=>p.branchId==='b3').map(p => {
            const pMembers = unifiedTargets.filter(m => m.patrolId === p.id);
            let yes=0, no=0, heart=0, pend=0, paid=0;
            pMembers.forEach(m => {
              const r = replyStatus(s, eventId, m.id);
              if(getIsPaid(m.id)) paid++;
              if(r?.type==='registered') yes++; else if(r?.type==='declined') no++; else if(r?.type==='interested') heart++; else pend++;
            });
            const isExp = expandedPatrol === p.id;
            return (
              <div key={p.id} className="card stack" style={{ padding: 8, background: isExp ? '#e6f4ea' : '#fcfcfc', border: '1px solid #e0e0e0' }}>
                <strong style={{ fontSize: '0.9rem' }}>{p.name} ({p.short})</strong>
                <div style={{ fontSize: '0.8rem', lineHeight: '1.6' }}>
                  <div>✅ {yes} | ❌ {no}</div>
                  <div>❤️ {heart} | ⚠️ {pend}</div>
                </div>
                <button className="btn" style={{ fontSize: '0.72rem', padding: '2px 4px' }} onClick={() => setExpandedPatrol(isExp ? null : p.id)}>
                  {isExp ? '收起' : `名單 (${pMembers.length})`}
                </button>
              </div>
            );
          })}
        </div>
        {expandedPatrol && s.patrols.find(p=>p.id===expandedPatrol && p.branchId==='b3') && (
          <div className="card stack" style={{ background: '#e6f4ea', border: '1px solid #34a853', marginTop: 8 }}>
            <strong>📋 {s.patrols.find(p=>p.id===expandedPatrol)?.name}小隊成員名單：</strong>
            <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
              {unifiedTargets.filter(m => m.patrolId === expandedPatrol).map(m => {
                const r = replyStatus(s, eventId, m.id);
                return <span key={m.id} className="badge" style={{ background: '#fff', border: '1px solid #ccc' }}>{r?.type==='registered'?'✅':r?.type==='declined'?'❌':r?.type==='interested'?'❤️':'⚠️'} {m.name}</span>;
              })}
            </div>
          </div>
        )}
      </div>
    </section>

    {/* 4. 最底名單：分成各支部、領袖、家長和總合共8個分頁方便匯出 */}
    <section className="card stack">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ margin: 0 }}>📋 出席與付款核對名單表 (共 8 個分頁快速對賬與 CSV 匯出)</h3>
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

      <table className="table"><thead><tr><th>姓名</th><th>所屬單位</th><th>小隊/職務</th><th>回覆出席狀態</th><th>緊急聯絡電話</th><th>付款核對</th><th>操作</th></tr></thead>
      <tbody>{displayTargets.map(m=>{
        const r=replyStatus(s,eventId,m.id);
        const p=s.patrols.find(x=>x.id===m.patrolId);
        const isPaidCur = getIsPaid(m.id);
        const isChanged = paidOverrides[m.id] !== undefined;
        return <tr key={m.id} style={isChanged ? { background: '#fffef0' } : {}}>
          <td><strong>{m.name}</strong></td>
          <td><span className="badge blue">{GROUP_DEFS.find(g=>g.id===m.branchId)?.name || m.branchId}</span></td>
          <td>{m.isLeader ? '👔 領袖出席' : m.isParent ? '👨‍👩‍👧 家長出席' : (p?.name || '未分小隊')}</td>
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
            <button className="btn" style={{fontSize:'0.82em'}} onClick={()=>togglePaid(m.id)}>單筆即時同步</button>
          </td>
        </tr>})}</tbody></table>

      <div className="row" style={{marginTop:8, justifyContent:'space-between'}}>
        <button className="btn primary" onClick={csv}>📥 匯出當前頁簽 ({activeListTab === 'all' ? '全部總合' : GROUP_DEFS.find(g=>g.id===activeListTab)?.name}) 中文 CSV</button>
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