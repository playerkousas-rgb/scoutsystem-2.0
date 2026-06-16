'use client';
import { useEffect, useState } from 'react';
import { AppState, loadState } from '@/lib/store';
import { apiSaveConfig } from '@/lib/api';
import Link from 'next/link';
export default function TroopSettings(){
  const [s,setS]=useState<AppState|null>(null);const [err,setErr]=useState('');const [ok,setOk]=useState('');
  useEffect(()=>{loadState().then(setS).catch(e=>setErr(e.message))},[]);
  async function save(k:string,v:string){setErr('');setOk('');try{const f=await apiSaveConfig(k,v);setS(f);setOk('✅ 已儲存')}catch(e:any){setErr(e.message)}}
  if(!s)return <div className="card">{err||'載入中...'}</div>;
  const editableKeys=['TROOP_CODE','TROOP_NAME','ADMIN_EMAIL','FRONTEND_URL','ANNOUNCEMENT_FOLDER_ID','ANNOUNCEMENT_FOLDER_URL'];
  return <div className="stack"><section className="hero"><span className="badge gold">旅團設定</span><h1>旅團基本設定</h1><p>直接修改後台 SystemConfig。這些是旅團最常需要改的設定。</p><Link className="btn" href="/admin/settings">全部設定 →</Link></section>
    {err&&<p className="badge red">{err}</p>}{ok&&<p className="badge green">{ok}</p>}
    <section className="card stack">{editableKeys.filter(k=>s.config[k]!==undefined).map(k=>(
      <label key={k}>{k}<input key={k+s.config[k]} defaultValue={s.config[k]} onBlur={e=>{if(e.target.value!==s.config[k])save(k,e.target.value)}}/></label>
    ))}</section>
  </div>;
}
