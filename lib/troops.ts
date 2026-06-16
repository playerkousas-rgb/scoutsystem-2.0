// ScoutSystem 2.0 已接入旅團登記表
// 由系統管理員維護：旅團提交申請（/onboard）→ 管理員審核 → 在這裡加入
// 用戶只能看到旅團名稱，看不到後台 URL

export type ApprovedTroop = {
  key: string;       // 唯一識別（給前端下拉用）
  id: string;        // 旅團號
  name: string;
  webAppUrl: string;
  status: 'active' | 'testing';
  note?: string;
};

export const APPROVED_TROOPS: ApprovedTroop[] = [
  {
    key: 'troop_0083',
    id: '0083',
    name: '第83旅（測試）',
    webAppUrl: 'https://script.google.com/macros/s/AKfycbwATtCXH8t8bV5VOBVY-ocPJR1RgV4iQebJp_oo_NGV7-90xJZ0d4pAVlFf_f51FHYW/exec',
    status: 'testing',
    note: '測試旅團',
  },
  // 新旅團接入後在這裡加入，格式：
  // { key: 'troop_0084', id: '0084', name: '第84旅', webAppUrl: 'https://script.google.com/...', status: 'active' },
];

export function findTroopByKey(key: string): ApprovedTroop | null {
  return APPROVED_TROOPS.find(t => t.key === key) || null;
}

export function activeTroops(): ApprovedTroop[] {
  return APPROVED_TROOPS.filter(t => t.status === 'active' || t.status === 'testing');
}
