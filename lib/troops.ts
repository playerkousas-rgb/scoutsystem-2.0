// ScoutSystem 2.0 已接入旅團登記表
// 由系統管理員維護：旅團提交申請（/onboard）→ 管理員審核 → 在這裡加入
// 用戶只能看到旅團名稱，看不到後台 URL

export type ApprovedTroop = {
  id: string;        // 旅團號
  name: string;      // 顯示名稱
  webAppUrl: string;  // Apps Script URL（隱藏，用戶看不到）
  status: 'active' | 'testing';
  note?: string;
};

export const APPROVED_TROOPS: ApprovedTroop[] = [
  {
    id: '0082',
    name: '第82旅',
    webAppUrl: 'https://script.google.com/macros/s/AKfycbypJw25bnKxDwYoSZBTWHjq2BIQ_eC4PVdS1MDSLlT7m6SZRUHX1MihkQcSAO8_Kq2F/exec',
    status: 'testing',
    note: '測試旅團',
  },
  // 新旅團接入後在這裡加入，格式：
  // { id: '0083', name: '第83旅', webAppUrl: 'https://script.google.com/...', status: 'active' },
];

export function findTroop(id: string): ApprovedTroop | null {
  return APPROVED_TROOPS.find(t => t.id === id) || null;
}

export function activeTroops(): ApprovedTroop[] {
  return APPROVED_TROOPS.filter(t => t.status === 'active' || t.status === 'testing');
}
