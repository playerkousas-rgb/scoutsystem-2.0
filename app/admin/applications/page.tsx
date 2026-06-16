'use client';
import { useEffect, useState } from 'react';
import { AppState, loadState } from '@/lib/store';
import { apiDecideApplication } from '@/lib/api';
import { ROLE_LABEL, branches } from '@/lib/model';
export default function Page(){
  const [s,setS]=useState<AppState|null>(null);const [err,setErr]=useState('');
  useEffect(()=>{loadState().then(setS).catch(e=>setErr(e.message))},[]);
  async function decide(id:string,status:'approved'|'rejected'){
    setErr('');try{const fresh=await apiDecideApplication(id,status);setS(fresh)}catch(e:any){setErr(e.message)}
  }
  if(!s)return <div className="card">{err||'載入中...'}</div>;
  const pending=s.applications.filter(a=>a.status==='pending');
  const decided=s.applications.filter(a=>a.status!=='pending');
  return <div className="stack"><section className="hero"><span className="badge gold">申請管理</span><h1>家長審核 / 申請管理</h1><p>批核 / 拒絕申請；批核家長時會自動建立帳號並綁定子女。</p></section>
    {err&&<p className="badge red">{err}</p>}
    <section className="card"><table className="table"><thead><tr><th>姓名</th><th>類型</th><th>角色</th><th>支部</th><th>YMIS</th><th>Email</th><th>操作</th></tr></thead>
      <tbody>{pending.map(a=><tr key={a.id}><td>{a.name}</td><td>{a.type}</td><td>{ROLE_LABEL[a.role]||a.role}</td><td>{branches.find(b=>b.id===a.branchId)?.short||'-'}</td><td>{a.ymNumbers||'-'}</td><td>{a.email||'-'}</td>
        <td><button className="btn primary" onClick={()=>decide(a.id,'approved')}>批核</button> <button className="btn" onClick={()=>decide(a.id,'rejected')}>拒絕</button></td></tr>)}</tbody></table>
      {pending.length===0&&<p className="muted">沒有待審批申請。</p>}</section>
    {decided.length>0&&<section className="card"><h3>已處理</h3><table className="table"><thead><tr><th>姓名</th><th>結果</th><th>處理時間</th></tr></thead><tbody>{decided.map(a=><tr key={a.id}><td>{a.name}</td><td><span className={`badge ${a.status==='approved'?'green':'red'}`}>{a.status}</span></td><td>{a.decidedAt||'—'}</td></tr>)}</tbody></table></section>}
  </div>;
}
