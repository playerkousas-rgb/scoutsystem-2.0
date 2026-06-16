import Link from 'next/link';
import { FeatureCard } from '@/components/Cards';
export default function Home(){return <div className="stack">
<section className="hero"><span className="badge gold">ScoutSystem 2.0 · 旅團管理系統</span><h1>一個給旅團使用的活動、通告、成員與轉駁器平台</h1><p>先以完整 UI 與小白設定流程為核心，後端 Google Sheet / Apps Script 之後按旅團需要接入。未登入亦可查看接入教學、下載、更新及使用旅團，方便推廣。</p><div className="row"><Link className="btn primary" href="/login">登入旅團</Link><Link className="btn gold" href="/setup">🧩 旅團接入教學</Link><Link className="btn" href="/onboard">提交接入申請</Link></div></section>
<section className="grid"><FeatureCard title="旅團接入教學" icon="🧩" text="小白模式：由建立 Sheet、貼 GS、執行 setup，到提交 URL。" href="/setup"/><FeatureCard title="模板下載" icon="⬇️" text="下載 Google Apps Script 模板、小白設定表、插件接入規格。" href="/downloads"/><FeatureCard title="更新公告" icon="📢" text="查看平台及元件市場的必須、建議及可選更新。" href="/updates"/><FeatureCard title="使用旅團" icon="🌏" text="展示已接入、測試中或準備接入的旅團。" href="/troops"/></section>
<section className="grid-wide"><div className="card"><h3>活動 vs 通告</h3><p className="muted">活動 = 旅團 / 支部統一參與，需要家長 ✅ / ❌，會進入行事曆。通告 = 領袖標記適合個人參與的資訊，通常不進行事曆。</p></div><div className="card"><h3>轉駁器</h3><p className="muted">第 2 級是無後台即插即用工具；第 3 級是各旅團自部署後台的系統，例如 DBS 或財務管家。</p></div></section>
</div>}
