'use client';
import { useEffect, useState } from 'react';
import { AppState, loadState } from '@/lib/store';
import { apiSaveConfig } from '@/lib/api';
import Link from 'next/link';
export default function Page(){
  const [s,setS]=useState<AppState|null>(null);const [err,setErr]=useState('');const [ok,setOk]=useState('');
  useEffect(()=>{loadState().then(setS).catch(e=>setErr(e.message))},[]);
  async function save(k:string,v:string){setErr('');setOk('');try{const f=await apiSaveConfig(k,v);setS(f);setOk('✅ 已儲存 '+k)}catch(e:any){setErr(e.message)}}
  if(!s)return <div className="card">{err||'載入中...'}</div>;
  return <div className="stack"><section className="hero"><span className="badge gold">系統設定</span><h1>SystemConfig</h1><p>直接讀寫後台 SystemConfig Sheet。修改後會即時生效。</p></section>
    {err&&<p className="badge red">{err}</p>}{ok&&<p className="badge green">{ok}</p>}
    <section className="card stack">
      <Link href="/admin/settings/plugins" className="btn gold">⚙️ 單位元件設定 (Tier 3)</Link>
      <hr/>
      {Object.entries(s.config).map(([k,v])=>(
      <label key={k}>{k}<input key={k+v} defaultValue={v} onBlur={e=>{if(e.target.value!==v)save(k,e.target.value)}}/></label>
    ))}</section>
  </div>;
}
