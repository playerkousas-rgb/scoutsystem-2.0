'use client';
import { useEffect, useState } from 'react';
import { AppState, loadState } from '@/lib/store';
import { apiToggleRegularMeeting, apiCreateRegularMeeting } from '@/lib/api';
import { branches } from '@/lib/model';
const weekdays=['日','一','二','三','四','五','六'];
export default function Page(){
  const [s,setS]=useState<AppState|null>(null);const [err,setErr]=useState('');
  const [branchId,setBranchId]=useState('b3');const [title,setTitle]=useState('');const [weekday,setWeekday]=useState('6');
  const [startTime,setStartTime]=useState('14:00');const [endTime,setEndTime]=useState('16:00');const [location,setLocation]=useState('本中心');
  useEffect(()=>{loadState().then(setS).catch(e=>setErr(e.message))},[]);
  async function toggle(id:string){setErr('');try{const f=await apiToggleRegularMeeting(id);setS(f)}catch(e:any){setErr(e.message)}}
  async function add(){if(!title.trim())return;setErr('');try{const f=await apiCreateRegularMeeting({branchId,title,weekday,startTime,endTime,location});setS(f);setTitle('')}catch(e:any){setErr(e.message)}}
  if(!s)return <div className="card">{err||'載入中...'}</div>;
  return <div className="stack"><section className="hero"><span className="badge gold">行事曆設定</span><h1>日常集會資料</h1><p>設定恆常集會規則。領袖可在行事曆按「×」標記某日不用集會。</p></section>
    {err&&<p className="badge red">{err}</p>}
    <section className="card"><table className="table"><thead><tr><th>支部</th><th>標題</th><th>星期</th><th>時間</th><th>地點</th><th>啟用</th><th>操作</th></tr></thead><tbody>{s.regularMeetings.map(r=><tr key={r.id}><td>{branches.find(b=>b.id===r.branchId)?.name||r.branchId}</td><td>{r.title}</td><td>星期{weekdays[r.weekday]}</td><td>{r.startTime}-{r.endTime}</td><td>{r.location}</td><td>{r.enabled?'是':'否'}</td><td><button className="btn" onClick={()=>toggle(r.id)}>{r.enabled?'停用':'啟用'}</button></td></tr>)}</tbody></table></section>
    <section className="card"><h3>新增規則</h3><div className="grid">
      <select value={branchId} onChange={e=>setBranchId(e.target.value)}>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="童軍恆常集會"/>
      <select value={weekday} onChange={e=>setWeekday(e.target.value)}>{weekdays.map((w,i)=><option key={i} value={i}>星期{w}</option>)}</select>
      <input value={startTime} onChange={e=>setStartTime(e.target.value)} placeholder="14:00"/>
      <input value={endTime} onChange={e=>setEndTime(e.target.value)} placeholder="16:00"/>
      <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="本中心"/>
    </div><button className="btn primary" onClick={add} style={{marginTop:12}}>新增日常集會規則</button></section>
  </div>;
}
