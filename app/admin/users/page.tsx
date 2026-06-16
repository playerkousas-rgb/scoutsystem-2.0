'use client';
import { useEffect, useState } from 'react';
import { AppState, loadState } from '@/lib/store';
import { apiToggleUser, apiCreateUser, apiUpdateUserRole, apiDeleteUser } from '@/lib/api';
import { ROLE_LABEL, branches, MANAGER_ROLES, LEADER_ROLES } from '@/lib/model';
import type { Role } from '@/lib/model';

export default function Page(){
  const [s,setS]=useState<AppState|null>(null);const [err,setErr]=useState('');
  const [showAdd,setShowAdd]=useState(false);
  const [filterRole,setFilterRole]=useState<string>('all');
  const [filterBranch,setFilterBranch]=useState<string>('all');
  const [filterStatus,setFilterStatus]=useState<string>('all');
  const [search,setSearch]=useState('');
  const [name,setName]=useState('');const [email,setEmail]=useState('');const [pw,setPw]=useState('changeme');
  const [role,setRole]=useState<Role>('parent');const [branchId,setBranchId]=useState('');

  useEffect(()=>{loadState().then(setS).catch(e=>setErr(e.message))},[]);

  async function toggle(id:string){setErr('');try{const f=await apiToggleUser(id);setS(f)}catch(e:any){setErr(e.message)}}
  async function changeRole(userId:string,newRole:Role){setErr('');try{const f=await apiUpdateUserRole(userId,newRole);setS(f)}catch(e:any){setErr(e.message)}}
  async function del(id:string,name:string){if(!confirm(`確定刪除 ${name} 的帳號？此操作不可復原。`))return;setErr('');try{const f=await apiDeleteUser(id);setS(f)}catch(e:any){setErr(e.message)}}
  async function add(){
    if(!name||!email){setErr('請填姓名及 Email');return;}
    setErr('');try{const f=await apiCreateUser({name,email,password:pw,role,branchId:LEADER_ROLES.includes(role)?branchId:''});setS(f);setShowAdd(false);setName('');setEmail('')}catch(e:any){setErr(e.message)}
  }

  if(!s)return <div className="card">{err||'載入中...'}</div>;

  const filtered=s.users.filter(u=>{
    if(filterRole!=='all'&&u.role!==filterRole)return false;
    if(filterBranch!=='all'&&u.branchId!==filterBranch)return false;
    if(filterStatus==='active'&&!u.approved)return false;
    if(filterStatus==='disabled'&&u.approved)return false;
    if(search&&!u.name.toLowerCase().includes(search.toLowerCase())&&!u.email.toLowerCase().includes(search.toLowerCase()))return false;
    return true;
  });

  return <div className="stack">
    <section className="hero"><span className="badge gold">使用者管理</span><h1>使用者管理</h1><p>篩選、查看、啟用/停用、修改角色、刪除帳號。</p></section>
    {err&&<p className="badge red">{err}</p>}

    <section className="card stack">
      <h3>篩選</h3>
      <div className="grid">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜尋姓名或 Email"/>
        <select value={filterRole} onChange={e=>setFilterRole(e.target.value)}>
          <option value="all">全部角色</option>
          <option value="admin">管理員</option>
          <option value="group_leader">團長</option>
          <option value="branch_leader">支部領袖</option>
          <option value="coach">教練員</option>
          <option value="parent">家長</option>
          <option value="member">成員</option>
        </select>
        <select value={filterBranch} onChange={e=>setFilterBranch(e.target.value)}>
          <option value="all">全部支部</option>
          {branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
          <option value="all">全部狀態</option>
          <option value="active">啟用中</option>
          <option value="disabled">已停用</option>
        </select>
      </div>
      <button className="btn primary" onClick={()=>setShowAdd(!showAdd)}>{showAdd?'取消':'＋ 新增使用者'}</button>
    </section>

    {showAdd&&<section className="card stack"><h3>新增使用者</h3>
      <div className="grid">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="姓名 *"/>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email *"/>
        <input value={pw} onChange={e=>setPw(e.target.value)} placeholder="密碼"/>
        <select value={role} onChange={e=>setRole(e.target.value as Role)}>{[...MANAGER_ROLES,...LEADER_ROLES,'parent'].map(r=><option key={r} value={r}>{ROLE_LABEL[r as Role]}</option>)}</select>
        {(LEADER_ROLES.includes(role))&&<select value={branchId} onChange={e=>setBranchId(e.target.value)}><option value="">選擇支部</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>}
      </div>
      <button className="btn primary" onClick={add}>建立</button>
    </section>}

    <section className="card"><table className="table">
      <thead><tr><th>姓名</th><th>Email</th><th>角色</th><th>支部</th><th>狀態</th><th>操作</th></tr></thead>
      <tbody>{filtered.map(u=><tr key={u.id}>
        <td>{u.name}{u.techTest&&<span className="badge blue" style={{marginLeft:4}}>技術</span>}</td>
        <td>{u.email||'—'}</td>
        <td>
          <select value={u.role} onChange={e=>changeRole(u.id,e.target.value as Role)} style={{fontSize:'0.9em'}}>
            <option value="admin">管理員</option>
            <option value="group_leader">團長</option>
            <option value="branch_leader">支部領袖</option>
            <option value="coach">教練員</option>
            <option value="parent">家長</option>
            <option value="member">成員</option>
          </select>
        </td>
        <td>{branches.find(b=>b.id===u.branchId)?.short||'-'}</td>
        <td>{u.approved?<span className="badge green">啟用</span>:<span className="badge red">停用</span>}</td>
        <td>
          <button className="btn" onClick={()=>toggle(u.id)}>{u.approved?'停用':'啟用'}</button>
          <button className="btn" style={{marginLeft:4,color:'#d93025'}} onClick={()=>del(u.id,u.name)}>刪除</button>
        </td>
      </tr>)}</tbody>
    </table>
    <p className="muted">{filtered.length} / {s.users.length} 個使用者</p>
    </section>
  </div>;
}
