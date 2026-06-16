'use client';
import { useEffect, useState } from 'react';
import { AppState, loadState } from '@/lib/store';

export default function Notices(){
  const [s,setS]=useState<AppState|null>(null);
  useEffect(()=>setS(loadState()),[]);
  if(!s)return <div className="card">載入中...</div>;
  return <div className="stack">
    <section className="hero"><span className="badge gold">公告資料夾</span><h1>日常公告 PDF</h1><p>日常集會安排不當通告、不建立活動、不需要家長回覆。旅團只需把 PDF 放入指定 Google Drive 資料夾，前端公告卡片會列出資料夾內 PDF，一點即可看整張。</p></section>
    <section className="card stack"><h2>Google Drive 資料夾設定</h2><p className="muted">正式接 GS 後，由同一 Google Account 的 Apps Script 以 DriveApp 讀取資料夾內 PDF。前端不直接掃 Google Drive。</p><label>資料夾 URL<input defaultValue={s.config.ANNOUNCEMENT_FOLDER_URL||''} placeholder="https://drive.google.com/drive/folders/..."/></label><div className="row"><button className="btn primary">儲存資料夾（UI）</button><button className="btn">重新讀取 PDF（UI）</button></div></section>
    <section className="grid-wide">{s.announcementPdfs.map(pdf=><a key={pdf.id} className="card feature-card" href={pdf.url} target="_blank"><span className="badge blue">PDF</span><h3>📄 {pdf.name}</h3><p className="muted">更新：{pdf.updatedAt||'—'} · {pdf.size||''}</p><span className="btn block">查看整張</span></a>)}</section>
  </div>
}
