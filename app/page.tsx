'use client';
import Link from 'next/link';
import { FeatureCard } from '@/components/Cards';
import { activeTroops } from '@/lib/troops';
import { useEffect, useState } from 'react';
import { AppState, loadState } from '@/lib/store';

export default function Home(){
  const [selectedKey,setSelectedKey]=useState('');
  const [msg,setMsg]=useState('');
  const troops=activeTroops();

  useEffect(()=>{
    try{
      const t=JSON.parse(localStorage.getItem('scoutsystem2_selected_troop')||'null');
      if(t){setSelectedKey(t.key||'')}
    }catch{}
  },[]);

  function selectTroop(){
    setMsg('');
    const troop=troops.find(t=>t.key===selectedKey);
    if(!troop){setMsg('請選擇旅團');return;}
    localStorage.setItem('scoutsystem2_selected_troop',JSON.stringify({
      key:troop.key,id:troop.id,name:troop.name,webAppUrl:troop.webAppUrl
    }));
    setMsg('✅ 已選擇 '+troop.name+'。');
  }

  const selected=troops.find(t=>t.key===selectedKey);
  const [s, setS] = useState<AppState | null>(null);
  useEffect(() => { if (selectedKey) loadState().then(setS).catch(() => {}) }, [selectedKey]);

  const reminders = s?.meetings?.filter(m => {
    const today = new Date().toISOString().slice(0, 10);
    return m.status === 'published' && m.date >= today;
  }).sort((a,b) => a.date.localeCompare(b.date)).slice(0, 2) || [];

  return <div className="stack">
    {reminders.length > 0 && (
      <div className="card reminder-bar" style={{ background: '#fff3cd', color: '#856404', padding: '12px 15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #ffeeba' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '1.1rem' }}>🔔 重要通知：</div>
        <div className="stack" style={{ gap: '10px' }}>
          {reminders.map(r => (
            <div key={r.id} className="row reminder-item" style={{ justifyContent: 'space-between', background: 'rgba(255,255,255,0.6)', padding: '10px', borderRadius: '6px', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ fontSize: '1rem', fontWeight: 500 }}>{r.date} {r.title} ({r.type==='agenda'?'議程':'紀錄'})</span>
              {r.url && <a href={r.url} target="_blank" className="btn primary" style={{ padding: '6px 15px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>查看文件</a>}
            </div>
          ))}
        </div>
      </div>
    )}
    <section className="hero">
      <span className="badge gold">2026 Scout System</span>
      <h1>{selected?selected.name:'旅團管理系統'}</h1>
      <p>選擇你的旅團後登入。如果你的旅團尚未接入，請先申請。</p>
      <div className="row">
        {selected&&<Link className="btn primary" href="/login">登入旅團</Link>}
        <Link className="btn gold" href="/onboard">申請接入</Link>
        <Link className="btn" href="/setup">接入教學</Link>
      </div>
    </section>

    <section className="card stack">
      <h2>選擇旅團</h2>
      {troops.length===0?
        <p className="muted">尚未有旅團接入。如要接入請<a href="/onboard">申請</a>。</p>
      :
        <select value={selectedKey} onChange={e=>setSelectedKey(e.target.value)}>
          <option value="">— 請選擇旅團 —</option>
          {troops.map(t=><option key={t.key} value={t.key}>{t.name}（{t.id}）</option>)}
        </select>
      }
      {selected&&<button className="btn primary" onClick={selectTroop}>使用此旅團</button>}
      {msg&&<p className="badge green">{msg}</p>}
      <p className="muted">💡 看不到你的旅團？代表尚未開通，請先<a href="/onboard">申請接入</a>。</p>
    </section>

    <section className="grid">
      <FeatureCard title="接入教學" icon="🧩" text="由建立 Sheet、貼 GS、執行 setup，到提交申請。" href="/setup"/>
      <FeatureCard title="模板下載" icon="⬇️" text="下載 Google Apps Script 模板。" href="/downloads"/>
      <FeatureCard title="更新公告" icon="📢" text="查看平台及元件市場更新。" href="/updates"/>
      <FeatureCard title="已接入旅團" icon="🌏" text="查看已接入的旅團。" href="/troops"/>
    </section>
  </div>
}
