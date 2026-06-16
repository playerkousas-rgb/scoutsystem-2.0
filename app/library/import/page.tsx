'use client';
import { useEffect, useState } from 'react';
import { AppState, loadState } from '@/lib/store';
import { apiImportBookmark } from '@/lib/api';
import { getSession } from '@/lib/session';
export default function Import(){
  const [s,setS]=useState<AppState|null>(null);const [err,setErr]=useState('');
  const [mode,setMode]=useState<'informational'|'troop_participation'>('informational');
  const [title,setTitle]=useState('地域領袖訓練班');const [internalDeadline,setInternalDeadline]=useState('');const [officialDeadline,setOfficialDeadline]=useState('');const [fee,setFee]=useState('');const [msg,setMsg]=useState('');
  useEffect(()=>{loadState().then(setS).catch(e=>setErr(e.message))},[]);
  async function save(){
    setErr('');setMsg('');
    try{const f=await apiImportBookmark({title,mode,officialDeadline,internalDeadline,fee,date:internalDeadline});setS(f);setMsg(mode==='troop_participation'?'✅ 已轉成活動並加入行事曆':'✅ 已加入資訊性通告')}
    catch(e:any){setErr(e.message)}
  }
  return <div className="stack"><section className="hero"><span className="badge gold">加入 ScoutSystem</span><h1>圖書館通告接入</h1><p>儲存 Bookmark 到後台 LibraryBookmarks；旅團參與模式會即時建立 Event。</p></section>
    {err&&<p className="badge red">{err}</p>}{msg&&<p className="badge green">{msg}</p>}
    <section className="grid-wide"><button className={`card notice-mode ${mode==='informational'?'active':''}`} onClick={()=>setMode('informational')}><span className="badge gold">📢 資訊性</span><h3>只作通告提醒</h3><p className="muted">不加入行事曆，不需要家長回覆。</p></button><button className={`card notice-mode ${mode==='troop_participation'?'active':''}`} onClick={()=>setMode('troop_participation')}><span className="badge purple">🏕️ 旅團參與</span><h3>轉成旅團活動</h3><p className="muted">加入行事曆，家長需要回覆。</p></button></section>
    <section className="card stack">
      <label>通告標題<input value={title} onChange={e=>setTitle(e.target.value)}/></label>
      <label>原通告截止日期<input type="date" value={officialDeadline} onChange={e=>setOfficialDeadline(e.target.value)}/></label>
      <label>本旅截止日期<input type="date" value={internalDeadline} onChange={e=>setInternalDeadline(e.target.value)}/></label>
      <label>費用<input value={fee} onChange={e=>setFee(e.target.value)} placeholder="$150"/></label>
      <button className="btn primary" onClick={save}>儲存接入設定</button>
    </section>
    {s&&s.bookmarks.length>0&&<section className="card"><h3>已引入通告</h3><table className="table"><thead><tr><th>標題</th><th>模式</th><th>本旅截止</th><th>狀態</th></tr></thead><tbody>{s.bookmarks.map(b=><tr key={b.id}><td>{b.title}</td><td>{b.mode==='troop_participation'?'旅團參與':'資訊性'}</td><td>{b.internalDeadline||'—'}</td><td><span className={`badge ${b.status==='converted'?'green':'gold'}`}>{b.status}</span></td></tr>)}</tbody></table></section>}
  </div>;
}
