'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { setSession } from '@/lib/session';
import Link from 'next/link';

type Tab = 'account' | 'member' | 'staffToken';

export default function Login() {
  const router = useRouter();
  const [troop, setTroop] = useState<any>(null);
  const [tab, setTab] = useState<Tab>('account');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { try { setTroop(JSON.parse(localStorage.getItem('scoutsystem2_selected_troop') || 'null')) } catch {} }, []);

  async function submit() {
    setMsg('');
    if (!troop?.webAppUrl) { setMsg('請先在首頁連接旅團。'); return; }
    if (tab === 'staffToken') {
      if (!password) { setMsg('請填 STAFF_TOKEN。'); return; }
    } else {
      if (!identifier.trim()) { setMsg('請填入登入資料。'); return; }
    }
    setLoading(true);
    try {
      const url = new URL(troop.webAppUrl);
      url.searchParams.set('action', 'login');
      if (tab === 'staffToken') {
        url.searchParams.set('identifier', 'STAFF_TOKEN');
        url.searchParams.set('password', password);
        url.searchParams.set('loginType', 'staffToken');
      } else {
        url.searchParams.set('identifier', identifier.trim());
        url.searchParams.set('password', password);
        url.searchParams.set('loginType', tab);
      }
      const res = await fetch(url.toString(), { cache: 'no-store' });
      const text = await res.text();
      if (/Access Denied|<html|<!doctype/i.test(text)) throw new Error('Apps Script Access Denied，請確認 Deploy → Anyone。');
      const data = JSON.parse(text);
      if (!data.success) throw new Error(data.error || '登入失敗');
      const u = data.user;
      setSession({
        userId: u.userId || u.id, name: u.name, role: u.role,
        troopCode: troop.id, troopName: troop.name,
        branchId: u.branchId, memberId: u.memberId, age: u.age
      });
      router.push(u.dashboard || (u.role === 'parent' ? '/parent' : u.role === 'member' ? '/member' : u.role === 'admin' || u.role === 'super_admin' ? '/admin' : '/leader'));
    } catch (e: any) {
      setMsg('❌ ' + (e?.message || String(e)));
    } finally {
      setLoading(false);
    }
  }

  if (!troop) return (
    <section className="hero">
      <span className="badge red">未選旅團</span>
      <h1>請先連接旅團</h1>
      <p>實測模式需要先在首頁填入 Apps Script URL。</p>
      <Link className="btn primary" href="/">返回首頁</Link>
    </section>
  );

  return (
    <div className="stack">
      <section className="hero">
        <span className="badge gold">登入 {troop.name}</span>
        <h1>登入旅團</h1>
        <p>領袖 / 家長 / 管理員用 Email + 密碼。成員用 YMIS 10位數字。首次管理員可用 STAFF_TOKEN。</p>
        <Link className="btn" href="/apply">未有帳號？申請加入</Link>
      </section>
      <section className="card stack">
        <div className="row">
          <button className={`btn ${tab === 'account' ? 'primary' : ''}`} onClick={() => { setTab('account'); setIdentifier(''); setPassword(''); }}>領袖及家長</button>
          <button className={`btn ${tab === 'member' ? 'primary' : ''}`} onClick={() => { setTab('member'); setIdentifier(''); setPassword(''); }}>成員 YMIS</button>
          <button className={`btn ${tab === 'staffToken' ? 'primary' : ''}`} onClick={() => { setTab('staffToken'); setIdentifier(''); setPassword(''); }}>STAFF_TOKEN</button>
        </div>

        {tab === 'staffToken' ? (
          <label>STAFF_TOKEN（在 Sheet SystemConfig 找到）
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="sk_xxxxxxxx" />
          </label>
        ) : (
          <>
            <label>{tab === 'member' ? 'YMIS 成員編號（10位數字）' : 'Email / User ID'}
              <input value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder={tab === 'member' ? '1234567890' : 'admin@example.com'} />
            </label>
            {tab === 'account' && (
              <label>密碼
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="密碼" />
              </label>
            )}
          </>
        )}

        <button className="btn primary" disabled={loading} onClick={submit}>{loading ? '登入中...' : '登入'}</button>
        {msg && <p className="badge red">{msg}</p>}
      </section>
      <p className="muted" style={{ textAlign: 'center' }}>技術測試帳號 sheep / 0728 也可在「領袖及家長」欄直接登入。</p>
    </div>
  );
}
