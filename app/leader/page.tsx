'use client';
import { useEffect, useState } from 'react';
import { AppState, loadState, computeStats } from '@/lib/store';
import Auth from '@/components/Auth';
import { FeatureCard, SummaryCard } from '@/components/Cards';
export default function Leader(){
  const [s,setS]=useState<AppState|null>(null);const [err,setErr]=useState('');
  useEffect(()=>{loadState().then(setS).catch(e=>setErr(e.message))},[]);
  const stats=s?computeStats(s):{users:0,pending:0,activities:0,notices:0};
  return <Auth roles={['super_admin','admin','group_leader','branch_leader','coach']}><div className="stack">
    <section className="hero"><span className="badge gold">領袖控制台</span><h1>領袖控制台</h1><p>管理所屬支部的活動、成員及通告。</p></section>
    {err&&<p className="badge red">{err}</p>}
    <section className="grid">
      <SummaryCard label="活動" value={stats.activities} desc="已發布活動" tone="green"/>
      <SummaryCard label="待審批" value={stats.pending} desc="等待審批申請" tone="red"/>
      <SummaryCard label="通告" value={stats.notices} desc="圖書館引入通告" tone="gold"/>
    </section>
    <section className="grid">
      <FeatureCard title="成員資料庫" icon="👥" text="查看及管理所屬支部成員。" href="/admin/members"/>
      <FeatureCard title="活動管理" icon="🗓️" text="新增、發布及管理活動。" href="/admin/events"/>
      <FeatureCard title="報名管理" icon="📋" text="查看報名狀態及匯出。" href="/admin/registrations"/>
      <FeatureCard title="圖書館標記" icon="📚" text="引入通告。" href="/library/import"/>
      <FeatureCard title="行事曆" icon="📅" text="查看及管理行事曆。" href="/calendar"/>
      <FeatureCard title="審核" icon="✅" text="審核家長申請。" href="/admin/applications"/>
    </section>
  </div></Auth>;
}
