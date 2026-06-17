'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppState, loadState } from '@/lib/store';
import { apiImportBookmark } from '@/lib/api';
import { branches, ROLE_LABEL } from '@/lib/model';
import { getSession } from '@/lib/session';

export default function Import(){
  const [s,setS]=useState<AppState|null>(null);const [err,setErr]=useState('');
  const [mode,setMode]=useState<'informational'|'troop_participation'>('informational');
  const [title,setTitle]=useState('');
  const [internalDeadline,setInternalDeadline]=useState('');
  const [officialDeadline,setOfficialDeadline]=useState('');
  const [fee,setFee]=useState('');
  const [source,setSource]=useState('');
  const [eligibility,setEligibility]=useState('');
  const [activityType,setActivityType]=useState('');
  const [selectedBranches,setSelectedBranches]=useState<string[]>([]);
  const [msg,setMsg]=useState('');
  const [loading,setLoading]=useState(false);

  const session=getSession();
  const canImport=session && ['super_admin','admin','group_leader','branch_leader','coach'].includes(session.role);

  useEffect(()=>{loadState().then(setS).catch(e=>setErr(e.message))},[]);

  function toggleBranch(id:string){
    setSelectedBranches(prev=>prev.includes(id)?prev.filter(b=>b!==id):[...prev,id]);
  }

  async function save(){
    setErr('');setMsg('');
    if(!title.trim()){setErr('請填通告標題');return;}
    setLoading(true);
    try{
      const branchTags=selectedBranches.length>0
        ? selectedBranches.map(id=>branches.find(b=>b.id===id)?.short||id).join(',')
        : '全旅';
      const f=await apiImportBookmark({
        title,mode,source,internalDeadline,officialDeadline,fee,eligibility,activityType,branchTags,
      });
      const {loadState}=await import('@/lib/store');
      setS(await loadState());
      setMsg(mode==='troop_participation'?'✅ 已轉成活動並加入行事曆':'✅ 已加入資訊性通告');
      setTitle('');setInternalDeadline('');setOfficialDeadline('');setFee('');setSource('');setEligibility('');setActivityType('');setSelectedBranches([]);
    }catch(e:any){setErr(e.message)}finally{setLoading(false)}
  }

  return <div className="stack">
    <section className="hero">
      <span className="badge gold">通告圖書館引入</span>
      <h1>由童軍通告圖書館引入</h1>
      <p>從圖書館複製通告資料貼入下方。標題、來源、截止、費用、對象照抄圖書館；你只需加上本旅截止日期和分類標籤。</p>
      <a className="btn primary" href="https://scout-circulars.vercel.app/" target="_blank">📚 打開童軍通告圖書館</a>
    </section>

    {err&&<p className="badge red">{err}</p>}
    {msg&&<p className="badge green">{msg}</p>}

    <section className="card">
      <h3>從圖書館自動引入</h3>
      <ol className="muted">
        <li>到 <a href="https://scout-circulars.vercel.app/" target="_blank">童軍通告圖書館</a></li>
        <li>在圖書館設定你的 ScoutSystem 網址（只需一次）</li>
        <li>找到適合的通告，按「加入 ScoutSystem」即可自動引入</li>
        <li>也可在下方手動引入並分類</li>
      </ol>
    </section>

    {!canImport && <section className="card"><p className="badge red">只有領袖可以引入通告。</p></section>}

    {canImport && <>
    <section className="grid-wide">
      <button className={`card notice-mode ${mode==='informational'?'active':''}`} onClick={()=>setMode('informational')}>
        <span className="badge gold">📢 資訊性</span>
        <h3>只作通告提醒</h3>
        <p className="muted">不加入行事曆，不需要家長回覆。</p>
      </button>
      <button className={`card notice-mode ${mode==='troop_participation'?'active':''}`} onClick={()=>setMode('troop_participation')}>
        <span className="badge purple">🏕️ 旅團參與</span>
        <h3>轉成旅團活動</h3>
        <p className="muted">加入行事曆，家長需要回覆。</p>
      </button>
    </section>

    <section className="card stack">
      <h3>引入通告（從圖書館複製資料）</h3>

      <label>通告標題<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="例如：皮藝坊 - 貓頭鷹及小提琴皮革製造"/></label>

      <div className="grid">
        <label>來源<input value={source} onChange={e=>setSource(e.target.value)} placeholder="總會 / 地域 / 區會"/></label>
        <label>費用<input value={fee} onChange={e=>setFee(e.target.value)} placeholder="$150"/></label>
      </div>

      <div className="grid">
        <label>原通告截止<input type="date" value={officialDeadline} onChange={e=>setOfficialDeadline(e.target.value)}/></label>
        <label>本旅截止日期（你設定）<input type="date" value={internalDeadline} onChange={e=>setInternalDeadline(e.target.value)}/></label>
      </div>
      <p className="muted">💡 本旅截止通常早於原通告截止，預留時間收表、整理。</p>

      <label>參加資格 / 對象<input value={eligibility} onChange={e=>setEligibility(e.target.value)} placeholder="例如：童軍、深資童軍"/></label>

      <label>活動類型<input value={activityType} onChange={e=>setActivityType(e.target.value)} placeholder="例如：訓練班 / 比賽 / 服務 / 課程"/></label>

      <div>
        <strong>適用支部標籤：</strong>
        <div className="row" style={{flexWrap:'wrap',gap:6,marginTop:6}}>
          {branches.map(b=><button key={b.id} type="button" className={`btn ${selectedBranches.includes(b.id)?'primary':''}`} onClick={()=>toggleBranch(b.id)} style={{fontSize:'0.85em'}}>{b.short}</button>)}
        </div>
        <p className="muted">不選 = 全旅。可多選。決定哪些支部的成員會看到此通告。</p>
      </div>

      <button className="btn primary" disabled={loading} onClick={save}>{loading?'引入中...':'引入此通告'}</button>
    </section>
    </>}

    {s&&s.bookmarks.length>0&&<section className="card">
      <h3>已引入通告</h3>
      <table className="table"><thead><tr><th>標題</th><th>模式</th><th>來源</th><th>類型</th><th>對象</th><th>支部標籤</th><th>本旅截止</th><th>費用</th><th>引入者</th></tr></thead>
      <tbody>{s.bookmarks.map(b=><tr key={b.id}><td>{b.title}</td><td><span className={`badge ${b.mode==='troop_participation'?'purple':'gold'}`}>{b.mode==='troop_participation'?'旅團參與':'資訊性'}</span></td><td>{b.source||'—'}</td><td>{b.activityType||'—'}</td><td>{b.eligibility||'—'}</td><td>{b.branchTags?.join(', ')||'全旅'}</td><td>{b.internalDeadline||'—'}</td><td>{b.fee||'—'}</td><td>{b.importedBy||'—'}</td></tr>)}</tbody></table>
    </section>}
  </div>;
}
