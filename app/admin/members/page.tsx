'use client';
import { useEffect, useState } from 'react';
import { AppState, loadState, mutate, addAudit } from '@/lib/store';
import { branches } from '@/lib/model';
import { getSession } from '@/lib/session';
function roleLabel(r?:string){return r==='leader'?'隊長 / 六長':r==='deputy'?'副隊長 / 副六長':r==='member'?'隊員 / 六員':'—'}
export default function Page(){
  const [s,setS]=useState<AppState|null>(null);const [name,setName]=useState('');const [ym,setYm]=useState('');const [branch,setBranch]=useState('b3');const [patrol,setPatrol]=useState('');const [parent,setParent]=useState('');
  useEffect(()=>setS(loadState()),[]);
  function patrolName(id?:string){return s?.patrols.find(p=>p.id===id)?.name||'不適用 / 未分隊'}
  function parentName(id?:string){return s?.users.find(u=>u.id===id)?.name||'未連結'}
  function add(){if(!name||!ym)return;const user=getSession();const next=mutate(st=>{const id='m_'+Date.now();st.members.push({id,ymNumber:ym,name,branchId:branch,patrolId:patrol,patrolRole:patrol?'member':'',age:12,parentUserId:parent||undefined,emergencyContactName:parent?st.users.find(u=>u.id===parent)?.name:undefined,active:true}); if(parent){const u=st.users.find(x=>x.id===parent); if(u){u.childMemberIds=Array.from(new Set([...(u.childMemberIds||[]),id]));}} addAudit(st,user?.userId||'demo','create','Members',id,`${name} ${ym}`)});setName('');setYm('');setPatrol('');setParent('');setS(next)}
  function linkParent(mid:string,pid:string){const user=getSession();const next=mutate(st=>{const m=st.members.find(x=>x.id===mid); if(m)m.parentUserId=pid||undefined; st.users.filter(u=>u.role==='parent').forEach(u=>u.childMemberIds=(u.childMemberIds||[]).filter(x=>x!==mid)); if(pid){const u=st.users.find(x=>x.id===pid); if(u)u.childMemberIds=Array.from(new Set([...(u.childMemberIds||[]),mid]));} addAudit(st,user?.userId||'demo','linkParent','Members',mid,pid||'unlink')});setS(next)}
  if(!s)return <div className="card">載入中...</div>; const parents=s.users.filter(u=>u.role==='parent');
  return <div className="stack"><section className="hero"><span className="badge gold">成員資料庫</span><h1>成員資料庫</h1><p>已可新增成員、指派支部 / 小隊，並連結家長。家長登入後會根據 parentUserId / childMemberIds 看到子女。</p></section>
    <section className="card stack"><h2>新增成員</h2><div className="grid"><input value={name} onChange={e=>setName(e.target.value)} placeholder="姓名"/><input value={ym} onChange={e=>setYm(e.target.value)} placeholder="YMIS"/><select value={branch} onChange={e=>{setBranch(e.target.value);setPatrol('')}}>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select><select value={patrol} onChange={e=>setPatrol(e.target.value)}><option value="">不適用 / 未分隊</option>{s.patrols.filter(p=>p.branchId===branch&&p.enabled).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><select value={parent} onChange={e=>setParent(e.target.value)}><option value="">未連結家長</option>{parents.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div><button className="btn primary" onClick={add}>新增成員</button></section>
    <section className="card"><table className="table"><thead><tr><th>姓名</th><th>YMIS</th><th>支部</th><th>小隊 / 六</th><th>隊內身份</th><th>家長連結</th></tr></thead><tbody>{s.members.map((c:any)=><tr key={c.id}><td>{c.name}</td><td>{c.ymNumber}</td><td>{c.branchId}</td><td>{patrolName(c.patrolId)}</td><td>{roleLabel(c.patrolRole)}</td><td><select value={c.parentUserId||''} onChange={e=>linkParent(c.id,e.target.value)}><option value="">未連結</option>{parents.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></td></tr>)}</tbody></table></section></div>
}
