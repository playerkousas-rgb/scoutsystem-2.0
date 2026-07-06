'use client';
import { useEffect, useState } from 'react';
import { AppState, loadState } from '@/lib/store';
import { apiToggleUser, apiCreateUser, apiUpdateUserRole, apiDeleteUser, apiGrantFeature, apiRevokeFeature, apiGetUserFeatures, apiUpdateUserPermissions } from '@/lib/api';
import { ROLE_LABEL, branches, LEADER_ROLES } from '@/lib/model';
import { checkEditPermission, assignableRoles } from '@/lib/permissions';
import { getSession } from '@/lib/session';
import type { Role } from '@/lib/model';

const FEATURE_LABELS: Record<string,string> = {
  branches: '支部管理', members: '成員資料庫', applications: '審核 / 申請管理',
  events: '活動管理', registrations: '報名管理', library_import: '圖書館引入',
  notices: '通告管理', users: '使用者管理', settings: '系統設定',
  audit: '審核紀錄', calendar: '行事曆管理',
};

export default function Page(){
  const [s,setS]=useState<AppState|null>(null);
  const [err,setErr]=useState('');
  const [showAdd,setShowAdd]=useState(false);
  const [search,setSearch]=useState('');
  const [filterRole,setFilterRole]=useState('all');
  const [name,setName]=useState('');const [email,setEmail]=useState('');const [pw,setPw]=useState('changeme');
  const [role,setRole]=useState<Role>('parent');const [branchId,setBranchId]=useState('');
  const [loading,setLoading]=useState(false);
  const [ok,setOk]=useState('');
  const [permsUserId,setPermsUserId]=useState<string|null>(null);
  const [perms,setPerms]=useState<any[]>([]);
  const [isMemberPerms, setIsMemberPerms] = useState(false);
  const session=getSession();

  useEffect(()=>{loadState().then(setS).catch(e=>setErr(e.message))},[]);

  async function toggle(id:string){setErr('');try{const f=await apiToggleUser(id);setS(f)}catch(e:any){setErr(e.message)}}
  async function changeRole(userId:string,newRole:Role){setErr('');try{const f=await apiUpdateUserRole(userId,newRole);setS(f)}catch(e:any){setErr(e.message)}}
  async function del(id:string,userName:string){if(!confirm(`確定刪除 ${userName}？`))return;setErr('');try{const f=await apiDeleteUser(id);setS(f)}catch(e:any){setErr(e.message)}}
  async function add(){
    if(!name||!email){setErr('請填姓名及 Email');return;}
    setErr('');setLoading(true);
    try{const f=await apiCreateUser({name,email,password:pw,role,branchId:LEADER_ROLES.includes(role)?branchId:''});setS(f);setShowAdd(false);setName('');setEmail('')}catch(e:any){setErr(e.message)}finally{setLoading(false)}
  }

  async function openPerms(userId:string, isMember = false){
    setPermsUserId(userId);
    setIsMemberPerms(isMember);
    setLoading(true);
    try{
      const result=await apiGetUserFeatures(userId);
      if(result.success) setPerms(result.features||[]);
    }catch(e:any){setErr(e.message)}finally{setLoading(false)}
  }

  function toggleFeatureLocal(feature: string, enabled: boolean) {
    setPerms(prev => prev.map(p => p.feature === feature ? { ...p, enabled, overridden: true } : p));
  }

  async function savePermsBatch() {
    if (!permsUserId) return;
    setLoading(true); setErr(''); setOk('');
    try {
      const enabledFeatures = perms.filter(p => p.enabled).map(p => p.feature);
      const freshState = await apiUpdateUserPermissions(permsUserId, enabledFeatures);
      setOk('✅ 授權設定已完整批次寫入！');
      setS(freshState);
      setPermsUserId(null);
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }

  async function toggleFeature(userId:string,feature:string,enabled:boolean){
    setLoading(true);setErr('');
    try{
      if(enabled){
        await apiGrantFeature(userId,feature,true);
      }else{
        await apiRevokeFeature(userId,feature);
      }
      // Reload perms
      const result=await apiGetUserFeatures(userId);
      if(result.success) setPerms(result.features||[]);
      setOk('✅ 已更新權限');
    }catch(e:any){setErr(e.message)}finally{setLoading(false)}
  }

  if(!s)return <div className="card">{err||'載入中...'}</div>;
  const myRole=session?.role||'guest';
  const myBranchId=session?.branchId||'';
  const myUserId=session?.userId||'';
  const assignable=assignableRoles(myRole);

  const filtered=s.users.filter(u=>{
    if(filterRole!=='all'&&u.role!==filterRole)return false;
    if(search&&!u.name.toLowerCase().includes(search.toLowerCase())&&!u.email.toLowerCase().includes(search.toLowerCase()))return false;
    return true;
  });

  return <div className="stack">
    <section className="hero"><span className="badge gold">使用者管理</span><h1>使用者管理</h1><p>管理帳號、角色、功能權限。上級可授權下級額外功能。</p></section>
    {err&&<p className="badge red">{err}</p>}
    {ok&&<p className="badge green">{ok}</p>}

    <section className="card row">
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜尋姓名或 Email" style={{flex:1}}/>
      <select value={filterRole} onChange={e=>setFilterRole(e.target.value)}>
        <option value="all">全部角色</option>
        <option value="troop_super">超管</option><option value="admin">管理員</option>
        <option value="group_leader">團長</option><option value="branch_leader">支部領袖</option>
        <option value="coach">教練員</option><option value="parent">家長</option><option value="member">成員</option>
      </select>
      <button className="btn primary" onClick={()=>setShowAdd(!showAdd)}>{showAdd?'取消':'＋ 新增'}</button>
    </section>

    {showAdd&&<section className="card stack"><h3>新增使用者</h3>
      <div className="grid">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="姓名 *"/>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email *"/>
        <input value={pw} onChange={e=>setPw(e.target.value)} placeholder="密碼"/>
        <select value={role} onChange={e=>setRole(e.target.value as Role)}>
          {assignable.map(r=><option key={r} value={r}>{ROLE_LABEL[r as Role]}</option>)}
          {assignable.length===0&&<option value="member">成員</option>}
        </select>
        {LEADER_ROLES.includes(role)&&<select value={branchId} onChange={e=>setBranchId(e.target.value)}><option value="">選擇支部</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>}
      </div>
      <button className="btn primary" disabled={loading} onClick={add}>{loading?'建立中...':'建立'}</button>
    </section>}

    {/* Permission panel */}
    {permsUserId&&(
      <section className="card stack" style={{ border: '2px solid #f9ab00', background: '#fffde7' }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0 }}>🔑 功能權限 — {isMemberPerms ? s.members.find(m=>m.id===permsUserId)?.name : s.users.find(u=>u.id===permsUserId)?.name}</h3>
          <span className="badge gold">暫存編輯模式</span>
        </div>
        <p className="muted">請在下方勾選或取消所需功能，調整完畢後請務必點選底部的「💾 一鍵儲存並寫入授權」。</p>
        <div className="grid">
          {perms.map(f=>(
            <label key={f.feature} style={{display:'flex',alignItems:'center',gap:6, padding: '4px 8px', background: '#fff', borderRadius: '4px', border: '1px solid #ddd'}}>
              <input type="checkbox" checked={f.enabled} onChange={e=>toggleFeatureLocal(f.feature, e.target.checked)} disabled={loading}/>
              <span style={{ fontWeight: f.enabled ? 'bold' : 'normal' }}>{FEATURE_LABELS[f.feature]||f.feature}</span>
              {f.isDefault&&!f.overridden&&<span className="badge blue" style={{fontSize:'0.7em'}}>預設</span>}
              {f.overridden&&<span className="badge gold" style={{fontSize:'0.7em'}}>自訂</span>}
            </label>
          ))}
        </div>
        <div className="row" style={{ marginTop: '1rem', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn" disabled={loading} onClick={()=>setPermsUserId(null)}>取消關閉</button>
          <button className="btn primary" disabled={loading} style={{ background: '#2e7d32', borderColor: '#1b5e20', fontSize: '1rem', padding: '8px 16px' }} onClick={savePermsBatch}>
            {loading ? '⏳ 寫入試算表中...' : '💾 一鍵儲存並批次寫入'}
          </button>
        </div>
      </section>
    )}

    <section className="card">
      <div className="row" style={{marginBottom:'1rem'}}><h3>領袖與管理員</h3></div>
      <table className="table">
        <thead><tr><th>姓名</th><th>Email</th><th>角色</th><th>支部</th><th>狀態</th><th>操作</th></tr></thead>
        <tbody>{filtered.filter(u => u.role !== 'member' && u.role !== 'parent').map(u=>{
          const perm=checkEditPermission(myRole,myBranchId,myUserId,u.role,u.branchId||'',u.id);
          const canChangeRole=perm.canChangeRole&&assignable.includes(u.role);
          const locked=u.techTest||u.role==='troop_super';
          return <tr key={u.id}>
            <td>{u.name}{u.techTest&&<span className="badge blue" style={{marginLeft:4}}>技術</span>}{u.role==='troop_super'&&<span className="badge gold" style={{marginLeft:4}}>超管</span>}</td>
            <td>{u.email||'—'}</td>
            <td>
              {locked && <span className="badge blue">{ROLE_LABEL[u.role as Role]||u.role}</span>}
              {!locked && canChangeRole && <select value={u.role} onChange={e=>changeRole(u.id,e.target.value as Role)} style={{fontSize:"0.9em"}}><option value={u.role}>{ROLE_LABEL[u.role as Role]}</option>{assignable.filter(r=>r!==u.role).map(r=><option key={r} value={r}>{ROLE_LABEL[r as Role]}</option>)}</select>}
              {!locked && !canChangeRole && <span className="badge blue">{ROLE_LABEL[u.role as Role]||u.role}</span>}
            </td>
            <td>{branches.find(b=>b.id===u.branchId)?.short||'-'}</td>
            <td>{u.approved?<span className="badge green">啟用</span>:<span className="badge red">停用</span>}</td>
            <td>
              {perm.canEdit?<>
                {!locked&&<button className="btn" style={{fontSize:'0.8em',marginRight:4}} onClick={()=>openPerms(u.id)}>🔑 權限</button>}
                <button className="btn" style={{fontSize:'0.8em'}} onClick={()=>toggle(u.id)}>{u.approved?'停用':'啟用'}</button>
                <button className="btn" style={{fontSize:'0.8em',marginLeft:4,color:'#d93025'}} onClick={()=>del(u.id,u.name)}>刪除</button>
              </>:<span className="muted" style={{fontSize:'0.8em'}}>無權</span>}
            </td>
          </tr>;
        })}</tbody>
      </table>
    </section>

    {/* Semi-Leaders (Members with specialRole) */}
    {['super_admin','admin','troop_super','group_leader','branch_leader'].includes(myRole) && (
      <section className="card stack">
        <div className="row" style={{marginBottom:'1rem'}}><h3>特別身份成員 (執委/管委)</h3></div>
        <p className="muted">深資、樂行童軍具備特別身份者，可由支部領袖授予特定的管理權限。</p>
        <table className="table">
          <thead><tr><th>姓名</th><th>YMIS</th><th>支部</th><th>特別身份</th><th>操作</th></tr></thead>
          <tbody>{s.members.filter(m => (m.branchId === 'b4' || m.branchId === 'b5') && m.specialRole).map(m => (
            <tr key={m.id}>
              <td>{m.name}</td>
              <td>{m.ymNumber}</td>
              <td>{branches.find(b=>b.id===m.branchId)?.short}</td>
              <td><span className="badge gold">{m.specialRole}</span></td>
              <td>
                <button className="btn" style={{fontSize:'0.8em'}} onClick={() => openPerms(m.id, true)}>🔑 授權</button>
              </td>
            </tr>
          ))}
          {s.members.filter(m => (m.branchId === 'b4' || m.branchId === 'b5') && m.specialRole).length === 0 && <tr><td colSpan={5} className="muted" style={{textAlign:'center'}}>暫無具備特別身份的成員。</td></tr>}
          </tbody>
        </table>
      </section>
    )}

    <section className="card">
      <div className="row" style={{marginBottom:'1rem'}}><h3>家長及一般成員</h3></div>
      <table className="table">
        <thead><tr><th>姓名</th><th>角色</th><th>狀態</th><th>操作</th></tr></thead>
        <tbody>{filtered.filter(u => u.role === 'member' || u.role === 'parent').map(u => (
          <tr key={u.id}>
            <td>{u.name}</td>
            <td>{ROLE_LABEL[u.role]||u.role}</td>
            <td>{u.approved?<span className="badge green">啟用</span>:<span className="badge red">停用</span>}</td>
            <td>
              <button className="btn" style={{fontSize:'0.8em'}} onClick={()=>toggle(u.id)}>{u.approved?'停用':'啟用'}</button>
            </td>
          </tr>
        ))}</tbody>
      </table>
    </section>
  </div>;
}
