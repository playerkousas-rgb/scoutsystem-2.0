'use client';
import Link from 'next/link';
import { FeatureCard } from '@/components/Cards';
import { fallbackRegistry } from '@/lib/registry';
import { mutate } from '@/lib/store';
import { useEffect, useState } from 'react';

export default function Home(){
  const [selected,setSelected]=useState<any>(null);
  useEffect(()=>{try{setSelected(JSON.parse(localStorage.getItem('scoutsystem2_selected_troop')||'null'))}catch{}},[]);
  function pick(unit:any){
    const troop={id:unit.id.padStart(4,'0'), rawId:unit.id, name:unit.name};
    localStorage.setItem('scoutsystem2_selected_troop',JSON.stringify(troop));
    mutate(s=>{s.config.TROOP_CODE=troop.id;s.config.TROOP_NAME=troop.name});
    setSelected(troop);
  }
  return <div className="stack">
    <section className="hero"><span className="badge gold">ScoutSystem 2.0 · 旅團管理系統</span><h1>{selected?`${selected.name} ScoutSystem`:'請先選擇旅團'}</h1><p>未登入前只顯示接入、下載、更新及使用旅團等公開資訊。選擇旅團後再登入，才會看到行事曆、活動、圖書館及控制台。</p><div className="row"><Link className="btn primary" href="/login">登入旅團</Link><Link className="btn gold" href="/setup">🧩 旅團接入教學</Link><Link className="btn" href="/onboard">提交接入申請</Link></div></section>
    <section className="card stack"><h2>選擇旅團</h2><p className="muted">這裡先讀取轉駁器登記的旅團。正式後可改成你的旅團清單 / 多組織 mapping。</p><div className="grid">{fallbackRegistry.units.map(u=><button key={u.id} className={`card ${selected?.rawId===u.id?'notice-mode active':''}`} style={{textAlign:'left',cursor:'pointer'}} onClick={()=>pick(u)}><span className="badge blue">{u.id.padStart(4,'0')}</span><h3>{u.name}</h3><p className="muted">已接入元件：{u.installs.join('、')||'—'}</p><span className="btn block">選擇此旅團</span></button>)}</div></section>
    <section className="grid"><FeatureCard title="旅團接入教學" icon="🧩" text="小白模式：由建立 Sheet、貼 GS、執行 setup，到提交 URL。" href="/setup"/><FeatureCard title="模板下載" icon="⬇️" text="下載 Google Apps Script 模板、小白設定表、插件接入規格。" href="/downloads"/><FeatureCard title="更新公告" icon="📢" text="查看平台及元件市場的必須、建議及可選更新。" href="/updates"/><FeatureCard title="使用旅團" icon="🌏" text="展示已接入、測試中或準備接入的旅團。" href="/troops"/></section>
  </div>
}
