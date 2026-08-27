import Link from 'next/link';

/**
 * 獨立的簽到／點名功能卡片。
 *
 * 點名屬於 Tier 3 元件，不與本系統的活動報名及付款對賬共用畫面。
 * 實際點名介面由 troop-attendance 提供，入口頁會帶入目前旅團及使用者身份。
 */
export default function AttendanceCard({ description = '供日常集會及旅團自辦活動記錄 P／A／L／E／S 出席狀態。' }: { description?: string }) {
  return (
    <Link href="/attendance" className="card feature-card attendance-feature-card">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="attendance-feature-icon" aria-hidden="true">📝</span>
        <span className="badge purple">獨立點名元件</span>
      </div>
      <div>
        <h3>簽到／點名</h3>
        <p className="muted">{description}</p>
      </div>
      <span className="btn block">進入點名系統</span>
    </Link>
  );
}
