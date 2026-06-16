'use client';
import { AppState } from './store';
import { Role } from './model';
import { getSession } from './session';

// ==================== 取得旅團後台 URL ====================

export function getWebAppUrl(): string {
  if (typeof window === 'undefined') return '';
  try {
    const troop = JSON.parse(localStorage.getItem('scoutsystem2_selected_troop') || 'null');
    return troop?.webAppUrl || '';
  } catch { return ''; }
}

// ==================== 通用 fetch ====================

function buildUrl(action: string, params?: Record<string, string | undefined>): string {
  const base = getWebAppUrl();
  const url = new URL(base);
  url.searchParams.set('action', action);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

async function apiGet<T = any>(action: string, params?: Record<string, string | undefined>): Promise<T> {
  const res = await fetch(buildUrl(action, params), { cache: 'no-store' });
  const text = await res.text();
  if (!res.ok || /Access Denied|<!doctype html|<html/i.test(text)) {
    throw new Error('Apps Script 未公開或未正確回傳 JSON（請確認 Deploy → Anyone）');
  }
  return JSON.parse(text);
}

function currentUser(): { userId: string; role: Role } | null {
  const s = getSession();
  if (!s) return null;
  return { userId: s.userId, role: s.role };
}

// ==================== 核心 API ====================

/** 讀取 Dashboard（按角色過濾） */
export async function fetchState(): Promise<AppState> {
  const user = currentUser();
  const data = await apiGet<{ success: boolean; state?: AppState; error?: string }>('getDashboard', {
    userId: user?.userId || ''
  });
  if (!data.success || !data.state) throw new Error(data.error || 'getDashboard 失敗');
  return data.state;
}

/** 登入 */
export async function apiLogin(params: {
  identifier: string; password: string; loginType: 'account' | 'member' | 'staffToken';
}) {
  return apiGet('login', {
    identifier: params.identifier,
    password: params.password,
    loginType: params.loginType,
  });
}

/** 測試後台連線 */
export async function apiHealth() {
  return apiGet('health');
}

// ==================== 寫入：通用 mutate ====================

async function apiMutate(action: string, params: Record<string, string | undefined>): Promise<AppState> {
  const user = currentUser();
  const full = { ...params, operatedBy: user?.userId || params.operatedBy || 'system' };
  const data = await apiGet<{ success: boolean; state?: AppState; error?: string }>(action, full);
  if (!data.success || !data.state) throw new Error(data.error || action + ' 失敗');
  return data.state;
}

// ==================== 公開 API（不需登入） ====================

export async function apiApplyJoin(p: { type: string; name: string; email: string; role: string; branchId?: string; ymNumbers?: string; note?: string }) {
  const res = await fetch(buildUrl('applyJoin', p as any), { cache: 'no-store' });
  return res.json();
}

// ==================== 成員 ====================

export function apiCreateMember(p: { name: string; ymNumber: string; branchId: string; patrolId?: string; dateOfBirth?: string; parentUserId?: string; emergencyContactName?: string; emergencyContactPhone?: string; password?: string }) {
  return apiMutate('createMember', p as any);
}
export function apiLinkParent(memberId: string, parentUserId: string) {
  return apiMutate('linkParent', { memberId, parentUserId });
}
export function apiDeleteMember(memberId: string) {
  return apiMutate('deleteMember', { memberId });
}
export function apiUpdateMember(p: Record<string, string>) {
  return apiMutate('updateMember', p);
}

// ==================== 活動 / 報名 ====================

export function apiCreateEvent(p: { title: string; scope?: string; branchId?: string; date?: string; location?: string; kind?: string; status?: string; source?: string; fee?: string; targetMemberIds?: string }) {
  return apiMutate('createEvent', p as any);
}
export function apiPublishEvent(eventId: string) {
  return apiMutate('publishEvent', { eventId });
}
export function apiUpdateEvent(p: { eventId: string; title?: string; date?: string; location?: string; scope?: string; branchId?: string; fee?: string; status?: string }) {
  return apiMutate('updateEvent', p as any);
}
export function apiDeleteEvent(eventId: string) {
  return apiMutate('deleteEvent', { eventId });
}
export function apiSetReply(p: { eventId: string; memberId: string; type: string; parentUserId?: string }) {
  const user = currentUser();
  const operatedBy = user?.role === 'parent' ? 'parent' : user?.role === 'member' ? 'member' : 'leader';
  return apiMutate('setReply', { ...p, operatedBy });
}
export function apiTogglePaid(eventId: string, memberId: string) {
  return apiMutate('togglePaid', { eventId, memberId });
}
export function apiCancelReply(eventId: string, memberId: string) {
  return apiMutate('cancelReply', { eventId, memberId });
}
export async function apiGetRegistrationSummary(eventId: string) {
  return apiGet('getEventRegistrationSummary', { eventId });
}

// ==================== 申請 ====================

export function apiDecideApplication(applicationId: string, status: 'approved' | 'rejected') {
  return apiMutate('decideApplication', { applicationId, status });
}

// ==================== 使用者 ====================

export function apiToggleUser(userId: string) {
  return apiMutate('toggleUser', { userId });
}
export function apiCreateUser(p: { name: string; email: string; password?: string; role: string; branchId?: string }) {
  return apiMutate('createUser', p as any);
}
export function apiUpdateUserRole(userId: string, role: string) {
  return apiMutate('updateUserRole', { userId, role });
}
export function apiDeleteUser(userId: string) {
  return apiMutate('deleteUser', { userId });
}

// ==================== 小隊 / 六 ====================

export function apiCreatePatrol(p: { branchId: string; name: string; short?: string }) {
  return apiMutate('createPatrol', p as any);
}
export function apiTogglePatrol(patrolId: string) {
  return apiMutate('togglePatrol', { patrolId });
}

// ==================== 圖書館標記 ====================

export function apiImportBookmark(p: { title: string; mode: string; source?: string; officialDeadline?: string; internalDeadline?: string; branchTags?: string; fee?: string; date?: string }) {
  return apiMutate('importBookmark', p as any);
}

export function apiDeleteBookmark(bookmarkId: string) {
  return apiMutate('deleteBookmark', { bookmarkId });
}

// ==================== 集會 / 行事曆 ====================

export function apiToggleRegularMeeting(meetingId: string) {
  return apiMutate('toggleRegularMeeting', { meetingId });
}
export function apiCreateRegularMeeting(p: { branchId: string; title: string; weekday: string; startTime: string; endTime: string; location: string }) {
  return apiMutate('createRegularMeeting', p as any);
}
export function apiToggleMeetingCancel(branchId: string, date: string, reason?: string) {
  return apiMutate('toggleMeetingCancel', { branchId, date, reason });
}

// ==================== 設定 ====================

export function apiSaveConfig(key: string, value: string) {
  return apiMutate('saveConfig', { key, value });
}

// ==================== Drive ====================

export async function apiListAnnouncementPdfs() {
  return apiGet('listAnnouncementPdfs');
}
