'use client';
import { useEffect, useState } from 'react';
import Auth from '@/components/Auth';
import { FeatureCard, SummaryCard } from '@/components/Cards';
import { AppState, loadState, computeStats } from '@/lib/store';

export default function Admin(){
  const [s,setS]=useState<AppState|null>(null);
  const [err,setErr]=useState('');
  useEffect(()=>{loadState().then(setS).catch(e=>setErr(e.message))},[]);
  const stats=s?computeStats(s):{users:0,pending:0,activities:0,notices:0};
  return <Auth roles={['super_admin','admin']}><div className="stack">
    <section className="hero"><span className="badge gold">最高權限控制台</span><h1>全功能控制台</h1><p>摘要卡片顯示來自後台的即時數量；所有管理動作由下方功能卡片進入。</p></section>
    {err&&<p className="badge red">讀取失敗：{err}</p>}
    <section className="grid">
      <SummaryCard label="用戶" value={stats.users} desc="整個旅團系統總登記人數"/>
      <SummaryCard label="待審批" value={stats.pending} desc="等待審批的申請數" tone="red"/>
      <SummaryCard label="活動" value={stats.activities} desc="已發布活動" tone="green"/>
      <SummaryCard label="通告" value={stats.notices} desc="圖書館引入通告" tone="gold"/>
    </section>
    <section className="grid">
      <FeatureCard title="支部管理" icon="🏢" text="管理五個支部、支部活動及支部成員概覽。" href="/admin/branches"/>
      <FeatureCard title="成員資料庫" icon="👥" text="查看及管理所有支部成員資料。" href="/admin/members"/>
      <FeatureCard title="家長審核 / 申請管理" icon="✅" text="審核家長、領袖、成員註冊申請。" href="/admin/applications"/>
      <FeatureCard title="活動管理" icon="🗓️" text="新增、發布及管理全旅 / 支部活動。" href="/admin/events"/>
      <FeatureCard title="報名管理" icon="📋" text="查看報名狀態、匯出名單及緊急聯絡資料。" href="/admin/registrations"/>
      <FeatureCard title="圖書館標記" icon="📚" text="由 Scout Circulars 引入資訊性或旅團參與通告。" href="/library/import"/>
      <FeatureCard title="通告管理" icon="📄" text="管理內部通告及已引入外部通告。" href="/notices"/>
      <FeatureCard title="使用者管理" icon="👤" text="管理帳號、角色、啟用及停用。" href="/admin/users"/>
      <FeatureCard title="系統設定" icon="⚙️" text="管理 SystemConfig。" href="/admin/settings"/>
      <FeatureCard title="審核紀錄" icon="📜" text="查看所有申請與操作紀錄。" href="/admin/audit"/>
      <FeatureCard title="元件市場 / 轉駁中心" icon="🧩" text="加入元件、設定誰可看到。" href="/marketplace"/>
      <FeatureCard title="旅團設定" icon="🏕️" text="小白設定：旅團資料、支部、聯絡及後台連接。" href="/troop-settings"/>
      <FeatureCard title="行事曆管理" icon="📅" text="管理公開行事曆、活動分類及顯示規則。" href="/admin/calendar"/>
    </section>
  </div></Auth>;
}
