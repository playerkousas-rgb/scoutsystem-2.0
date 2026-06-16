'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { branches } from '@/lib/model';
import { apiApplyJoin } from '@/lib/api';

type ApplyType = 'parent' | 'leader' | 'member';

export default function Apply() {
  const [troop, setTroop] = useState<any>(null);
  const [type, setType] = useState<ApplyType>('parent');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [branchId, setBranchId] = useState('b3');
  const [ymNumbers, setYmNumbers] = useState('');
  const [experience, setExperience] = useState('');
  const [leaderRole, setLeaderRole] = useState<'group_leader'|'branch_leader'|'coach'>('branch_leader');
  const [memberPw, setMemberPw] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try { setTroop(JSON.parse(localStorage.getItem('scoutsystem2_selected_troop') || 'null')); } catch {}
  }, []);

  const ymisValid = (v:string) => /^\d{10}$/.test(v.trim());
  const ymisError = ymNumbers && !ymisNumbers(ymNumbers).every(ymisValid);

  function ymisNumbers(v:string){return v.split(',').map(s=>s.trim()).filter(Boolean)}

  async function submit() {
    setMsg('');
    if (!troop?.webAppUrl) { setMsg('請先在首頁選擇旅團。'); return; }
    if (!name.trim()) { setMsg('請填姓名。'); return; }
    if (type !== 'member' && !email.trim()) { setMsg('請填 Email。'); return; }
    if (type === 'member' && !ymisValid(ymNumbers)) { setMsg('YMIS 必須是 10 位數字。'); return; }
    if (type === 'parent' && ymisNumbers(ymNumbers).some(v=>!ymisValid(v))) { setMsg('子女 YMIS 必須是 10 位數字（多個用逗號分隔）。'); return; }
    setLoading(true);
    try {
      const role = type === 'parent' ? 'parent' : type === 'leader' ? leaderRole : 'member';
      const result = await apiApplyJoin({
        type, name, email,
        role,
        branchId: type === 'parent' ? '' : branchId,
        ymNumbers: type === 'parent' ? ymNumbers : (type === 'member' ? ymNumbers : ''),
        note: type === 'leader' ? (experience || phone) : (phone || (memberPw ? 'pw:'+memberPw : '')),
      });
      if (result.success) {
        setMsg('✅ 申請已提交！旅團管理員審批後會建立你的帳號。');
        setName(''); setEmail(''); setYmNumbers(''); setPhone(''); setExperience(''); setMemberPw('');
      } else {
        setMsg('❌ ' + (result.error || '提交失敗'));
      }
    } catch (e: any) {
      setMsg('❌ ' + (e?.message || String(e)));
    } finally {
      setLoading(false);
    }
  }

  if (!troop) return (
    <section className="hero">
      <span className="badge red">未選旅團</span>
      <h1>請先選擇旅團</h1>
      <Link className="btn primary" href="/">返回首頁</Link>
    </section>
  );

  return (
    <div className="stack">
      <section className="hero">
        <span className="badge gold">申請帳戶 · {troop.name}</span>
        <h1>申請加入旅團</h1>
        <p>提交申請後，旅團管理員會審批你的帳號。審批通過後即可登入（預設密碼 changeme）。</p>
      </section>

      <section className="card stack">
        <div className="row">
          <button className={`btn ${type === 'parent' ? 'primary' : ''}`} onClick={() => { setType('parent'); setYmNumbers(''); }}>👨‍👩‍👧 家長</button>
          <button className={`btn ${type === 'leader' ? 'primary' : ''}`} onClick={() => setType('leader')}>🧭 領袖</button>
          <button className={`btn ${type === 'member' ? 'primary' : ''}`} onClick={() => setType('member')}>👤 成員</button>
        </div>

        <label>姓名 *
          <input value={name} onChange={e => setName(e.target.value)} placeholder="姓名" />
        </label>

        {type !== 'member' && (
          <label>Email *（審批後用作登入）
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
          </label>
        )}

        <label>聯絡電話
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="91234567" />
        </label>

        {type !== 'parent' && (
          <label>申請加入的支部
            <select value={branchId} onChange={e => setBranchId(e.target.value)}>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
        )}

        {type === 'parent' && (
          <label>子女 YMIS 編號（10位數字，多個用逗號分隔）*
            <input value={ymNumbers} onChange={e => setYmNumbers(e.target.value)} placeholder="1234567890, 9876543210" />
            {ymisError && <span className="badge red" style={{marginTop:4}}>YMIS 必須是 10 位數字</span>}
          </label>
        )}

        {type === 'leader' && (
          <>
            <label>申請的身份
              <select value={leaderRole} onChange={e => setLeaderRole(e.target.value as any)}>
                <option value="group_leader">團長</option>
                <option value="branch_leader">支部領袖</option>
                <option value="coach">教練員</option>
              </select>
            </label>
            <label>相關經驗 / 備註
              <textarea rows={3} value={experience} onChange={e => setExperience(e.target.value)} placeholder="簡述你的童軍經驗或申請原因。" />
            </label>
          </>
        )}

        {type === 'member' && (
          <label>YMIS 編號（10位數字）*
            <input value={ymNumbers} onChange={e => setYmNumbers(e.target.value)} placeholder="1234567890" />
            {ymNumbers && !ymisValid(ymNumbers) && <span className="badge red" style={{marginTop:4}}>必須是 10 位數字</span>}
          </label>
        )}

        <button className="btn primary" disabled={loading} onClick={submit}>
          {loading ? '提交中...' : '提交申請'}
        </button>

        {msg && <p className={`badge ${msg.startsWith('✅') ? 'green' : 'red'}`}>{msg}</p>}
      </section>

      <section className="card">
        <p className="muted">已有帳號？<Link href="/login">前往登入</Link></p>
      </section>
    </div>
  );
}
