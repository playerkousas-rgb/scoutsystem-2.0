'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppState, loadState } from '@/lib/store';
import { apiSaveConfig } from '@/lib/api';
export default function Notices(){
  const [s,setS]=useState<AppState|null>(null);const [err,setErr]=useState('');const [ok,setOk]=useState('');
  const [folderUrl,setFolderUrl]=useState('');
  useEffect(()=>{loadState().then(st=>{setS(st);setFolderUrl(st.config.ANNOUNCEMENT_FOLDER_URL||'')}).catch(e=>setErr(e.message))},[]);
  async function saveFolder(){setErr('');setOk('');try{const f=await apiSaveConfig('ANNOUNCEMENT_FOLDER_URL',folderUrl);setS(f);setOk('✅ 已儲存資料夾 URL')}catch(e:any){setErr(e.message)}}
  async function reload(){setErr('');setOk('');try{const {loadState}=await import('@/lib/store');const f=await loadState();setS(f);setOk('✅ 已重新讀取 PDF 列表')}catch(e:any){setErr(e.message)}}
  if(err)return <div className="card"><p className="badge red">{err}</p></div>;
  if(!s)return <div className="card">載入中...</div>;
  return (
    <div className="stack">
      <section className="hero">
        <span className="badge gold">公告 / 通告</span>
        <h1>通告管理</h1>
        <p>日常集會公告 PDF 放 Google Drive 資料夾即可；活動通告可用 Word 上傳，系統自動抽取重點並加入行事曆。</p>
        <div className="row">
          <Link className="btn primary" href="/notices/upload">📄 上傳 Word 通告</Link>
        </div>
      </section>
      {ok&&<p className="badge green">{ok}</p>}

      <section className="card stack">
        <h2>已引入通告</h2>
        {s.bookmarks.length===0?<p className="muted">暫無已引入通告。可到上方上傳 Word 通告，或到圖書館標記引入。</p>:
        <table className="table"><thead><tr><th>標題</th><th>模式</th><th>來源</th><th>本旅截止</th><th>收費</th><th>狀態</th></tr></thead>
        <tbody>{s.bookmarks.map(b=><tr key={b.id}><td>{b.title}</td><td><span className={`badge ${b.mode==='troop_participation'?'purple':'gold'}`}>{b.mode==='troop_participation'?'旅團參與':'資訊性'}</span></td><td>{b.source||'—'}</td><td>{b.internalDeadline||'—'}</td><td>{b.fee||'—'}</td><td>{b.status}</td></tr>)}</tbody></table>}
      </section>

      <section className="card stack">
        <h2>日常公告 PDF（Google Drive）</h2>
        <p className="muted">旅團只需把集會安排 PDF 放入指定資料夾，前端自動列出。不需要家長回覆。</p>
        <label>資料夾 URL<input value={folderUrl} onChange={e=>setFolderUrl(e.target.value)} placeholder="https://drive.google.com/drive/folders/..."/></label>
        <div className="row"><button className="btn primary" onClick={saveFolder}>儲存資料夾</button><button className="btn" onClick={reload}>重新讀取 PDF</button></div>
      </section>

      <section className="grid-wide">{s.announcementPdfs.length===0?<div className="card"><p className="muted">暫無公告 PDF。請確認已設定 ANNOUNCEMENT_FOLDER_ID 及資料夾內有 PDF。</p></div>:s.announcementPdfs.map(pdf=><a key={pdf.id} className="card feature-card" href={pdf.url} target="_blank"><span className="badge blue">PDF</span><h3>📄 {pdf.name}</h3><p className="muted">更新：{pdf.updatedAt||'—'} · {pdf.size||''}</p><span className="btn block">查看整張</span></a>)}</section>
    </div>
  );
}
