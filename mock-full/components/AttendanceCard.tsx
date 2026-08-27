import React from 'react';
import { MOCK_Attendance } from '../types';

export const AttendanceCard: React.FC<{ record: MOCK_Attendance }> = ({ record }) => {
  const getBadgeStyle = (status: MOCK_Attendance['status']) => {
    switch (status) {
      case 'present':
        return { bg: '#d1fae5', text: '#065f46', label: '出席' };
      case 'excused':
        return { bg: '#fef3c7', text: '#92400e', label: '請假' };
      case 'registered':
        return { bg: '#e0e7ff', text: '#3730a3', label: '已報名' };
      default:
        return { bg: '#f3f4f6', text: '#374151', label: status };
    }
  };

  const badge = getBadgeStyle(record.status);

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 14px', backgroundColor: '#f8fafc', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px' }}>{record.name}</span>
        <span style={{ marginLeft: '10px', fontSize: '12px', color: '#64748b' }}>
          支部: {record.branchId} | 小隊: {record.patrolId}
        </span>
        {record.notes && (
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>備註: {record.notes}</div>
        )}
      </div>
      <span style={{ backgroundColor: badge.bg, color: badge.text, padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
        {badge.label}
      </span>
    </div>
  );
};
