import React from 'react';

interface GroupStatsProps {
  mode: 'daily' | 'cumulative';
  presentCount: number;
  absentCount: number;
  lateCount: number;
  leaveCount: number;
  totalCount: number;
}

const statStyle = (backgroundColor: string, borderColor: string) => ({
  backgroundColor,
  padding: '10px',
  borderRadius: '6px',
  border: `1px solid ${borderColor}`,
});

export const GroupStatsCard: React.FC<GroupStatsProps> = ({
  mode,
  presentCount,
  absentCount,
  lateCount,
  leaveCount,
  totalCount,
}) => {
  return (
    <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>
          {mode === 'daily' ? '📊 當日點名統計' : '📈 累計出席統計'}
        </h3>
        <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#e2e8f0', color: '#475569' }}>
          模式: {mode === 'daily' ? '當日' : '累計'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: '12px', textAlign: 'center' }}>
        <div style={statStyle('#f0fdf4', '#bbf7d0')}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#166534' }}>{presentCount}</div>
          <div style={{ fontSize: '12px', color: '#15803d' }}>P 出席</div>
        </div>
        <div style={statStyle('#fef2f2', '#fecaca')}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#991b1b' }}>{absentCount}</div>
          <div style={{ fontSize: '12px', color: '#b91c1c' }}>A 缺席</div>
        </div>
        <div style={statStyle('#fff7ed', '#fed7aa')}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#9a3412' }}>{lateCount}</div>
          <div style={{ fontSize: '12px', color: '#c2410c' }}>L 遲到</div>
        </div>
        <div style={statStyle('#fffbeb', '#fde68a')}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#92400e' }}>{leaveCount}</div>
          <div style={{ fontSize: '12px', color: '#b45309' }}>E／S 請假</div>
        </div>
        <div style={statStyle('#f8fafc', '#e2e8f0')}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#334155' }}>{totalCount}</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>點名紀錄</div>
        </div>
      </div>
    </div>
  );
};
