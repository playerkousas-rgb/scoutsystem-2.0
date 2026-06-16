'use client';
import Link from 'next/link';
import { FeatureCard } from '@/components/Cards';
import { activeTroops } from '@/lib/troops';
import { useEffect, useState } from 'react';

export default function Home(){
  const [selectedTroopId,setSelectedTroopId]=useState('');
  const [msg,setMsg]=useState('');
  const [showManual,setShowManual]=useState(false);
  const [manualUrl,setManualUrl]=useState('');
  const [manualName,setManualName]=useState('');
  const troops=activeTroops();

  useEffect(()=>{
    try{
      const t=JSON.parse(localStorage.getItem('scoutsystem2_selected_troop')||'null');
      if(t){setSelectedTroopId(t.id||'')}
    }catch{}
  },[]);

  function selectTroop(){
    setMsg('');
    const troop=troops.find(t=>t.id===selectedTroopId||t.name===selectedTroopId);
    if(!troop){setMsg('請選擇旅團');return;}
    localStorage.setItem('scoutsystem2_selected_troop',JSON.stringify({
      id:troop.id,name:troop.name,webAppUrl:troop.webAppUrl
    }));
    setMsg('✅ 已選擇 '+troop.name+'，請登入。');
  }

  function connectManual(){
    setMsg('');
    if(!manualUrl.includes('/exec')){setMsg('請填正確的 Apps Script /exec URL');return;}
    localStorage.setItem('scoutsystem2_selected_troop',JSON.stringify({
      id:manualName||'custom',name:manualName||'自訂旅團',webAppUrl:manualUrl
    }));
    setMsg('✅ 已連接，請登入。');
  }

  const selected=troops.find(t=>t.id===selectedTroopId);

  return <div className="stack">
    <section className="hero">
      <span className="badge gold">ScoutSystem 2.0</span>
      <h1>{selected?selected.name:'旅團管理系統'}</h1>
      <p>選擇你的旅團後登入。如果你的旅團尚未接入，請申請接入。</p>
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
        <select value={selectedTroopId} onChange={e=>setSelectedTroopId(e.target.value)}>
          <option value="">— 請選擇旅團 —</option>
          {troops.map((t,i)=><option key={i} value={t.id}>{t.name}（{t.id}）{t.status==='testing'?' [測試中]':''}</option>)}
        </select>
      }
      {selected&&<button className="btn primary" onClick={selectTroop}>使用此旅團</button>}
      {msg&&<p className="badge green">{msg}</p>}
      <p className="muted">💡 旅團後台網址不會公開顯示，保障資料安全。</p>
    </section>

    <details style={{maxWidth:600}}>
      <summary className="muted" style={{cursor:'pointer',fontSize:'0.85em'}}>管理員 / 測試用：手動連接 URL</summary>
      <section className="card stack" style={{marginTop:8}}>
        <label>旅團名稱<input value={manualName} onChange={e=>setManualName(e.target.value)} placeholder="第82旅"/></label>
        <label>Apps Script URL<input value={manualUrl} onChange={e=>setManualUrl(e.target.value)} placeholder="https://script.google.com/macros/s/.../exec"/></label>
        <button className="btn" onClick={connectManual}>連接</button>
      </section>
    </details>

    <section className="grid">
      <FeatureCard title="接入教學" icon="🧩" text="由建立 Sheet、貼 GS、執行 setup，到提交申請。" href="/setup"/>
      <FeatureCard title="模板下載" icon="⬇️" text="下載 Google Apps Script 模板。" href="/downloads"/>
      <FeatureCard title="更新公告" icon="📢" text="查看平台及元件市場更新。" href="/updates"/>
      <FeatureCard title="已接入旅團" icon="🌏" text="查看已接入的旅團。" href="/troops"/>
    </section>
  </div>
}
