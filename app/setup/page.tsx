'use client';
export default function Setup(){
return <div className="stack"><section className="hero"><span className="badge gold">小白模式</span><h1>旅團接入教學</h1><p>照步驟建立 Sheet、貼上 Apps Script、執行 setup、填 Config、部署 Web App、提交 URL。</p></section>
<section className="grid-wide"><div className="card"><h3>你需要準備</h3><ul className="muted"><li>Google 帳號</li><li>空白 Google Sheet</li><li>旅團名稱及旅團號，例如 0082</li><li>第一位管理員 Email</li><li>五個支部是否啟用</li></ul></div>
<div className="card"><h3>一鍵初始化</h3><ol className="muted"><li>開 Google Sheet</li><li>Extensions → Apps Script</li><li>貼上 GS 模板（下方下載或 /downloads）</li><li>Run <code>setupScoutSystem()</code></li><li>到黃色 SystemConfig 填 TROOP_CODE、TROOP_NAME、ADMIN_EMAIL</li><li>到藍色 Members 輸入成員（含 ymNumber、name、branchId）</li><li>Deploy → Web App → Execute as Me, Anyone with Google Account</li><li>把 /exec URL 填入前端首頁旅團連接設定</li><li>用管理員 email + 密碼 changeme 登入測試</li></ol></div></section>
<section className="card"><h3>登入方式</h3><div className="grid-wide"><div><strong>領袖 / 家長 / 管理員</strong><p className="muted">用 Email + 密碼登入。密碼在 Users 表的 password 欄。初始管理員預設密碼 changeme。</p></div><div><strong>成員</strong><p className="muted">用 YMIS 編號登入（Members 表的 ymNumber）。成員不需要密碼。</p></div><div><strong>技術測試</strong><p className="muted">sheep / 0728 是技術測試帳號，權限等同最高，任何旅團都能用。</p></div></div></section>
<section className="card"><h3>核心工作表</h3><pre className="code">{`README_新手必看    SystemConfig      Branches        Patrols
Members           Users             Applications    Events
EventReplies      LibraryBookmarks  Announcements   RegularMeetings
CancelledMeetings Notices           Plugins         AuditLogs`}</pre><p className="muted">setup 後只顯示 README、SystemConfig、Branches、Patrols、Members；其餘已隱藏。需要時用 ScoutSystem 2.0 選單顯示。</p></section>
</div>}
