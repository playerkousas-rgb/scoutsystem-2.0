import React from 'react';
import { MOCK_Attendance } from '../types';

const STATUS_BADGES: Record<MOCK_Attendance['status'], { bg: string; text: string; label: string; code: string }> = {
  present: { bg: '#d1fae5', text: '#065f46', label: '出席', code: 'P' },
  absent: { bg: '#fee2e2', text: '#991b1b', label: '缺席', code: 'A' },
  late: { bg: '#ffedd5', text: '#9a3412', label: '遲到', code: 'L' },
  excused: { bg: '#fef3c7', text: '#92400e', label: '請假', code: 'E' },
  sick: { bg: '#e0e7ff', text: '#3730a3', label: '病假', code: 'S' },
};

/** 純出席紀錄卡片；報名及付款狀態由「報名管理」負責。 */
export const AttendanceCard: React.FC<{ record: MOCK_Attendance }> = ({ record }) => {
  const badge = STATUS_BADGES[record.status];

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 14px', backgroundColor: '#f8fafc', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
      <div>
        <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px' }}>{record.name}</span>
        <span style={{ marginLeft: '10px', fontSize: '12px', color: '#64748b' }}>
          支部: {record.branchId} | 小隊: {record.patrolId}
        </span>
        {record.notes && (
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>備註: {record.notes}</div>
        )}
      </div>
      <span style={{ backgroundColor: badge.bg, color: badge.text, padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap' }}>
        {badge.code} · {badge.label}
      </span>
    </div>
  );
};
