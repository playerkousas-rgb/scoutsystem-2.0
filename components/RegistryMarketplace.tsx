'use client';
import { useEffect, useMemo, useState } from 'react';
import { ROLE_LABEL, ROLE_ORDER, Role } from '@/lib/model';
import { buildPluginUrl, fetchRegistry, Registry, REGISTRY_URL, resolvePlugins, ResolvedPlugin } from '@/lib/registry';
import { getSession } from '@/lib/session';
import { mutate, addAudit, loadState } from '@/lib/store';

function visibleRolesFromMin(minRole: Role) {
  const idx = ROLE_ORDER.indexOf(minRole);
  return ROLE_ORDER.slice(Math.max(0, idx));
}

export function MarketplacePanel() {
  const [registry, setRegistry] = useState<Registry | null>(null);
  const [fallback, setFallback] = useState('');
  const [unitCode, setUnitCode] = useState('0082');
  const [role, setRole] = useState<Role>('admin');

  useEffect(() => {
    const s = getSession();
    if (s?.troopCode) setUnitCode(s.troopCode);
    if (s?.role) setRole(s.role);
    fetchRegistry().then(r => { setRegistry(r.registry); if (r.fromFallback) setFallback(r.error || '使用內置 fallback'); });
  }, []);

  const list = useMemo(() => registry ? resolvePlugins(registry, unitCode) : [], [registry, unitCode]);

  if (!registry) return <section className="card">載入轉駁器 registry...</section>;

  return <div className="stack">
    <section className="card">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div><strong>Registry：</strong><span className="muted">{REGISTRY_URL}</span></div>
        <span className="badge blue">schema {registry.schema} · {registry.updated}</span>
      </div>
      {fallback && <p className="muted danger">⚠️ 無法即時讀取 registry，暫用 fallback：{fallback}</p>}
      <div className="grid" style={{ marginTop: 12 }}>
        <label>測試旅團碼 u<input value={unitCode} onChange={e=>setUnitCode(e.target.value)} /></label>
        <label>測試角色<select value={role} onChange={e=>setRole(e.target.value as Role)}>{ROLE_ORDER.map(r=><option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></label>
      </div>
    </section>

    <section className="grid-wide">
      {list.map(p => <PluginCard key={p.id} plugin={p} unitCode={unitCode} role={role} />)}
    </section>
  </div>
}

function PluginCard({ plugin, unitCode, role }: { plugin: ResolvedPlugin; unitCode: string; role: Role }) {
  const [minRole, setMinRole] = useState<Role>(plugin.minRole);
  const visible = visibleRolesFromMin(minRole);
  const target = buildPluginUrl(plugin, unitCode, role, plugin.embed);
  return <div className="card stack">
    <div className="row" style={{ justifyContent: 'space-between' }}>
      <span className={`badge ${plugin.tier === 2 ? 'green' : 'purple'}`}>第 {plugin.tier} 級</span>
      <span className={`badge ${plugin.available ? 'blue' : 'red'}`}>{plugin.available ? (plugin.installed ? '已接入 / 可用' : '可安裝') : '需先部署後台'}</span>
    </div>
    <h3>{plugin.icon} {plugin.title}</h3>
    <p className="muted">{plugin.description}</p>
    <p className="muted">id: <code>{plugin.id}</code> · v{plugin.version} · {plugin.embed ? 'iframe 內嵌' : '新分頁'}</p>
    {plugin.tier === 3 && <p className="muted">本旅 endpoint：{plugin.unitEndpoint || '尚未在 units.endpoints 登記'}</p>}
    <label>由上級設定最低可見角色
      <select value={minRole} onChange={e=>setMinRole(e.target.value as Role)}>
        {ROLE_ORDER.map(r=><option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
      </select>
    </label>
    <div className="card" style={{ background: '#f8fbff', boxShadow: 'none' }}>
      <strong>實際可見：</strong> {visible.map(r=>ROLE_LABEL[r]).join('、')}
      <p className="muted" style={{ marginBottom: 0 }}>下級可見時，上級自動可見；例如開放給成員，家長、領袖、團長、管理員亦可見。</p>
    </div>
    <div className="row">
      <button className="btn primary" disabled={!plugin.available} onClick={()=>{ if(!plugin.available)return; const sess=getSession(); mutate(st=>{ if(!st.plugins.find(x=>x.id===plugin.id)){ st.plugins.push({id:plugin.id,title:plugin.title,icon:plugin.icon,tier:plugin.tier,url:plugin.resolvedUrl,embed:plugin.embed,minRole,enabled:true,order:st.plugins.length+1}); addAudit(st,sess?.userId||'demo','installPlugin','Plugins',plugin.id,plugin.title); } }); alert('已加入本旅控制台（沙盤）'); }}>{plugin.available ? '加入本旅控制台' : '不能安裝'}</button>
      {plugin.available && target && <a className="btn" href={target} target={plugin.embed ? '_self' : '_blank'}>測試開啟</a>}
    </div>
    {target && <pre className="code">{target}</pre>}
  </div>
}

export function ConnectorPanel() {
  const [registry, setRegistry] = useState<Registry | null>(null);
  const [unitCode, setUnitCode] = useState('0082');
  const [role, setRole] = useState<Role>('admin');
  useEffect(() => {
    const s = getSession();
    if (s?.troopCode) setUnitCode(s.troopCode);
    if (s?.role) setRole(s.role);
    fetchRegistry().then(r => setRegistry(r.registry));
  }, []);
  const list = useMemo(() => registry ? resolvePlugins(registry, unitCode) : [], [registry, unitCode]);
  return <div className="stack">
    <section className="card row" style={{ justifyContent: 'space-between' }}>
      <div><strong>目前單位：</strong>{unitCode} · <span className="muted">開啟元件會帶 u={unitCode}</span></div>
      <span className="badge gold">Registry Live</span>
    </section>
    <section className="card"><table className="table"><thead><tr><th>元件</th><th>級別</th><th>安裝</th><th>解析 URL</th><th>測試</th></tr></thead><tbody>{list.map(p=>{const url=buildPluginUrl(p,unitCode,role,p.embed);return <tr key={p.id}><td>{p.icon} {p.title}<br/><span className="muted">{p.id}</span></td><td>第 {p.tier} 級</td><td>{p.installed?'✅':'—'} {p.available?'':'需部署'}</td><td style={{maxWidth:360,wordBreak:'break-all'}}>{p.resolvedUrl||'未設定'}</td><td>{url?<a className="btn" href={url} target="_blank">開啟</a>:<span className="badge red">不可用</span>}</td></tr>})}</tbody></table></section>
    <section className="card"><h3>主系統開啟合約</h3><pre className="code">?u={unitCode}&role={role}&from=portal{`&embed=1`}</pre><p className="muted">第 3 級元件真正 URL 由 registry 的 units.endpoints 解析；不把空 URL 寫入卡片。</p></section>
  </div>
}
