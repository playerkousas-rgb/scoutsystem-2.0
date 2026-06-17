'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppState, loadState, Bookmark } from '@/lib/store';
import { apiImportBookmark, apiUpdateBookmark } from '@/lib/api';
import { branches } from '@/lib/model';
import { getSession } from '@/lib/session';

const AUDIENCE_OPTIONS = ['全旅', '領袖', '成年成員', '小童軍', '幼童軍', '童軍', '深資童軍', '樂行童軍', '家長'];
const ACTIVITY_TYPES = ['訓練班', '比賽', '服務', '課程', '活動', '會議', '營會', '其他'];

export default function Import(){
  const [s,setS]=useState<AppState|null>(null);const [err,setErr]=useState('');
  const [editingId,setEditingId]=useState<string|null>(null);
  const [msg,setMsg]=useState('');
  const [loading,setLoading]=useState(false);
  const session=getSession();
  const canImport=session && ['super_admin','troop_super','admin','group_leader','branch_leader','coach'].includes(session.role);

  // New bookmark form
  const [title,setTitle]=useState('');
  const [source,setSource]=useState('');
  const [officialDeadline,setOfficialDeadline]=useState('');
  const [internalDeadline,setInternalDeadline]=useState('');
  const [fee,setFee]=useState('');
  const [eligibility,setEligibility]=useState('');
  const [activityType,setActivityType]=useState('');
  const [selectedBranches,setSelectedBranches]=useState<string[]>([]);
  const [selectedAudience,setSelectedAudience]=useState<string[]>([]);
  const [mode,setMode]=useState<'informational'|'troop_participation'>('informational');

  useEffect(()=>{loadState().then(setS).catch(e=>setErr(e.message))},[]);

  function toggleBranch(id:string){setSelectedBranches(prev=>prev.includes(id)?prev.filter(b=>b!==id):[...prev,id])}
  function toggleAudience(v:string){setSelectedAudience(prev=>prev.includes(v)?prev.filter(x=>x!==v):[...prev,v])}

  function resetForm(){
    setTitle('');setSource('');setOfficialDeadline('');setInternalDeadline('');setFee('');
    setEligibility('');setActivityType('');setSelectedBranches([]);setSelectedAudience([]);setMode('informational');
  }

  async function save(){
    setErr('');setMsg('');
    if(!title.trim()){setErr('請填通告標題');return;}
    setLoading(true);
    try{
      const branchTags=selectedBranches.length>0?selectedBranches.map(id=>branches.find(b=>b.id===id)?.short||id).join(','):'全旅';
      const audienceTags=selectedAudience.join(',')||'';
      await apiImportBookmark({title,mode,source,officialDeadline,internalDeadline,fee,eligibility,activityType,branchTags,audienceTags});
      const {loadState}=await import('@/lib/store');
      setS(await loadState());
      setMsg(mode==='troop_participation'?'✅ 已轉成活動並加入行事曆':'✅ 已加入資訊性通告');
      resetForm();
    }catch(e:any){setErr(e.message)}finally{setLoading(false)}
  }

  async function updateBookmark(id:string,patch:any){
    setLoading(true);setErr('');
    try{
      await apiUpdateBookmark({bookmarkId:id,...patch});
      const {loadState}=await import('@/lib/store');
      setS(await loadState());setEditingId(null);
      setMsg('✅ 已更新');
    }catch(e:any){setErr(e.message)}finally{setLoading(false)}
  }

  return <div className="stack">
    <section className="hero">
      <span className="badge gold">通告圖書館引入</span>
      <h1>由童軍通告圖書館引入</h1>
      <p>從圖書館引入通告時，標題、來源、截止、費用、對象已自動帶入。領袖只需確認、加上本旅截止日期和分類標籤。</p>
      <a className="btn primary" href="https://scout-circulars.vercel.app/" target="_blank">📚 打開童軍通告圖書館</a>
    </section>
    {err&&<p className="badge red">{err}</p>}
    {msg&&<p className="badge green">{msg}</p>}

    {!canImport&&<section className="card"><p className="badge red">只有領袖可以引入通告。</p></section>}

    {canImport&&<section className="card stack">
      <h3>引入通告</h3>
      <p className="muted">從圖書館複製通告資料填入。圖書館已抽取的資料直接帶入，領袖確認後加上分類。</p>
      <label>通告標題<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="例如：皮藝坊 - 貓頭鷹及小提琴皮革製造"/></label>
      <div className="grid">
        <label>來源<input value={source} onChange={e=>setSource(e.target.value)} placeholder="總會 / 地域 / 區會"/></label>
        <label>費用<input value={fee} onChange={e=>setFee(e.target.value)} placeholder="$150"/></label>
      </div>
      <div className="grid">
        <label>原通告截止<input type="date" value={officialDeadline} onChange={e=>setOfficialDeadline(e.target.value)}/></label>
        <label>本旅截止日期<input type="date" value={internalDeadline} onChange={e=>setInternalDeadline(e.target.value)}/></label>
      </div>
      <label>參加資格 / 對象<input value={eligibility} onChange={e=>setEligibility(e.target.value)} placeholder="例如：童軍、深資童軍"/></label>
      <label>活動類型
        <select value={activityType} onChange={e=>setActivityType(e.target.value)}>
          <option value="">— 選擇 —</option>
          {ACTIVITY_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
      </label>
      <div>
        <strong>適用支部：</strong>
        <div className="row" style={{flexWrap:'wrap',gap:6,marginTop:4}}>
          {branches.map(b=><button key={b.id} type="button" className={`btn ${selectedBranches.includes(b.id)?'primary':''}`} onClick={()=>toggleBranch(b.id)} style={{fontSize:'0.85em'}}>{b.short}</button>)}
        </div>
        <p className="muted">不選 = 全旅。</p>
      </div>
      <div>
        <strong>對象標籤：</strong>
        <div className="row" style={{flexWrap:'wrap',gap:6,marginTop:4}}>
          {AUDIENCE_OPTIONS.map(a=><button key={a} type="button" className={`btn ${selectedAudience.includes(a)?'primary':''}`} onClick={()=>toggleAudience(a)} style={{fontSize:'0.85em'}}>{a}</button>)}
        </div>
      </div>
      <label>接入模式
        <select value={mode} onChange={e=>setMode(e.target.value as any)}>
          <option value="informational">📢 資訊性（不加入行事曆）</option>
          <option value="troop_participation">🏕️ 旅團參與（加入行事曆 + 家長回覆）</option>
        </select>
      </label>
      <button className="btn primary" disabled={loading} onClick={save}>{loading?'引入中...':'引入此通告'}</button>
    </section>}

    {s&&s.bookmarks.length>0&&<section className="card">
      <h3>已引入通告</h3>
      <table className="table">
        <thead><tr><th>標題</th><th>來源</th><th>類型</th><th>對象</th><th>支部</th><th>對象標籤</th><th>截止</th><th>費用</th><th>模式</th><th>引入者</th></tr></thead>
        <tbody>{s.bookmarks.map(b=><tr key={b.id}>
          <td>{b.title}</td>
          <td>{b.source||'—'}</td>
          <td>{b.activityType?`🏷️ ${b.activityType}`:'—'}</td>
          <td>{b.eligibility||b.targetText||'—'}</td>
          <td>{b.branchTags?.map((t,i)=><span key={i} className="badge blue" style={{marginRight:2,fontSize:'0.8em'}}>{t}</span>)||'全旅'}</td>
          <td>{b.audienceTags?.map((t,i)=><span key={i} className="badge gold" style={{marginRight:2,fontSize:'0.8em'}}>{t}</span>)||'—'}</td>
          <td>{b.internalDeadline||b.officialDeadline||'—'}</td>
          <td>{b.fee||'—'}</td>
          <td><span className={`badge ${b.mode==='troop_participation'?'purple':'gold'}`}>{b.mode==='troop_participation'?'旅團參與':'資訊性'}</span></td>
          <td>{b.importedBy||'—'}</td>
        </tr>)}</tbody>
      </table>
    </section>}
  </div>;
}
