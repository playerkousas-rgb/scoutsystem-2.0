import React from 'react';
import { MOCK_CalendarItem } from '../types';

export const CalendarGrid: React.FC<{ items: MOCK_CalendarItem[] }> = ({ items }) => {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff', marginBottom: '16px' }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#0f172a' }}>🗓️ 行事曆預覽</h3>
      <div style={{ display: 'grid', gap: '8px' }}>
        {items.map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '6px', backgroundColor: item.type === 'activity' ? '#f0f9ff' : '#f8fafc', border: `1px solid ${item.type === 'activity' ? '#bae6fd' : '#e2e8f0'}` }}>
            <div>
              <span style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>{item.title}</span>
              <span style={{ marginLeft: '12px', fontSize: '12px', color: '#64748b' }}>📅 {item.date}</span>
            </div>
            <div>
              <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: item.type === 'activity' ? '#0284c7' : '#64748b', color: '#ffffff' }}>
                {item.type === 'activity' ? '特別活動' : '例行集會'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
