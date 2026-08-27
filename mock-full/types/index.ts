export interface MOCK_Member {
  memberId: string;
  name: string;
  branchId: string;
  patrolId: string;
  age: number;
  gender: 'male' | 'female';
  phone: string;
  emergencyContact: string;
  status: 'active' | 'inactive';
}

export interface MOCK_Event {
  id: string;
  title: string;
  date: string;
  location: string;
  budgetGroup: string;
  patrolId?: string;
  fee?: number;
}

export interface MOCK_Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
}

export interface MOCK_Attendance {
  id: string;
  eventId: string;
  memberId: string;
  name: string;
  branchId: string;
  patrolId: string;
  status: 'present' | 'absent' | 'late' | 'excused' | 'sick';
  notes?: string;
}

export interface MOCK_CalendarItem {
  id: string;
  title: string;
  date: string;
  type: 'weekly' | 'activity';
  branchId: string;
  patrolId?: string;
}

export interface MOCK_Stats {
  dailyCount: number;
  cumulativeCount: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  leaveCount: number;
}

export type MOCK_Role = 'scout' | 'patrol_leader' | 'troop_leader' | 'admin';
export type MOCK_PermissionScope = 'read' | 'write' | 'manage' | 'all';
