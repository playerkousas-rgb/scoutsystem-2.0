import { MOCK_Member, MOCK_Event, MOCK_Announcement, MOCK_Attendance, MOCK_CalendarItem } from '../types';

export const MOCK_MEMBERS: MOCK_Member[] = [
  {
    memberId: 'M001',
    name: '張小明',
    branchId: 'B01',
    patrolId: 'P01',
    age: 12,
    gender: 'male',
    phone: '91234567',
    emergencyContact: '98765432',
    status: 'active'
  },
  {
    memberId: 'M002',
    name: '李美麗',
    branchId: 'B01',
    patrolId: 'P01',
    age: 13,
    gender: 'female',
    phone: '92345678',
    emergencyContact: '97654321',
    status: 'active'
  },
  {
    memberId: 'M003',
    name: '王大偉',
    branchId: 'B01',
    patrolId: 'P02',
    age: 12,
    gender: 'male',
    phone: '93456789',
    emergencyContact: '96543210',
    status: 'active'
  },
  {
    memberId: 'M004',
    name: '陳智勇',
    branchId: 'B02',
    patrolId: 'P03',
    age: 15,
    gender: 'male',
    phone: '94567890',
    emergencyContact: '95432109',
    status: 'active'
  },
  {
    memberId: 'M005',
    name: '林欣怡',
    branchId: 'B02',
    patrolId: 'P03',
    age: 14,
    gender: 'female',
    phone: '95678901',
    emergencyContact: '94321098',
    status: 'active'
  },
  {
    memberId: 'M006',
    name: '黃家豪',
    branchId: 'B02',
    patrolId: 'P04',
    age: 16,
    gender: 'male',
    phone: '96789012',
    emergencyContact: '93210987',
    status: 'active'
  }
];

export const MOCK_EVENTS: MOCK_Event[] = [
  {
    id: 'E001',
    title: '春季露營合宿',
    date: '2026-09-15',
    location: '西貢郊野公園',
    budgetGroup: '第一旅童軍組',
    patrolId: 'P01',
    fee: 0
  },
  {
    id: 'E002',
    title: '親子冬季合宿',
    date: '2026-10-20',
    location: '大潭童軍營地',
    budgetGroup: '幼童軍組',
    patrolId: 'P02',
    fee: 0
  },
  {
    id: 'E003',
    title: '急救訓練工作坊',
    date: '2026-11-05',
    location: '總部禮堂',
    budgetGroup: '深資童軍組',
    patrolId: 'P03',
    fee: 0
  }
];

export const MOCK_ANNOUNCEMENTS: MOCK_Announcement[] = [
  {
    id: 'A001',
    title: '2026秋季集會通知',
    content: '本週六集會時間改為下午2時正，請各位童軍準時出席並穿著整齊制服。',
    date: '2026-08-25'
  },
  {
    id: 'A002',
    title: '年度費繳交提醒',
    content: '請各成員於本月底前完成繳交本年度旅費，詳情請聯絡各小隊長。',
    date: '2026-08-20'
  },
  {
    id: 'A003',
    title: '急救證書課程報名',
    content: '急救證書課程現已接受報名，名額有限，先到先得。',
    date: '2026-08-15'
  }
];

export const MOCK_ATTENDANCE: MOCK_Attendance[] = [
  { id: 'AT001', eventId: 'E001', memberId: 'M001', name: '張小明', branchId: 'B01', patrolId: 'P01', status: 'present', notes: '準時到達' },
  { id: 'AT002', eventId: 'E001', memberId: 'M002', name: '李美麗', branchId: 'B01', patrolId: 'P01', status: 'present', notes: '' },
  { id: 'AT003', eventId: 'E001', memberId: 'M003', name: '王大偉', branchId: 'B01', patrolId: 'P02', status: 'excused', notes: '因病请假' },
  { id: 'AT004', eventId: 'E002', memberId: 'M004', name: '陳智勇', branchId: 'B02', patrolId: 'P03', status: 'present', notes: '' },
  { id: 'AT005', eventId: 'E002', memberId: 'M005', name: '林欣怡', branchId: 'B02', patrolId: 'P03', status: 'late', notes: '遲到十五分鐘' },
  { id: 'AT006', eventId: 'E002', memberId: 'M006', name: '黃家豪', branchId: 'B02', patrolId: 'P04', status: 'present', notes: '' },
  { id: 'AT007', eventId: 'E003', memberId: 'M001', name: '張小明', branchId: 'B01', patrolId: 'P01', status: 'sick', notes: '病假' },
  { id: 'AT008', eventId: 'E003', memberId: 'M004', name: '陳智勇', branchId: 'B02', patrolId: 'P03', status: 'present', notes: '擔任助教' }
];

export const MOCK_CALENDAR_ITEMS: MOCK_CalendarItem[] = [
  { id: 'C001', title: '週六常規集會', date: '2026-09-05', type: 'weekly', branchId: 'B01', patrolId: 'P01' },
  { id: 'C002', title: '小隊長會議', date: '2026-09-12', type: 'weekly', branchId: 'B01', patrolId: 'P01' },
  { id: 'C003', title: '春季露營合宿', date: '2026-09-15', type: 'activity', branchId: 'B01', patrolId: 'P01' }
];
