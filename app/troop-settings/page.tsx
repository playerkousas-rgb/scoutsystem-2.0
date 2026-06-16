'use client';
import { useEffect, useState } from 'react';
import { AppState, loadState, mutate, addAudit } from '@/lib/store';
import { branches } from '@/lib/model';
import { getSession } from '@/lib/session';
export default function TroopSettings(){
  const [s,setS]=useState<AppState|null>(null);
  useEffect(()=>setS(loadState()),[]);
  function saveConfig(k:string,v:string){ const user=getSession(); const next=mutate(st=>{st.config[k]=v; addAudit(st,user?.userId||'demo','updateConfig','SystemConfig',k,v)}); setS(next); }
  function toggleMeeting(id:string){ const user=getSession(); const next=mutate(st=>{const r=st.regularMeetings.find(x=>x.id===id); if(r){r.enabled=!r.enabled; addAudit(st,user?.userId||'demo','toggleRegularMeeting','RegularMeetings',id,String(r.enabled));}}); setS(next); }
  if(!s)return <div className="card">載入中...</div>;
  return <div className="stack"><section className="hero"><span className="badge gold">旅團設定</span><h1>小白旅團設定</h1><p>這頁已接同一份 SystemConfig / RegularMeetings 沙盤資料，不再只是展示。旅團不用在太多頁之間找設定。</p></section>
    <section className="grid-wide"><div className="card stack"><h3>基本資料</h3><label>旅團名稱<input defaultValue={s.config.TROOP_NAME} onBlur={e=>saveConfig('TROOP_NAME',e.target.value)}/></label><label>旅團號<input defaultValue={s.config.TROOP_CODE} onBlur={e=>saveConfig('TROOP_CODE',e.target.value)}/></label><label>管理員 Email<input defaultValue={s.config.ADMIN_EMAIL||''} onBlur={e=>saveConfig('ADMIN_EMAIL',e.target.value)}/></label></div><div className="card stack"><h3>後台與公告資料夾</h3><label>Apps Script URL<input defaultValue={s.config.WEB_APP_URL||''} onBlur={e=>saveConfig('WEB_APP_URL',e.target.value)} placeholder="https://script.google.com/macros/s/.../exec"/></label><label>公告 PDF 資料夾 URL<input defaultValue={s.config.ANNOUNCEMENT_FOLDER_URL||''} onBlur={e=>saveConfig('ANNOUNCEMENT_FOLDER_URL',e.target.value)} placeholder="https://drive.google.com/drive/folders/..."/></label><label>公告 PDF 資料夾 ID<input defaultValue={s.config.ANNOUNCEMENT_FOLDER_ID||''} onBlur={e=>saveConfig('ANNOUNCEMENT_FOLDER_ID',e.target.value)}/></label><label>Registry URL<input defaultValue={s.config.REGISTRY_URL} onBlur={e=>saveConfig('REGISTRY_URL',e.target.value)}/></label></div></section>
    <section className="card stack"><h2>日常集會規則</h2><p className="muted">團長或以上可在這裡集中設定；領袖在行事曆可標記某日不用集會。</p><table className="table"><thead><tr><th>支部</th><th>標題</th><th>星期</th><th>時間</th><th>地點</th><th>狀態</th><th>操作</th></tr></thead><tbody>{s.regularMeetings.map(r=><tr key={r.id}><td>{branches.find(b=>b.id===r.branchId)?.name||r.branchId}</td><td>{r.title}</td><td>{r.weekday}</td><td>{r.startTime}-{r.endTime}</td><td>{r.location}</td><td>{r.enabled?'啟用':'停用'}</td><td><button className="btn" onClick={()=>toggleMeeting(r.id)}>{r.enabled?'停用':'啟用'}</button></td></tr>)}</tbody></table></section>
    <section className="card"><h3>技術測試帳號說明</h3><p className="muted">Sheep 及 0728 是技術管理人員測試帳號，權限等同最高權限，但身份上不是「超管」或旅團管理層帳號。</p></section>
  </div>
}
