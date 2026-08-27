import React from 'react';
import { MOCK_Member } from '../types';

export const MemberCard: React.FC<{ member: MOCK_Member }> = ({ member }) => {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px', backgroundColor: '#fff', marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{member.name} ({member.memberId})</h4>
        <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', backgroundColor: member.status === 'active' ? '#dcfce7' : '#f3f4f6', color: member.status === 'active' ? '#166534' : '#374151' }}>
          {member.status === 'active' ? '使用中' : '已停用'}
        </span>
      </div>
      <div style={{ fontSize: '14px', color: '#4b5563', marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
        <div>支部: {member.branchId}</div>
        <div>小隊: {member.patrolId}</div>
        <div>電話: {member.phone}</div>
        <div>緊急聯絡: {member.emergencyContact}</div>
      </div>
    </div>
  );
};
