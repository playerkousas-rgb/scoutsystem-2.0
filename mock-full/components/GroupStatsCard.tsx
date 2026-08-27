import React from 'react';

interface GroupStatsProps {
  mode: 'daily' | 'cumulative';
  presentCount: number;
  excusedCount: number;
  registeredCount: number;
  totalCount: number;
}

export const GroupStatsCard: React.FC<GroupStatsProps> = ({
  mode,
  presentCount,
  excusedCount,
  registeredCount,
  totalCount
}) => {
  return (
    <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>
          {mode === 'daily' ? '📊 當日出席統計' : '📈 累計出席統計'}
        </h3>
        <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#e2e8f0', color: '#475569' }}>
          模式: {mode === 'daily' ? '當日' : '累計'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', textAlign: 'center' }}>
        <div style={{ backgroundColor: '#f0fdf4', padding: '10px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#166534' }}>{presentCount}</div>
          <div style={{ fontSize: '12px', color: '#15803d' }}>出席人数</div>
        </div>

        <div style={{ backgroundColor: '#fffbeb', padding: '10px', borderRadius: '6px', border: '1px solid #fde68a' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#92400e' }}>{excusedCount}</div>
          <div style={{ fontSize: '12px', color: '#b45309' }}>請假人數</div>
        </div>

        <div style={{ backgroundColor: '#eef2ff', padding: '10px', borderRadius: '6px', border: '1px solid #c7d2fe' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3730a3' }}>{registeredCount}</div>
          <div style={{ fontSize: '12px', color: '#4338ca' }}>已報名人數</div>
        </div>

        <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#334155' }}>{totalCount}</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>總記錄筆數</div>
        </div>
      </div>
    </div>
  );
};
