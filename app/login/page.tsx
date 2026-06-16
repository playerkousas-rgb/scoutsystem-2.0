'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { setSession } from '@/lib/session';
import Link from 'next/link';

type Tab='account'|'member';
export default function Login(){
  const router=useRouter(); const [troop,setTroop]=useState<any>(null); const [tab,setTab]=useState<Tab>('account'); const [identifier,setIdentifier]=useState(''); const [password,setPassword]=useState(''); const [msg,setMsg]=useState('');
  useEffect(()=>{try{setTroop(JSON.parse(localStorage.getItem('scoutsystem2_selected_troop')||'null'))}catch{}},[]);
  async function submit(){
    setMsg('');
    if(!troop?.webAppUrl){setMsg('請先在首頁選擇並連接旅團。');return;}
    const id=identifier.trim();
    if(tab==='member'&&!/^\d{10}$/.test(id)){setMsg('YMIS 必須是 10 位數字號碼。');return;}
    try{
      const url=new URL(troop.webAppUrl);
      url.searchParams.set('action','login');
      url.searchParams.set('identifier',id);
      url.searchParams.set('password',password);
      url.searchParams.set('loginType',tab);
      const res=await fetch(url.toString(),{cache:'no-store'});
      const text=await res.text();
      if(/Access Denied|<html|<!doctype/i.test(text)) throw new Error('Apps Script Access Denied，請重新 Deploy 為 Anyone。');
      const data=JSON.parse(text);
      if(!data.success) throw new Error(data.error||'登入失敗');
      const u=data.user;
      setSession({userId:u.userId||u.id,name:u.name,role:u.role,troopCode:troop.id,troopName:troop.name,branchId:u.branchId,memberId:u.memberId,age:u.age});
      router.push(u.dashboard || (u.role==='parent'?'/parent':u.role==='member'?'/member':u.role==='admin'||u.role==='super_admin'?'/admin':'/leader'));
    }catch(e:any){setMsg('❌ '+(e?.message||String(e)));}
  }
  if(!troop) return <section className="hero"><span className="badge red">未選旅團</span><h1>請先連接旅團</h1><p>實測模式需要先在首頁填入 Apps Script URL。</p><Link className="btn primary" href="/">返回首頁</Link></section>;
  return <div className="stack"><section className="hero"><span className="badge gold">登入 {troop.name}</span><h1>登入旅團</h1><p>這裡會呼叫你的 Apps Script `action=login`。成員登入的 YMIS 必須是 10 位數字。</p></section><section className="card stack"><div className="row"><button className={`btn ${tab==='account'?'primary':''}`} onClick={()=>setTab('account')}>領袖及家長登入</button><button className={`btn ${tab==='member'?'primary':''}`} onClick={()=>setTab('member')}>成員 YMIS 登入</button></div><label>{tab==='member'?'YMIS 十位數字':'Email / User ID'}<input value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder={tab==='member'?'1234567890':'admin@example.com'}/></label><label>密碼<input type="password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="btn primary" onClick={submit}>登入</button>{msg&&<p className="badge red">{msg}</p>}</section></div>
}
