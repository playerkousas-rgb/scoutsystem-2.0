'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { demoSession, setSession } from '@/lib/session';
import { loadState, AppState } from '@/lib/store';
import { ROLE_LABEL, Role } from '@/lib/model';

const quickRoles: Role[]=['super_admin','admin','group_leader','branch_leader','coach','parent','member'];

export default function Login(){
  const router=useRouter();
  const [state,setState]=useState<AppState|null>(null);
  const [tab,setTab]=useState<'account'|'member'|'demo'>('account');
  const [identifier,setIdentifier]=useState('');
  useEffect(()=>setState(loadState()),[]);
  function go(role:Role){ router.push(role==='parent'?'/parent':role==='member'?'/member':role==='admin'||role==='super_admin'?'/admin':'/leader'); }
  function loginUser(user:any){
    const sess={ userId:user.id, name:user.name, role:user.role, troopCode: state?.config.TROOP_CODE||'0082', troopName: state?.config.TROOP_NAME||'第82旅', branchId:user.branchId, memberId:user.memberId };
    setSession(sess as any); go(user.role);
  }
  function submit(){
    if(!state)return;
    const v=identifier.trim().toLowerCase();
    if(tab==='member'){
      const member=state.members.find(m=>m.ymNumber.toLowerCase()===v);
      if(!member){ alert('找不到此 YMIS 成員。'); return; }
      let user=state.users.find(u=>u.memberId===member.id);
      if(!user){ alert('此成員未建立登入帳號，請先由管理員在成員資料庫 / 申請管理建立。'); return; }
      loginUser(user); return;
    }
    const user=state.users.find(u=>u.email.toLowerCase()===v || u.id.toLowerCase()===v);
    if(!user){ alert('找不到帳號。示範可輸入 admin@example.com / parent@example.com / member@example.com'); return; }
    if(!user.approved){ alert('帳號未啟用。'); return; }
    loginUser(user);
  }
  function demo(role:Role){ const s=demoSession(role); setSession(s); go(role); }
  return <div className="stack"><section className="hero"><span className="badge gold">登入系統</span><h1>登入旅團</h1><p>2.0 沙盤已接同一份 Users / Members 資料。家長帳號會用 childMemberIds / Members.parentUserId 找子女；成員可用 YMIS 登入。</p></section>
    <section className="card stack"><div className="row"><button className={`btn ${tab==='account'?'primary':''}`} onClick={()=>setTab('account')}>領袖及家長登入</button><button className={`btn ${tab==='member'?'primary':''}`} onClick={()=>setTab('member')}>成員 YMIS 登入</button><button className={`btn ${tab==='demo'?'primary':''}`} onClick={()=>setTab('demo')}>角色快速登入</button></div>
      {tab!=='demo'?<><label>{tab==='member'?'YMIS 編號':'Email / User ID'}<input value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder={tab==='member'?'YM001':'admin@example.com'}/></label><button className="btn primary" onClick={submit}>登入</button><p className="muted">沙盤不檢查密碼；正式版會由 Apps Script login 驗證。</p></>:<section className="grid">{quickRoles.map(r=><button key={r} onClick={()=>demo(r)} className="card" style={{textAlign:'left',cursor:'pointer'}}><span className="badge blue">{r}</span><h3>{ROLE_LABEL[r]}</h3><p className="muted">快速切換示範角色</p><span className="btn block">登入</span></button>)}</section>}
    </section>
    {state&&<section className="card"><h3>沙盤帳號提示</h3><p className="muted">管理員：admin@example.com；家長：parent@example.com；成員 Email：member@example.com；成員 YMIS：YM001。</p></section>}
  </div>
}
