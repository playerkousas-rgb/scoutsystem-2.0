import React from 'react';
import { MOCK_Event, MOCK_Attendance } from '../types';
import { AttendanceCard } from './AttendanceCard';

interface EventCardProps {
  event: MOCK_Event;
  attendanceRecords: MOCK_Attendance[];
}

export const EventCard: React.FC<EventCardProps> = ({ event, attendanceRecords }) => {
  return (
    <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#1e293b' }}>{event.title}</h3>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            📅 日期: {event.date} | 📍 地點: {event.location}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '12px', backgroundColor: '#e2e8f0', color: '#334155', padding: '3px 8px', borderRadius: '4px' }}>
            預算組別: {event.budgetGroup}
          </span>
          {event.patrolId && (
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              負責小隊: {event.patrolId}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#475569' }}>
          📋 出席狀況明細 ({attendanceRecords.length} 筆)
        </h4>
        {attendanceRecords.length > 0 ? (
          attendanceRecords.map(rec => (
            <AttendanceCard key={rec.id} record={rec} />
          ))
        ) : (
          <div style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>尚無出席紀錄</div>
        )}
      </div>
    </div>
  );
};
