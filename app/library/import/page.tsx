'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppState, loadState } from '@/lib/store';
import { apiImportBookmark } from '@/lib/api';
import { getSession } from '@/lib/session';

export default function Import(){
  const [s,setS]=useState<AppState|null>(null);const [err,setErr]=useState('');
  const [mode,setMode]=useState<'informational'|'troop_participation'>('informational');
  const [title,setTitle]=useState('');const [internalDeadline,setInternalDeadline]=useState('');
  const [officialDeadline,setOfficialDeadline]=useState('');const [fee,setFee]=useState('');
  const [source,setSource]=useState('');const [msg,setMsg]=useState('');

  useEffect(()=>{loadState().then(setS).catch(e=>setErr(e.message))},[]);

  async function save(){
    setErr('');setMsg('');
    if(!title.trim()){setErr('請填通告標題');return;}
    try{
      const f=await apiImportBookmark({title,mode,source,officialDeadline,internalDeadline,fee});
      // reload
      const {loadState}=await import('@/lib/store');
      setS(await loadState());
      setMsg(mode==='troop_participation'?'✅ 已轉成活動並加入行事曆':'✅ 已加入資訊性通告');
      setTitle('');setInternalDeadline('');setOfficialDeadline('');setFee('');setSource('');
    }catch(e:any){setErr(e.message)}
  }

  return <div className="stack">
    <section className="hero">
      <span className="badge gold">圖書館引入</span>
      <h1>由童軍通告圖書館引入</h1>
      <p>童軍通告圖書館（scout-circulars.vercel.app）每天自動搜集全港通告。在圖書館看到適合的通告，按「加入 ScoutSystem」即可引入這裡。</p>
      <a className="btn primary" href="https://scout-circulars.vercel.app/" target="_blank">📚 打開童軍通告圖書館</a>
    </section>

    {err&&<p className="badge red">{err}</p>}
    {msg&&<p className="badge green">{msg}</p>}

    <section className="card">
      <h3>如何從圖書館引入？</h3>
      <ol className="muted">
        <li>到 <Link href="https://scout-circulars.vercel.app/" target="_blank">童軍通告圖書館</Link></li>
        <li>在圖書館頁面設定你的 ScoutSystem 網址（只需設定一次）</li>
        <li>瀏覽通告，找到適合的，按「加入 ScoutSystem」</li>
        <li>通告會自動引入到下方列表</li>
      </ol>
      <p className="muted">也可以在下方手動引入一張通告（如果圖書館尚未收錄）。</p>
    </section>

    <section className="grid-wide">
      <button className={`card notice-mode ${mode==='informational'?'active':''}`} onClick={()=>setMode('informational')}>
        <span className="badge gold">📢 資訊性</span>
        <h3>只作通告提醒</h3>
        <p className="muted">不加入行事曆，不需要家長回覆。</p>
      </button>
      <button className={`card notice-mode ${mode==='troop_participation'?'active':''}`} onClick={()=>setMode('troop_participation')}>
        <span className="badge purple">🏕️ 旅團參與</span>
        <h3>轉成旅團活動</h3>
        <p className="muted">加入行事曆，家長需要回覆。</p>
      </button>
    </section>

    <section className="card stack">
      <h3>手動引入通告</h3>
      <label>通告標題<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="例如：皮藝坊"/></label>
      <label>來源<input value={source} onChange={e=>setSource(e.target.value)} placeholder="總會 / 地域 / 區會"/></label>
      <div className="grid">
        <label>原通告截止日期<input type="date" value={officialDeadline} onChange={e=>setOfficialDeadline(e.target.value)}/></label>
        <label>本旅截止日期<input type="date" value={internalDeadline} onChange={e=>setInternalDeadline(e.target.value)}/></label>
        <label>費用<input value={fee} onChange={e=>setFee(e.target.value)} placeholder="$150"/></label>
      </div>
      <button className="btn primary" onClick={save}>引入此通告</button>
    </section>

    {s&&s.bookmarks.length>0&&<section className="card">
      <h3>已引入通告</h3>
      <table className="table"><thead><tr><th>標題</th><th>模式</th><th>來源</th><th>本旅截止</th><th>收費</th><th>狀態</th></tr></thead>
      <tbody>{s.bookmarks.map(b=><tr key={b.id}><td>{b.title}</td><td>{b.mode==='troop_participation'?'旅團參與':'資訊性'}</td><td>{b.source||'—'}</td><td>{b.internalDeadline||'—'}</td><td>{b.fee||'—'}</td><td><span className={`badge ${b.status==='converted'?'green':'gold'}`}>{b.status}</span></td></tr>)}</tbody></table>
    </section>}
  </div>;
}
