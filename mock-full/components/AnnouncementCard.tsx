import React from 'react';
import { MOCK_Announcement } from '../types';

export const AnnouncementCard: React.FC<{ announcement: MOCK_Announcement }> = ({ announcement }) => {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 16px', backgroundColor: '#fff', marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>📢 {announcement.title}</h4>
        <span style={{ fontSize: '12px', color: '#64748b' }}>{announcement.date}</span>
      </div>
      <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: '1.5' }}>{announcement.content}</p>
    </div>
  );
};
