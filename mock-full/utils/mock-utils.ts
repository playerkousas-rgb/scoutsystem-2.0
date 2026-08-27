import { MOCK_Attendance } from '../types';

export function filterByBranch<T extends { branchId?: string }>(records: T[], branchId?: string): T[] {
  if (!branchId || branchId === 'all') return records;
  return records.filter(r => r.branchId === branchId);
}

export function countByStatus(records: MOCK_Attendance[]) {
  const counts = { present: 0, absent: 0, late: 0, excused: 0, sick: 0 };
  for (const r of records) {
    if (r.status in counts) {
      counts[r.status]++;
    }
  }
  return counts;
}

export function groupBy<T, K extends keyof T>(records: T[], key: K): Record<string, T[]> {
  return records.reduce((acc, item) => {
    const val = String(item[key] ?? 'other');
    if (!acc[val]) acc[val] = [];
    acc[val].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}
