'use client';

import React, { useState } from 'react';
import { MOCK_EVENTS, MOCK_ATTENDANCE, MOCK_ANNOUNCEMENTS, MOCK_CALENDAR_ITEMS, MOCK_MEMBERS } from '../data/mock-data';
import { GroupStatsCard } from '../components/GroupStatsCard';
import { EventCard } from '../components/EventCard';
import { AnnouncementCard } from '../components/AnnouncementCard';
import { CalendarGrid } from '../components/CalendarGrid';
import { MemberCard } from '../components/MemberCard';
import { countByStatus } from '../utils/mock-utils';

export default function MockFullPage() {
  const [mode, setMode] = useState<'daily' | 'cumulative'>('daily');
  const [activeTab, setActiveTab] = useState<'events' | 'members' | 'announcements' | 'calendar'>('events');

  const stats = countByStatus(MOCK_ATTENDANCE);
  const totalCount = MOCK_ATTENDANCE.length;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>童軍管理系統 2.0 (MOCK 獨立預覽)</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>
            獨立 MOCK 測試數據環境 | 不連結真實 Google Sheets 或後端 Store
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setMode('daily')}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', backgroundColor: mode === 'daily' ? '#2563eb' : '#fff', color: mode === 'daily' ? '#fff' : '#334155', fontWeight: 600 }}
          >
            當日
          </button>
          <button
            onClick={() => setMode('cumulative')}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', backgroundColor: mode === 'cumulative' ? '#2563eb' : '#fff', color: mode === 'cumulative' ? '#fff' : '#334155', fontWeight: 600 }}
          >
            累計
          </button>
        </div>
      </header>

      {/* Group Stats */}
      <GroupStatsCard
        mode={mode}
        presentCount={stats.present}
        excusedCount={stats.excused}
        registeredCount={stats.registered}
        totalCount={totalCount}
      />

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
        {[
          { id: 'events', label: '📍 現場簽到與點名卡片' },
          { id: 'members', label: '👥 成員名冊' },
          { id: 'announcements', label: '📢 最新通告' },
          { id: 'calendar', label: '🗓️ 行事曆' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #2563eb' : 'none',
              backgroundColor: 'transparent',
              color: activeTab === tab.id ? '#2563eb' : '#64748b',
              fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'events' && (
        <div>
          <h2 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '12px' }}>活動列表及出席狀況</h2>
          {MOCK_EVENTS.map(event => {
            const records = MOCK_ATTENDANCE.filter(a => a.eventId === event.id);
            return <EventCard key={event.id} event={event} attendanceRecords={records} />;
          })}
        </div>
      )}

      {activeTab === 'members' && (
        <div>
          <h2 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '12px' }}>童軍成員名冊 ({MOCK_MEMBERS.length} 人)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {MOCK_MEMBERS.map(member => (
              <MemberCard key={member.memberId} member={member} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'announcements' && (
        <div>
          <h2 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '12px' }}>最新通告</h2>
          {MOCK_ANNOUNCEMENTS.map(announcement => (
            <AnnouncementCard key={announcement.id} announcement={announcement} />
          ))}
        </div>
      )}

      {activeTab === 'calendar' && (
        <div>
          <CalendarGrid items={MOCK_CALENDAR_ITEMS} />
        </div>
      )}

      {/* Action Footer */}
      <div style={{ marginTop: '30px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', color: '#475569' }}>💡 MOCK 數據已導出格式驗證完畢</span>
        <button
          onClick={() => alert('MOCK CSV 已導出')}
          style={{ padding: '8px 16px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
        >
          📥 下載考勤 CSV
        </button>
      </div>
    </div>
  );
}
