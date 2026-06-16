'use client';
import { useEffect, useState } from 'react';
import { AppState, loadState } from '@/lib/store';
import { apiToggleUser, apiCreateUser } from '@/lib/api';
import { apiUpdateUserRole } from '@/lib/api';
import { ROLE_LABEL, branches, MANAGER_ROLES, LEADER_ROLES } from '@/lib/model';
import type { Role } from '@/lib/model';

type SortBy = 'name' | 'role' | 'branch' | 'approved';

export default function Page(){
  const [s,setS]=useState<AppState|null>(null);const [err,setErr]=useState('');
  const [showAdd,setShowAdd]=useState(false);
  const [sortBy,setSortBy]=useState<SortBy>('name');
  const [name,setName]=useState('');const [email,setEmail]=useState('');const [pw,setPw]=useState('changeme');
  const [role,setRole]=useState<Role>('parent');const [branchId,setBranchId]=useState('');
  useEffect(()=>{loadState().then(setS).catch(e=>setErr(e.message))},[]);

  async function toggle(id:string){setErr('');try{const f=await apiToggleUser(id);setS(f)}catch(e:any){setErr(e.message)}}
  async function changeRole(userId:string,newRole:Role){setErr('');try{const f=await apiUpdateUserRole(userId,newRole);setS(f)}catch(e:any){setErr(e.message)}}
  async function add(){
    if(!name||!email){setErr('請填姓名及 Email');return;}
    setErr('');try{const f=await apiCreateUser({name,email,password:pw,role,branchId:LEADER_ROLES.includes(role)?branchId:''});setS(f);setShowAdd(false);setName('');setEmail('')}catch(e:any){setErr(e.message)}
  }

  if(!s)return <div className="card">{err||'載入中...'}</div>;

  const sorted=[...s.users].sort((a,b)=>{
    switch(sortBy){
      case 'name':return a.name.localeCompare(b.name);
      case 'role':return a.role.localeCompare(b.role);
      case 'branch':return (a.branchId||'').localeCompare(b.branchId||'');
      case 'approved':return a.approved===b.approved?0:a.approved?-1:1;
      default:return 0;
    }
  });

  return <div className="stack">
    <section className="hero"><span className="badge gold">使用者管理</span><h1>使用者管理</h1><p>查看、排序、啟用/停用、修改角色。帳號只能停用不能從前端刪除（需到後台 Sheet 處理）。</p></section>
    {err&&<p className="badge red">{err}</p>}

    <section className="card row">
      <label>排序：
        <select value={sortBy} onChange={e=>setSortBy(e.target.value as SortBy)}>
          <option value="name">按姓名</option>
          <option value="role">按角色</option>
          <option value="branch">按支部</option>
          <option value="approved">按狀態</option>
        </select>
      </label>
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
      <tbody>{sorted.map(u=><tr key={u.id}>
        <td>{u.name}{u.techTest&&<span className="badge blue" style={{marginLeft:4}}>技術</span>}</td>
        <td>{u.email||'—'}</td>
        <td>
          <select value={u.role} onChange={e=>changeRole(u.id,e.target.value as Role)} style={{fontSize:'0.9em'}}>
            <option value="admin">{ROLE_LABEL.admin}</option>
            <option value="group_leader">{ROLE_LABEL.group_leader}</option>
            <option value="branch_leader">{ROLE_LABEL.branch_leader}</option>
            <option value="coach">{ROLE_LABEL.coach}</option>
            <option value="parent">{ROLE_LABEL.parent}</option>
            <option value="member">{ROLE_LABEL.member}</option>
          </select>
        </td>
        <td>{branches.find(b=>b.id===u.branchId)?.short||'-'}</td>
        <td>{u.approved?<span className="badge green">啟用</span>:<span className="badge red">停用</span>}</td>
        <td><button className="btn" onClick={()=>toggle(u.id)}>{u.approved?'停用':'啟用'}</button></td>
      </tr>)}</tbody>
    </table></section>
  </div>;
}
