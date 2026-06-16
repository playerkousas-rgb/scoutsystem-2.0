'use client';
import { useEffect, useState } from 'react';
import { AppState, loadState } from '@/lib/store';
import { apiToggleUser, apiCreateUser } from '@/lib/api';
import { ROLE_LABEL, branches, MANAGER_ROLES, LEADER_ROLES } from '@/lib/model';
import type { Role } from '@/lib/model';
export default function Page(){
  const [s,setS]=useState<AppState|null>(null);const [err,setErr]=useState('');
  const [showAdd,setShowAdd]=useState(false);
  const [name,setName]=useState('');const [email,setEmail]=useState('');const [pw,setPw]=useState('changeme');
  const [role,setRole]=useState<Role>('parent');const [branchId,setBranchId]=useState('');
  useEffect(()=>{loadState().then(setS).catch(e=>setErr(e.message))},[]);
  async function toggle(id:string){setErr('');try{const f=await apiToggleUser(id);setS(f)}catch(e:any){setErr(e.message)}}
  async function add(){
    if(!name||!email){setErr('請填姓名及 Email');return;}
    setErr('');try{const f=await apiCreateUser({name,email,password:pw,role,branchId:LEADER_ROLES.includes(role)?branchId:''});setS(f);setShowAdd(false);setName('');setEmail('')}catch(e:any){setErr(e.message)}
  }
  if(!s)return <div className="card">{err||'載入中...'}</div>;
  return <div className="stack"><section className="hero"><span className="badge gold">使用者管理</span><h1>使用者管理</h1><p>管理帳號、角色、啟用 / 停用。Sheep / 0728 是技術測試帳號。</p></section>
    {err&&<p className="badge red">{err}</p>}
    <section className="card"><table className="table"><thead><tr><th>姓名</th><th>Email</th><th>角色</th><th>支部</th><th>狀態</th><th>子女</th><th>操作</th></tr></thead>
      <tbody>{s.users.map(u=><tr key={u.id}><td>{u.name}</td><td>{u.email||'—'}</td><td>{ROLE_LABEL[u.role]||u.role}</td><td>{branches.find(b=>b.id===u.branchId)?.short||'-'}</td><td>{u.approved?'啟用':'停用'}</td><td>{(u.childMemberIds||[]).length}</td>
        <td><button className="btn" onClick={()=>toggle(u.id)}>{u.approved?'停用':'啟用'}</button></td></tr>)}</tbody></table>
      <button className="btn primary" onClick={()=>setShowAdd(!showAdd)} style={{marginTop:12}}>{showAdd?'取消':'＋ 新增使用者'}</button></section>
    {showAdd&&<section className="card stack"><h3>新增使用者</h3>
      <div className="grid">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="姓名 *"/>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email *"/>
        <input value={pw} onChange={e=>setPw(e.target.value)} placeholder="密碼"/>
        <select value={role} onChange={e=>setRole(e.target.value as Role)}>{[...MANAGER_ROLES,...LEADER_ROLES,'parent','member'].map(r=><option key={r} value={r}>{ROLE_LABEL[r as Role]}</option>)}</select>
        {(LEADER_ROLES.includes(role)||role==='member')&&<select value={branchId} onChange={e=>setBranchId(e.target.value)}><option value="">選擇支部</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>}
      </div>
      <button className="btn primary" onClick={add}>建立</button></section>}
  </div>;
}
