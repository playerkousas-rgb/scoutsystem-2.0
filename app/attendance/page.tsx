'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Auth from '@/components/Auth';
import { AppState, loadState } from '@/lib/store';
import { Role } from '@/lib/model';
import { getSession, Session } from '@/lib/session';

const ATTENDANCE_APP_URL = 'https://troop-attendance.vercel.app/';
const LEADER_ROLES: Role[] = ['super_admin', 'troop_super', 'admin', 'group_leader', 'branch_leader', 'coach'];

function normalizedUnitCode(code: string) {
  const trimmed = code.trim();
  if (!/^\d+$/.test(trimmed)) return trimmed;
  return trimmed.replace(/^0+(?=\d)/, '');
}

function attendanceRole(role: Role) {
  if (role === 'member' || role === 'parent') return role;
  if (role === 'admin' || role === 'super_admin' || role === 'troop_super') return 'admin';
  return 'leader';
}

function memberYmis(session: Session, state: AppState | null) {
  if (session.role !== 'member') return session.memberId || session.userId;
  const member = state?.members.find(item => item.id === session.memberId || item.id === session.userId);
  return member?.ymNumber || session.memberId || session.userId;
}

export default function AttendancePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<AppState | null>(null);
  const [stateReady, setStateReady] = useState(false);

  useEffect(() => {
    const current = getSession();
    setSession(current);
    if (!current) {
      setStateReady(true);
      return;
    }
    loadState()
      .then(setState)
      .catch(() => {
        // 點名元件有自己的旅團後端；主系統狀態暫時讀不到時仍可開啟。
      })
      .finally(() => setStateReady(true));
  }, []);

  const attendanceUrl = useMemo(() => {
    if (!session || !stateReady) return '';
    const params = new URLSearchParams({
      u: normalizedUnitCode(session.troopCode),
      role: attendanceRole(session.role),
      ymis: memberYmis(session, state),
      name: session.name,
      from: 'portal',
      embed: '1',
    });
    return `${ATTENDANCE_APP_URL}?${params.toString()}`;
  }, [session, state, stateReady]);

  const dashboardHref = session?.role === 'member'
    ? '/member'
    : session?.role === 'parent'
      ? '/parent'
      : session && LEADER_ROLES.includes(session.role)
        ? (['super_admin', 'troop_super', 'admin'].includes(session.role) ? '/admin' : '/leader')
        : '/';

  return (
    <Auth roles={['super_admin', 'troop_super', 'admin', 'group_leader', 'branch_leader', 'coach', 'member']}>
      <div className="stack">
        <section className="hero attendance-hero">
          <span className="badge purple">Tier 3 獨立元件</span>
          <h1>📝 簽到／點名</h1>
          <p>供領袖處理日常集會及旅團自己舉辦活動的出席紀錄。點名資料及流程與活動報名管理完全分開。</p>
          <div className="row">
            <Link className="btn" href={dashboardHref}>← 返回控制台</Link>
            {session && LEADER_ROLES.includes(session.role) && (
              <Link className="btn gold" href="/admin/registrations">📋 前往報名管理</Link>
            )}
            {attendanceUrl && (
              <a className="btn primary" href={attendanceUrl.replace('embed=1', 'embed=0')} target="_blank" rel="noopener noreferrer">
                在新視窗開啟
              </a>
            )}
          </div>
        </section>

        <section className="grid attendance-separation-grid" aria-label="功能分流說明">
          <div className="card attendance-purpose-card attendance-purpose-card--checkin">
            <span className="badge green">本頁功能</span>
            <h3>📝 簽到／點名</h3>
            <p className="muted">日常集會、恆常集會，以及由旅團自己舉辦的活動。領袖以 P／A／L／E／S 記錄實際出席。</p>
          </div>
          <div className="card attendance-purpose-card attendance-purpose-card--registration">
            <span className="badge blue">另一獨立功能</span>
            <h3>📋 報名管理</h3>
            <p className="muted">旅團舉辦及外間活動的報名回覆、付款狀態、分層統計及名單匯出。</p>
          </div>
        </section>

        <section className="card stack attendance-frame-card">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ marginBottom: 4 }}>集會點名系統</h2>
              <p className="muted" style={{ margin: 0 }}>已帶入目前旅團及登入身份；不會把主系統的報名或付款狀態混入點名紀錄。</p>
            </div>
            <span className="badge purple">troop-attendance</span>
          </div>

          {!stateReady && <div className="attendance-frame-loading">正在準備點名元件...</div>}
          {stateReady && attendanceUrl && (
            <iframe
              className="attendance-frame"
              src={attendanceUrl}
              title="旅團集會簽到及點名系統"
              allow="clipboard-write"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          )}
        </section>
      </div>
    </Auth>
  );
}
