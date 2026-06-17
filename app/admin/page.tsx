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
    <section className="hero"><span className="badge gold">最高權限控制台</span><h1>全功能控制台</h1><p>摘要卡片顯示即時數量，點擊可跳轉到對應管理頁。</p></section>
    {err&&<p className="badge red">{err}</p>}
    <section className="grid">
      <a href="/admin/users"><SummaryCard label="用戶" value={stats.users} desc="總登記人數"/></a>
      <a href="/admin/applications"><SummaryCard label="待審批" value={stats.pending} desc="等待審批的申請" tone="red"/></a>
      <a href="/admin/events"><SummaryCard label="活動" value={stats.activities} desc="已發布活動" tone="green"/></a>
      <a href="/notices"><SummaryCard label="通告" value={stats.notices} desc="圖書館引入通告" tone="gold"/></a>
    </section>
    <section className="grid">
      <FeatureCard title="支部管理" icon="🏢" text="管理支部及小隊。" href="/admin/branches"/>
      <FeatureCard title="成員資料庫" icon="👥" text="新增、編輯、連結家長。" href="/admin/members"/>
      <FeatureCard title="審核 / 申請管理" icon="✅" text="審核申請，批核後自動建帳號。" href="/admin/applications"/>
      <FeatureCard title="活動管理" icon="🗓️" text="新增、編輯、發布活動。" href="/admin/events"/>
      <FeatureCard title="報名管理" icon="📋" text="報名狀態、付款、匯出。" href="/admin/registrations"/>
      <FeatureCard title="圖書館引入" icon="📚" text="由童軍通告圖書館引入。" href="/library/import"/>
      <FeatureCard title="通告管理" icon="📄" text="上傳 Word 通告、Drive PDF。" href="/notices"/>
      <FeatureCard title="使用者管理" icon="👤" text="帳號、角色、啟用停用。" href="/admin/users"/>
      <FeatureCard title="系統設定" icon="⚙️" text="SystemConfig。" href="/admin/settings"/>
      <FeatureCard title="審核紀錄" icon="📜" text="所有操作紀錄。" href="/admin/audit"/>
      <FeatureCard title="元件市場 / 轉駁中心" icon="🧩" text="加入元件。" href="/marketplace"/>
      <FeatureCard title="旅團設定" icon="🏕️" text="旅團基本設定。" href="/troop-settings"/>
      <FeatureCard title="行事曆管理" icon="📅" text="日常集會規則。" href="/admin/calendar"/>
    </section>
  </div></Auth>;
}
