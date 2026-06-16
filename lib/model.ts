export type Role = 'super_admin' | 'admin' | 'group_leader' | 'branch_leader' | 'coach' | 'parent' | 'member' | 'guest';
export type EventKind = 'activity' | 'notice_info' | 'notice_troop_participation';
export type ReplyType = 'interested' | 'registered' | 'declined' | 'unresponded';
export type PluginTier = 2 | 3;

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: '技術測試帳號（權限等同最高）',
  admin: '管理員',
  group_leader: '團長',
  branch_leader: '支部領袖',
  coach: '教練員',
  parent: '家長',
  member: '成員',
  guest: '未登入',
};

export const ROLE_ORDER: Role[] = ['member', 'parent', 'coach', 'branch_leader', 'group_leader', 'admin', 'super_admin'];
export const MANAGER_ROLES: Role[] = ['super_admin', 'admin'];
export const LEADER_ROLES: Role[] = ['group_leader', 'branch_leader', 'coach'];
export const CAN_MARK_LIBRARY: Role[] = ['super_admin', 'admin', 'group_leader', 'branch_leader', 'coach'];

export function isAdmin(role?: Role) { return role === 'super_admin' || role === 'admin'; }
export function isLeaderOrAbove(role?: Role) { return !!role && ['super_admin','admin','group_leader','branch_leader','coach'].includes(role); }
export function canSeeRole(viewer: Role, target: Role) {
  if (viewer === 'super_admin') return true;
  if (viewer === 'admin') return target !== 'super_admin';
  if (viewer === 'group_leader') return ['branch_leader','coach','parent','member'].includes(target);
  if (viewer === 'branch_leader') return ['parent','member'].includes(target);
  if (viewer === 'coach') return target === 'member';
  if (viewer === 'parent') return target === 'member';
  return false;
}
export function roleCanSeePlugin(userRole: Role, minRole: Role) {
  return ROLE_ORDER.indexOf(userRole) >= ROLE_ORDER.indexOf(minRole);
}

export const branches = [
  { id: 'b1', name: '小童軍支部', short: '小童軍' },
  { id: 'b2', name: '幼童軍支部', short: '幼童軍' },
  { id: 'b3', name: '童軍支部', short: '童軍' },
  { id: 'b4', name: '深資童軍支部', short: '深資' },
  { id: 'b5', name: '樂行童軍支部', short: '樂行' },
];

export const patrols = [
  // 小童軍、深資童軍、樂行童軍預設沒有分隊；如個別旅團需要，仍可自行新增。
  // 幼童軍按顏色分隊 / 六。
  { id: 'p1', branchId: 'b2', name: '紅色六', short: '紅', leaderMemberId: '', deputyLeaderMemberId: '', memberIds: [] as string[] },
  { id: 'p2', branchId: 'b2', name: '黃色六', short: '黃', leaderMemberId: '', deputyLeaderMemberId: '', memberIds: [] as string[] },
  { id: 'p3', branchId: 'b2', name: '藍色六', short: '藍', leaderMemberId: '', deputyLeaderMemberId: '', memberIds: [] as string[] },
  { id: 'p4', branchId: 'b2', name: '綠色六', short: '綠', leaderMemberId: '', deputyLeaderMemberId: '', memberIds: [] as string[] },
  // 童軍按動物名稱小隊。
  { id: 'p5', branchId: 'b3', name: '猛虎小隊', short: '虎', leaderMemberId: 'm1', deputyLeaderMemberId: '', memberIds: ['m1'] },
  { id: 'p6', branchId: 'b3', name: '雄鷹小隊', short: '鷹', leaderMemberId: '', deputyLeaderMemberId: '', memberIds: [] as string[] },
  { id: 'p7', branchId: 'b3', name: '灰狼小隊', short: '狼', leaderMemberId: '', deputyLeaderMemberId: '', memberIds: [] as string[] },
];

export const mockStats = { users: 128, pending: 7, activities: 12, notices: 35 };

export const mockChildren = [
  { id: 'm1', name: '小明', branchId: 'b3', patrolId: 'p5', patrolRole: 'leader', age: 13, ymNumber: 'YM001' },
  { id: 'm2', name: '小美', branchId: 'b2', patrolId: 'p1', patrolRole: 'member', age: 10, ymNumber: 'YM002' },
  { id: 'm3', name: '小華', branchId: 'b4', patrolId: '', patrolRole: '', age: 16, ymNumber: 'YM003' },
];

export const mockEvents = [
  { id: 'e1', title: '童軍露營技能訓練日', date: '2026-07-04', branchId: 'b3', scope: 'branch', kind: 'activity' as EventKind, color: 'blue', location: '大潭童軍中心', source: '旅團自辦' },
  { id: 'e2', title: '地域領袖訓練班', date: '2026-07-04', branchId: 'b4', scope: 'branch', kind: 'notice_troop_participation' as EventKind, color: 'purple', location: '地域總部', source: '圖書館轉入 · 旅團參與' },
  { id: 'e3', title: '幼童軍社區服務探訪', date: '2026-07-11', branchId: 'b2', scope: 'branch', kind: 'activity' as EventKind, color: 'blue', location: '社區中心', source: '支部活動' },
  { id: 'e4', title: '全旅周年大會操', date: '2026-08-01', branchId: '', scope: 'troop', kind: 'activity' as EventKind, color: 'blue', location: '操場', source: '全旅活動' },
];

export const mockReplies: Record<string, Record<string, ReplyType>> = {
  m1: { e1: 'registered', e2: 'interested', e4: 'unresponded' },
  m2: { e3: 'declined', e4: 'unresponded' },
  m3: { e2: 'interested', e4: 'unresponded' },
};

export const mockNotices = [
  { id: 'n1', title: '皮藝坊 - 貓頭鷹及小提琴皮革製造', source: '總會', officialDeadline: '2026-06-25', internalDeadline: '2026-06-18', mode: 'informational', branches: ['童軍','深資'], fee: '$150 / $170' },
  { id: 'n2', title: '地域領袖訓練班', source: '地域', officialDeadline: '2026-07-10', internalDeadline: '2026-07-01', mode: 'troop_participation', branches: ['深資','領袖'], fee: '$160' },
  { id: 'n3', title: '森林大冒險填色比賽', source: '區會', officialDeadline: '2026-08-27', internalDeadline: '2026-08-10', mode: 'informational', branches: ['幼童軍'], fee: '免費' },
];

export const plugins = [
  { id: 'troop_lib', title: '旅團圖書館', icon: '📚', tier: 2 as PluginTier, version: '1.0.0', description: '全旅共用的圖書館 / 通告系統，啟用即用。', url: 'https://scout-circulars.vercel.app/', embed: true, available: true, minRole: 'member' as Role },
  { id: 'troop_dbs', title: 'DBS 3.0 徽章系統', icon: '🎖️', tier: 3 as PluginTier, version: '3.0.0', description: '獨立徽章考核系統；每個旅團自部署一份。', url: 'https://dbs-82.vercel.app', embed: false, available: true, minRole: 'member' as Role },
  { id: 'troop_finance', title: '旅團財務管家', icon: '💰', tier: 3 as PluginTier, version: '1.0.0', description: '獨立財務模組，各旅團獨立帳目；未部署時不可安裝。', url: '', embed: false, available: false, minRole: 'group_leader' as Role },
  { id: 'morse_battle', title: '摩斯密碼對戰', icon: '📡', tier: 2 as PluginTier, version: '0.1.0', description: '無後台互動集會工具，可供成員練習及對戰。', url: '/plugins/morse-demo', embed: true, available: true, minRole: 'member' as Role },
];
