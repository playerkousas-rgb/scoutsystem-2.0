'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clearSession, getSession, Session } from '@/lib/session';
import { isAdmin } from '@/lib/model';

export default function TopNav(){
  const pathname = usePathname(); const router = useRouter();
  const [session,setSess]=useState<Session|null>(null);
  const [troop,setTroop]=useState<any>(null);
  useEffect(()=>{setSess(getSession()); try{setTroop(JSON.parse(localStorage.getItem('scoutsystem2_selected_troop')||'null'))}catch{setTroop(null)}},[pathname]);
  const logout=()=>{clearSession();setSess(null);router.push('/')};
  const dash = session?.role==='parent'?'/parent':session?.role==='member'?'/member':session?.role==='guest'?'/login':isAdmin(session?.role)?'/admin':'/leader';
  return <header className="topbar"><div className="topbar-inner">
    <Link className="brand" href="/">ScoutSystem</Link>
    <nav className="nav">
      {session && <><Link className="btn" href="/calendar">行事曆</Link><Link className="btn" href="/activities">活動</Link><Link className="btn" href="/library">圖書館</Link></>}
      {!session && <><Link className="btn optional" href="/setup">接入</Link><Link className="btn optional" href="/downloads">下載</Link><Link className="btn optional" href="/updates">更新</Link><Link className="btn optional" href="/troops">使用旅團</Link>{troop&&<Link className="btn optional" href="/apply">申請帳戶</Link>}</>}
      {session && isAdmin(session.role) && <><Link className="btn optional" href="/updates">更新</Link><Link className="btn optional" href="/marketplace">元件市場</Link><Link className="btn optional" href="/connectors">轉駁中心</Link></>}
      {session ? <><Link className="btn primary" href={dash}>控制台</Link><span className="badge blue">{session.troopName} · {session.name}</span><button className="btn" onClick={logout}>登出</button></> : <><span className="badge gold">{troop?`已選：${troop.name}`:'未選旅團'}</span><Link className="btn primary" href="/login">登入</Link></>}
    </nav>
  </div></header>
}
