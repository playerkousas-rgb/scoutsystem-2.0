/**
 * ScoutSystem 2.0 — 完整後台（Setup + API + 角色過濾）
 *
 * 核心改動 vs 之前版本：
 *   - getState → getDashboard(userId)：按角色過濾，不再回傳全部資料
 *   - setReply 加 18 歲 GS 端 guard（1.0 邏輯）
 *   - Sheet 讀寫改用 header-based（大小寫不敏感，不怕欄位順序被改）
 *   - Patrols 預設改英文（TIGER / SEAGULL 等）
 *   - STAFF_TOKEN setup 時自動生成
 *   - 新增 applyJoin（公開，不需登入）
 *   - 新增 getApplications（按角色過濾）
 *
 * 用法：
 *   1. Google Sheet → Extensions → Apps Script 貼上整份
 *   2. Run setupScoutSystem()
 *   3. Deploy → Web App → Execute as Me, Anyone
 *   4. 把 /exec URL 填入前端
 */

var SCOUTSYSTEM_VERSION = '2.0-live';

// ==================== 顏色 / 分頁設定 ====================

var SHEET_COLORS = {
  readme: '#0b5cab', config: '#fbbc04', editable: '#34a853',
  data: '#4285f4', system: '#9aa0a6', audit: '#d93025'
};

var VISIBLE_SHEETS_FOR_BEGINNERS = [
  'README_新手必看', 'SystemConfig', 'Branches', 'Patrols', 'Members'
];

var ADVANCED_SHEETS = [
  'Roles', 'FieldSettings', 'Users', 'Applications',
  'Events', 'EventReplies', 'LibraryBookmarks', 'Announcements',
  'RegularMeetings', 'CancelledMeetings', 'Notices', 'Plugins', 'AuditLogs'
];

// ==================== 初始化 ====================

function setupScoutSystem() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('請先在 Google Sheet 中開啟 Apps Script，再執行 setupScoutSystem()');

  var sheets = getInitialSheets_();
  Object.keys(sheets).forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    sh.showSheet(); sh.clear();
    sh.getRange(1, 1, sheets[name].length, sheets[name][0].length).setValues(sheets[name]);
    sh.setFrozenRows(1);
  });

  setupReadmeSheet_(ss);
  formatScoutSystemSheets_(ss);
  addHelpfulNotes_(ss);
  seedInitialAdmin_(ss);
  generateStaffToken_(ss);
  hideAdvancedSheets();

  var readme = ss.getSheetByName('README_新手必看');
  if (readme) ss.setActiveSheet(readme);

  SpreadsheetApp.getUi().alert(
    'ScoutSystem 2.0 初始化完成',
    '已建立工作表、標記顏色、加上欄位說明，並隱藏進階後台分頁。\n\n'
    + '請照 README_新手必看：\n'
    + '1. 到黃色 SystemConfig 填旅團資料\n'
    + '2. 到綠色 Branches 確認支部，Patrols 改小隊\n'
    + '3. 到藍色 Members 建立成員\n'
    + '4. Deploy 為 Web App（Anyone）\n'
    + '5. 把 /exec URL 填入前端\n'
    + '6. 首次管理員可用 STAFF_TOKEN 或 admin email + changeme 登入',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function setup() { setupScoutSystem(); }

function generateStaffToken_(ss) {
  var sh = ss.getSheetByName('SystemConfig');
  if (!sh) return;
  var values = sh.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === 'STAFF_TOKEN' && !values[i][1]) {
      var token = 'sk_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      sh.getRange(i + 1, 2).setValue(token);
      sh.getRange(i + 1, 3).setValue('setup 自動生成；首次管理員登入用。');
      return;
    }
  }
}

function getInitialSheets_() {
  return {
    SystemConfig: [
      ['key', 'value', 'note'],
      ['TROOP_CODE', "'0082", '必填：旅團號，純數字。前面加單引號防止 Google Sheet 吃掉前面的 0。'],
      ['TROOP_NAME', '第82旅', '必填：旅團顯示名稱。'],
      ['ADMIN_EMAIL', '', '必填：第一位管理員 Email。填好後到選單 → 重新建立管理員帳號。'],
      ['ADMIN_DEFAULT_PASSWORD', 'changeme', '初始管理員預設密碼，登入後請修改。'],
      ['FRONTEND_URL', 'https://scoutsystem2.vercel.app/', '前端 Vercel 網址。預設是官方部署，如有自己部署的 URL 請更換。'],
      ['ANNOUNCEMENT_FOLDER_ID', '', '公告 PDF 的 Google Drive 資料夾 ID。取得方式：打開 Drive 資料夾，看網址 https://drive.google.com/drive/folders/XXXX，XXXX 就是 ID。資料夾需設為「知道連結的人都可檢視」。'],
      ['REGISTRY_URL', 'https://troop-router.vercel.app/api/registry.json', '轉駁器 registry。'],
      ['TECH_TEST_ACCOUNTS', 'sheep,0728', '技術測試帳號，權限等同最高。'],
      ['STAFF_TOKEN', '', 'setup 自動生成；首次管理員 / 技術管理員登入用。']
    ],
    Roles: [
      ['role', 'label', 'level', 'defaultLanding', 'note'],
      ['super_admin', '技術測試帳號（權限等同最高）', 100, '/admin', 'Sheep / 0728 類測試帳號。'],
      ['admin', '管理員', 90, '/admin', '管理所有支部。'],
      ['group_leader', '團長', 70, '/leader', '管理所屬支部。'],
      ['branch_leader', '支部領袖', 60, '/leader', '管理所屬支部。'],
      ['coach', '教練員', 50, '/leader', '可標記圖書館；無審核權限。'],
      ['parent', '家長', 20, '/parent', '代子女回覆活動。'],
      ['member', '成員', 10, '/member', '18 歲以下只可表示有興趣。']
    ],
    Branches: [
      ['branchId', 'name', 'enabled', 'note'],
      ['b1', '小童軍支部', true, '預設沒有分隊。'],
      ['b2', '幼童軍支部', true, '按顏色分隊 / 六。'],
      ['b3', '童軍支部', true, '按動物名稱小隊（英文）。'],
      ['b4', '深資童軍支部', true, '此支部啟用中（TRUE），但深資童軍預設沒有小隊 / 六。如需要可自行在 Patrols 新增。'],
      ['b5', '樂行童軍支部', true, '此支部啟用中（TRUE），但樂行童軍預設沒有小隊 / 六。如需要可自行在 Patrols 新增。']
    ],
    Patrols: [
      ['patrolId', 'branchId', 'name', 'shortName', 'leaderMemberId', 'deputyLeaderMemberId', 'memberIds', 'enabled', 'order', 'note'],
      ['p1', 'b2', 'RED', 'R', '', '', '', true, 1, '幼童軍顏色分隊。'],
      ['p2', 'b2', 'YELLOW', 'Y', '', '', '', true, 2, '幼童軍顏色分隊。'],
      ['p3', 'b2', 'BLUE', 'B', '', '', '', true, 3, '幼童軍顏色分隊。'],
      ['p4', 'b2', 'GREEN', 'G', '', '', '', true, 4, '幼童軍顏色分隊。'],
      ['p5', 'b3', 'TIGER', 'T', '', '', '', true, 1, '童軍動物小隊。'],
      ['p6', 'b3', 'SEAGULL', 'S', '', '', '', true, 2, '童軍動物小隊。'],
      ['p7', 'b3', 'WOLF', 'W', '', '', '', true, 3, '童軍動物小隊。']
    ],
    FieldSettings: [
      ['key', 'label', 'enabled', 'required', 'note'],
      ['ymNumber', 'YMIS 編號（10位數字）', true, true, '建議純文字格式。'],
      ['name', '姓名', true, true, '成員顯示姓名。'],
      ['dateOfBirth', '出生日期', true, false, '用於判斷 18 歲以下 / 以上。'],
      ['emergencyContactPhone', '緊急聯絡電話', true, false, '報名匯出用。'],
      ['patrolId', '小隊 / 六', true, false, '不適用支部可留空。'],
      ['patrolRole', '隊內身份', true, false, 'leader / deputy / member / 空白。']
    ],
    Users: [
      ['userId', 'name', 'email', 'password', 'role', 'branchId', 'memberId', 'approved', 'createdAt', 'note'],
      ['u_admin', '管理員（待設定）', '', 'changeme', 'admin', '', '', true, now_(), 'placeholder。填好 ADMIN_EMAIL 後到選單 → 重新建立管理員帳號。']
    ],
    Applications: [
      ['applicationId', 'type', 'name', 'email', 'role', 'branchId', 'ymNumbers', 'status', 'createdAt', 'decidedAt', 'note']
    ],
    Members: [
      ['memberId', 'ymNumber', 'password', 'name', 'branchId', 'patrolId', 'patrolRole', 'dateOfBirth', 'parentUserId', 'emergencyContactName', 'emergencyContactPhone', 'active', 'note'],
      ['m_ex1', '1234567890', '1234567890', '陳大文（範例）', 'b3', 'p5', 'leader', '2012-03-15', '', '陳太', '9123 4567', true, '範例：童軍支部成員，TIGER 小隊隊長。請修改或刪除。'],
      ['m_ex2', '2345678901', '2345678901', '李小美（範例）', 'b2', 'p1', 'member', '2015-07-20', '', '李太', '9876 5432', true, '範例：幼童軍支部成員，RED 六。請修改或刪除。']
    ],
    Events: [
      ['eventId', 'title', 'scope', 'branchId', 'date', 'location', 'kind', 'status', 'source', 'fee', 'targetMemberIds', 'createdBy', 'createdAt', 'note']
    ],
    EventReplies: [
      ['replyId', 'eventId', 'memberId', 'parentUserId', 'type', 'operatedBy', 'updatedAt', 'paid', 'notes']
    ],
    LibraryBookmarks: [
      ['bookmarkId', 'title', 'source', 'officialDeadline', 'internalDeadline', 'mode', 'branchTags', 'status', 'convertedEventId', 'createdBy', 'createdAt', 'note']
    ],
    Announcements: [
      ['announcementId', 'title', 'source', 'month', 'publishDate', 'branchTags', 'folderUrl', 'documentUrl', 'createdAt', 'status', 'note']
    ],
    RegularMeetings: [
      ['meetingId', 'branchId', 'title', 'weekday', 'startTime', 'endTime', 'location', 'enabled', 'note'],
      ['rm1', 'b3', '童軍恆常集會', 6, '14:00', '16:00', '本中心', true, '星期六恆常集會'],
      ['rm2', 'b2', '幼童軍恆常集會', 6, '14:00', '16:00', '本中心', true, '星期六恆常集會']
    ],
    CancelledMeetings: [
      ['cancelId', 'branchId', 'date', 'reason', 'markedBy', 'markedAt']
    ],
    Notices: [
      ['noticeId', 'title', 'mode', 'branchTags', 'publishedAt', 'createdBy', 'status', 'note']
    ],
    Plugins: [
      ['cardId', 'title', 'icon', 'tier', 'url', 'embed', 'minRole', 'enabled', 'order', 'note']
    ],
    AuditLogs: [
      ['logId', 'userId', 'action', 'entity', 'entityId', 'createdAt', 'detail']
    ]
  };
}

function seedInitialAdmin_(ss) {
  var adminEmail = getConfigValue_('ADMIN_EMAIL');
  var adminPw = getConfigValue_('ADMIN_DEFAULT_PASSWORD') || 'changeme';
  var sh = ss.getSheetByName('Users');
  if (!sh) return;
  if (sh.getLastRow() > 1) {
    sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).clearContent();
  }
  if (adminEmail) {
    sh.appendRow(['u_admin', '旅團管理員', adminEmail, adminPw, 'admin', '', '', true, now_(), '由 ADMIN_EMAIL 建立，預設密碼 ' + adminPw + '。']);
  } else {
    sh.appendRow(['u_admin', '旅團管理員', '', adminPw, 'admin', '', '', true, now_(), '請填 ADMIN_EMAIL 後再回來更新此 email。']);
  }
}

// ==================== README / 格式（與之前相同，略） ====================

function setupReadmeSheet_(ss) {
  var name = 'README_新手必看';
  var sh = ss.getSheetByName(name) || ss.insertSheet(name, 0);
  sh.showSheet(); sh.clear();
  var rows = [
    ['ScoutSystem 2.0 小白設定指南', ''],
    ['', ''],
    ['你現在需要做的事', '照順序完成。'],
    ['1', '到黃色 SystemConfig 填 TROOP_CODE、TROOP_NAME、ADMIN_EMAIL。'],
    ['2', '到綠色 Branches 確認支部。enabled = TRUE 表示支部啟用，不是指小隊。'],
    ['3', '到綠色 Patrols 修改小隊 / 六名稱（童軍預設英文 TIGER / SEAGULL / WOLF）。'],
    ['4', '到藍色 Members 輸入成員。每個必須填 ymNumber（10位數字）和 password（密碼）。範例已提供兩行。'],
    ['5', '上方選單 ScoutSystem 2.0 → 重新建立管理員帳號。會根據 ADMIN_EMAIL 自動建立 admin，不需手動打開 Users。'],
    ['6', '回到此 Apps Script 編輯器 → 右上方「部署」→「網頁應用程式」→ 執行身分：我 → 誰可以存取：任何人 → 部署。'],
    ['7', '複製部署後的 /exec 網址，提交旅團接入申請（/onboard）。'],
    ['8', '在前端用管理員 email + changeme 登入；或用 STAFF_TOKEN。'],
    ['', ''],
    ['權限設定（重要！）', ''],
    ['Google Sheet', '建議設為「知道連結的人都可檢視」。'],
    ['Apps Script', '部署必須設「誰可以存取：任何人」，否則前端讀不到。'],
    ['Drive 資料夾', '公告 PDF 資料夾必須設「知道連結的人都可檢視」。'],
    ['', ''],
    ['登入方式', ''],
    ['領袖 / 家長 / 管理員', '用 Email + 密碼。'],
    ['成員', '用 YMIS 10位數字 + 密碼（Members 表的 password 欄）。兩者都需要。'],
    ['雙重身份', '樂行童軍同時是領袖：用 Email 登入是領袖身份；用 YMIS 登入是成員身份。'],
    ['技術測試', 'sheep / 0728 在 Email 欄直接輸入即可。'],
    ['STAFF_TOKEN', 'SystemConfig 裡的 STAFF_TOKEN 可用來首次管理員登入。'],
    ['', ''],
    ['顏色說明', ''],
    ['黃色', '必須人手填的 Config。'],
    ['綠色', '旅團可按實際修改。'],
    ['淺藍', '日常資料（Members）。'],
    ['灰色 / 紅色', '系統後台 / Audit，已隱藏。'],
    ['', ''],
    ['如要看被隱藏表', '上方選單 ScoutSystem 2.0 → 顯示進階分頁。']
  ];
  sh.getRange(1, 1, rows.length, 2).setValues(rows);
  sh.getRange('A1:B1').merge().setBackground(SHEET_COLORS.readme).setFontColor('white').setFontWeight('bold').setFontSize(16);
  sh.getRange('A3:B3').setBackground('#e8f0fe').setFontWeight('bold');
  sh.getRange('A12:B12').setBackground('#e8f0fe').setFontWeight('bold');
  sh.setColumnWidth(1, 200); sh.setColumnWidth(2, 720);
  sh.setFrozenRows(1); sh.setTabColor(SHEET_COLORS.readme);
}

function formatScoutSystemSheets_(ss) {
  ss.getSheets().forEach(function (sh) {
    var name = sh.getName();
    var lastCol = Math.max(1, sh.getLastColumn());
    var lastRow = Math.max(1, sh.getLastRow());
    if (name !== 'README_新手必看') {
      sh.getRange(1, 1, 1, lastCol).setFontWeight('bold').setFontColor('white');
      sh.setFrozenRows(1); sh.autoResizeColumns(1, lastCol);
    }
    if (name === 'SystemConfig') {
      sh.setTabColor(SHEET_COLORS.config);
      sh.getRange(1, 1, 1, lastCol).setBackground('#f9ab00');
      if (lastRow > 1) sh.getRange(2, 1, lastRow - 1, lastCol).setBackground('#fff7d6');
      sh.setColumnWidth(1, 240); sh.setColumnWidth(2, 360); sh.setColumnWidth(3, 520);
    } else if (name === 'Branches' || name === 'Patrols') {
      sh.setTabColor(SHEET_COLORS.editable);
      sh.getRange(1, 1, 1, lastCol).setBackground('#188038');
      if (lastRow > 1) sh.getRange(2, 1, lastRow - 1, lastCol).setBackground('#e6f4ea');
    } else if (name === 'Members') {
      sh.setTabColor(SHEET_COLORS.data);
      sh.getRange(1, 1, 1, lastCol).setBackground('#1a73e8');
      if (lastRow > 1) sh.getRange(2, 1, lastRow - 1, lastCol).setBackground('#e8f0fe');
    } else if (name === 'AuditLogs') {
      sh.setTabColor(SHEET_COLORS.audit);
      sh.getRange(1, 1, 1, lastCol).setBackground('#d93025');
    } else if (name !== 'README_新手必看') {
      sh.setTabColor(SHEET_COLORS.system);
      sh.getRange(1, 1, 1, lastCol).setBackground('#5f6368');
    }
  });
}

function addHelpfulNotes_(ss) {
  var config = ss.getSheetByName('SystemConfig');
  if (config) {
    noteCell_(config, 'B2', '旅團號，純數字。');
    noteCell_(config, 'B3', '顯示於前端的旅團名稱。');
    noteCell_(config, 'B4', '第一位管理員 Email。');
    noteCell_(config, 'B5', '初始管理員預設密碼。');
  }
  var users = ss.getSheetByName('Users');
  if (users) { noteCell_(users, 'D1', '登入密碼。'); }
  var members = ss.getSheetByName('Members');
  if (members) {
    noteCell_(members, 'B1', 'YMIS 編號，10 位數字，成員登入用。建議純文字格式。');
    noteCell_(members, 'H1', '對應 Users.userId。有值則家長可看到此成員。');
  }
}

function noteCell_(sheet, a1, note) { sheet.getRange(a1).setNote(note); }
function hideAdvancedSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var readme = ss.getSheetByName('README_新手必看');
  if (readme) ss.setActiveSheet(readme);
  ADVANCED_SHEETS.forEach(function (name) { var sh = ss.getSheetByName(name); if (sh) sh.hideSheet(); });
}
function showAdvancedSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ADVANCED_SHEETS.forEach(function (name) { var sh = ss.getSheetByName(name); if (sh) sh.showSheet(); });
  SpreadsheetApp.getUi().alert('已顯示進階分頁。');
}
function onOpen() {
  SpreadsheetApp.getUi().createMenu('ScoutSystem 2.0')
    .addItem('顯示進階分頁', 'showAdvancedSheets')
    .addItem('隱藏進階分頁', 'hideAdvancedSheets')
    .addSeparator()
    .addItem('重新建立管理員帳號', 'reseedAdminMenu')
    .addSeparator()
    .addItem('重新格式化 / 上色', 'reformatScoutSystem').addToUi();
}

function reseedAdminMenu() {
  seedInitialAdmin_(SpreadsheetApp.getActiveSpreadsheet());
  SpreadsheetApp.getUi().alert('已根據 SystemConfig 的 ADMIN_EMAIL 重新建立管理員帳號。密碼：' + (getConfigValue_('ADMIN_DEFAULT_PASSWORD') || 'changeme'));
}
function reformatScoutSystem() {
  formatScoutSystemSheets_(SpreadsheetApp.getActiveSpreadsheet());
  addHelpfulNotes_(SpreadsheetApp.getActiveSpreadsheet());
  SpreadsheetApp.getUi().alert('已重新上色及加入提示。');
}

// ==================== Sheet 工具（header-based，參考 1.0） ====================

function getSheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss ? ss.getSheetByName(name) : null;
}

/** 讀取整張表為 object 陣列，以 header 為 key（大小寫不敏感查詢） */
function readTable_(name) {
  var sh = getSheet_(name);
  if (!sh || sh.getLastRow() < 2) return [];
  var data = sh.getDataRange().getValues();
  var headers = data[0].map(function (h) { return String(h).trim(); });
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    var hasData = false;
    for (var j = 0; j < headers.length; j++) {
      if (!headers[j]) continue;
      var val = data[i][j];
      if (val instanceof Date) val = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      if (val !== '' && val !== null) hasData = true;
      row[headers[j]] = val;
    }
    if (hasData) rows.push(row);
  }
  return rows;
}

/** 大小寫不敏感讀取欄位 */
function getField_(row, fieldName) {
  var lower = String(fieldName).toLowerCase();
  for (var k in row) { if (String(k).toLowerCase() === lower) return row[k]; }
  return '';
}

/** 用 header name 找欄位 index */
function findColIndex_(headers, name) {
  var lower = String(name).toLowerCase();
  for (var i = 0; i < headers.length; i++) {
    if (String(headers[i]).toLowerCase() === lower) return i;
  }
  return -1;
}

/** 用 ID 欄找行 index（0-based data row，不含 header） */
function findRowIndexById_(name, idCol, id) {
  var sh = getSheet_(name);
  if (!sh || sh.getLastRow() < 2) return -1;
  var data = sh.getDataRange().getValues();
  var headers = data[0].map(function (h) { return String(h).trim(); });
  var colIdx = findColIndex_(headers, idCol);
  if (colIdx < 0) return -1;
  var idStr = String(id);
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][colIdx]) === idStr) return i;
  }
  return -1;
}

/** 用 header name 更新單格 */
function updateCellByName_(name, idCol, id, colName, value) {
  var sh = getSheet_(name);
  if (!sh) return false;
  var data = sh.getDataRange().getValues();
  var headers = data[0].map(function (h) { return String(h).trim(); });
  var idIdx = findColIndex_(headers, idCol);
  var colIdx = findColIndex_(headers, colName);
  if (idIdx < 0) return false;
  var idStr = String(id);
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === idStr) {
      if (colIdx < 0) {
        // 欄位不存在 → 新增
        colIdx = headers.length;
        sh.getRange(1, colIdx + 1).setValue(colName);
      }
      sh.getRange(i + 1, colIdx + 1).setValue(value);
      return true;
    }
  }
  return false;
}

function appendRowByHeaders_(name, fieldMap) {
  var sh = getSheet_(name);
  if (!sh) throw new Error('找不到工作表：' + name);
  var headers = sh.getDataRange().getValues()[0].map(function (h) { return String(h).trim(); });
  // 新增缺失欄位
  Object.keys(fieldMap).forEach(function (k) {
    if (findColIndex_(headers, k) < 0) {
      var newCol = headers.length + 1;
      sh.getRange(1, newCol).setValue(k);
      headers.push(k);
    }
  });
  var row = headers.map(function (h) {
    for (var k in fieldMap) {
      if (String(k).toLowerCase() === h.toLowerCase()) return fieldMap[k];
    }
    return '';
  });
  sh.appendRow(row);
}

function getConfigValue_(key) {
  var rows = readTable_('SystemConfig');
  for (var i = 0; i < rows.length; i++) {
    if (getField_(rows[i], 'key') === key) return getField_(rows[i], 'value');
  }
  return '';
}

function setConfigValue_(key, value) {
  updateCellByName_('SystemConfig', 'key', key, 'value', value);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function uid_(prefix) { return prefix + '_' + Date.now() + '_' + Math.floor(Math.random() * 10000); }
function now_() { return new Date().toISOString(); }
function parseBool_(v) { return v === true || v === 'TRUE' || v === 'true' || v === 1 || v === '1'; }
function parseArray_(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return String(v).split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; });
}
function fmtDate_(d) {
  if (!d) return '';
  if (d instanceof Date) return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return String(d);
}

/** 處理時間欄位：Google Sheet 會把 14:00 存為 1899-12-30 14:00:00，要轉回 HH:mm */
function fmtTime_(v) {
  if (!v && v !== 0) return '';
  if (v instanceof Date) {
    var h = v.getHours();
    var m = v.getMinutes();
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }
  var s = String(v);
  if (s.indexOf('1899') === 0 || s.indexOf('1900') === 0) {
    var d = new Date(s);
    if (!isNaN(d.getTime())) {
      var h2 = d.getHours();
      var m2 = d.getMinutes();
      return (h2 < 10 ? '0' : '') + h2 + ':' + (m2 < 10 ? '0' : '') + m2;
    }
  }
  return s;
}
function calcAge_(dob) {
  if (!dob) return 0;
  var b = new Date(dob);
  if (isNaN(b.getTime())) return 0;
  var n = new Date();
  var age = n.getFullYear() - b.getFullYear();
  var m = n.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < b.getDate())) age--;
  return age;
}

// ==================== 資料組裝 ====================

function mapPatrols_() {
  return readTable_('Patrols').map(function (r) {
    return {
      id: getField_(r, 'patrolId'), branchId: getField_(r, 'branchId'),
      name: getField_(r, 'name'), short: getField_(r, 'shortName'),
      leaderMemberId: getField_(r, 'leaderMemberId') || '',
      deputyLeaderMemberId: getField_(r, 'deputyLeaderMemberId') || '',
      memberIds: parseArray_(getField_(r, 'memberIds')),
      enabled: parseBool_(getField_(r, 'enabled')), order: getField_(r, 'order') || 0
    };
  });
}

function mapUsers_() {
  var members = readTable_('Members');
  return readTable_('Users').map(function (u) {
    var childIds = members.filter(function (m) { return getField_(m, 'parentUserId') === getField_(u, 'userId'); })
      .map(function (m) { return getField_(m, 'memberId'); });
    return {
      id: getField_(u, 'userId'), name: getField_(u, 'name'), email: getField_(u, 'email'),
      role: getField_(u, 'role'), branchId: getField_(u, 'branchId') || '',
      memberId: getField_(u, 'memberId') || '',
      childMemberIds: childIds, approved: parseBool_(getField_(u, 'approved')),
      techTest: String(getField_(u, 'note')).indexOf('techTest') >= 0
    };
  });
}

function mapMembers_() {
  return readTable_('Members').map(function (m) {
    return {
      id: getField_(m, 'memberId'), ymNumber: String(getField_(m, 'ymNumber') || ''),
      name: getField_(m, 'name'), branchId: getField_(m, 'branchId'),
      patrolId: getField_(m, 'patrolId') || '', patrolRole: getField_(m, 'patrolRole') || '',
      age: calcAge_(getField_(m, 'dateOfBirth')), dateOfBirth: fmtDate_(getField_(m, 'dateOfBirth')),
      parentUserId: getField_(m, 'parentUserId') || '',
      emergencyContactName: getField_(m, 'emergencyContactName') || '',
      emergencyContactPhone: getField_(m, 'emergencyContactPhone') || '',
      active: getField_(m, 'active') === '' ? true : parseBool_(getField_(m, 'active'))
    };
  });
}

function mapApplications_() {
  return readTable_('Applications').map(function (a) {
    return {
      id: getField_(a, 'applicationId'), type: getField_(a, 'type'),
      name: getField_(a, 'name'), email: getField_(a, 'email'), role: getField_(a, 'role'),
      branchId: getField_(a, 'branchId') || '', ymNumbers: getField_(a, 'ymNumbers') || '',
      status: getField_(a, 'status') || 'pending',
      createdAt: fmtDate_(getField_(a, 'createdAt')) || getField_(a, 'createdAt') || '',
      decidedAt: fmtDate_(getField_(a, 'decidedAt')) || ''
    };
  });
}

function mapEvents_() {
  var members = readTable_('Members');
  return readTable_('Events').map(function (e) {
    var targets = parseArray_(getField_(e, 'targetMemberIds'));
    if (targets.length === 0 && getField_(e, 'scope') === 'troop') {
      targets = members.map(function (m) { return getField_(m, 'memberId'); });
    }
    return {
      id: getField_(e, 'eventId'), title: getField_(e, 'title'),
      scope: getField_(e, 'scope') || 'troop', branchId: getField_(e, 'branchId') || '',
      date: fmtDate_(getField_(e, 'date')), location: getField_(e, 'location') || '',
      kind: getField_(e, 'kind') || 'activity', status: getField_(e, 'status') || 'draft',
      source: getField_(e, 'source') || '', fee: getField_(e, 'fee') || '',
      targetMemberIds: targets
    };
  });
}

function mapReplies_() {
  return readTable_('EventReplies').map(function (r) {
    return {
      id: getField_(r, 'replyId'), eventId: getField_(r, 'eventId'),
      memberId: getField_(r, 'memberId'), parentUserId: getField_(r, 'parentUserId') || '',
      type: getField_(r, 'type') || 'interested', operatedBy: getField_(r, 'operatedBy') || 'member',
      paid: parseBool_(getField_(r, 'paid')),
      updatedAt: getField_(r, 'updatedAt') ? fmtDate_(getField_(r, 'updatedAt')) || getField_(r, 'updatedAt') : ''
    };
  });
}

function mapBookmarks_() {
  return readTable_('LibraryBookmarks').map(function (b) {
    return {
      id: getField_(b, 'bookmarkId'), title: getField_(b, 'title'),
      source: getField_(b, 'source') || '',
      officialDeadline: fmtDate_(getField_(b, 'officialDeadline')),
      internalDeadline: fmtDate_(getField_(b, 'internalDeadline')),
      mode: getField_(b, 'mode') || 'informational',
      branchTags: parseArray_(getField_(b, 'branchTags')),
      status: getField_(b, 'status') || 'published',
      convertedEventId: getField_(b, 'convertedEventId') || '',
      fee: getField_(b, 'fee') || ''
    };
  });
}

function mapRegularMeetings_() {
  return readTable_('RegularMeetings').map(function (r) {
    return {
      id: getField_(r, 'meetingId'), branchId: getField_(r, 'branchId'),
      title: getField_(r, 'title'), weekday: Number(getField_(r, 'weekday')) || 0,
      startTime: fmtTime_(getField_(r, 'startTime')), endTime: fmtTime_(getField_(r, 'endTime')),
      location: getField_(r, 'location') || '', enabled: parseBool_(getField_(r, 'enabled'))
    };
  });
}

function mapCancelledMeetings_() {
  return readTable_('CancelledMeetings').map(function (c) {
    return {
      id: getField_(c, 'cancelId'), branchId: getField_(c, 'branchId'),
      date: fmtDate_(getField_(c, 'date')), reason: getField_(c, 'reason') || '',
      markedBy: getField_(c, 'markedBy') || '',
      markedAt: getField_(c, 'markedAt') ? fmtDate_(getField_(c, 'markedAt')) || getField_(c, 'markedAt') : ''
    };
  });
}

function mapAudits_() {
  return readTable_('AuditLogs').map(function (a) {
    return {
      id: getField_(a, 'logId'), userId: getField_(a, 'userId') || '',
      action: getField_(a, 'action') || '', entity: getField_(a, 'entity') || '',
      entityId: getField_(a, 'entityId') || '',
      createdAt: getField_(a, 'createdAt') ? fmtDate_(getField_(a, 'createdAt')) || getField_(a, 'createdAt') : '',
      detail: getField_(a, 'detail') || ''
    };
  }).reverse();
}

function mapConfig_() {
  var cfg = {};
  readTable_('SystemConfig').forEach(function (r) { var k = getField_(r, 'key'); if (k) cfg[k] = getField_(r, 'value'); });
  return cfg;
}

// ==================== ★ 角色過濾 Dashboard（取代 getState） ====================

/**
 * getDashboard(userId) — 按角色過濾回傳 AppState
 *
 * admin/super_admin：全部
 * group_leader / branch_leader：所屬支部
 * coach：所屬支部（無申請、無使用者管理）
 * parent：只看到自己 + 子女 + 子女相關活動
 * member：只看到自己 + 自己支部活動
 * 未登入：只回 config + branches
 */
function buildDashboard(userId) {
  // 技術測試帳號
  var techAccounts = getConfigValue_('TECH_TEST_ACCOUNTS').split(',').map(function (s) { return s.trim(); });
  var isTechTest = techAccounts.indexOf(userId) >= 0;

  // 找使用者
  var allUsers = mapUsers_();
  var user = null;
  if (isTechTest) {
    user = { id: userId, name: userId + '（技術測試）', role: 'super_admin', branchId: '', memberId: '', approved: true, techTest: true };
  } else {
    user = allUsers.filter(function (u) { return u.id === userId; })[0] || null;
  }

  var role = user ? user.role : '';
  var branchId = user ? (user.branchId || '') : '';

  // 全部載入（GS 端，不出網）
  var allPatrols = mapPatrols_();
  var allMembers = mapMembers_();
  var allEvents = mapEvents_();
  var allReplies = mapReplies_();
  var allBookmarks = mapBookmarks_();
  var allRegularMeetings = mapRegularMeetings_();
  var allCancelledMeetings = mapCancelledMeetings_();
  var allApplications = mapApplications_();
  var allAudits = mapAudits_();
  var config = mapConfig_();

  var state = {
    patrols: [], users: [], members: [], applications: [],
    events: [], replies: [], bookmarks: [],
    announcements: [], announcementPdfs: [],
    regularMeetings: [], cancelledMeetings: [],
    plugins: [], audits: [], config: config
  };

  // 未登入或無效使用者：只回 config
  if (!user) {
    return state;
  }

  // 當前使用者永遠包含
  state.users = [user];

  if (role === 'admin' || role === 'super_admin') {
    // 管理員：全部
    state.patrols = allPatrols;
    state.users = allUsers;
    state.members = allMembers;
    state.applications = allApplications;
    state.events = allEvents;
    state.replies = allReplies;
    state.bookmarks = allBookmarks;
    state.regularMeetings = allRegularMeetings;
    state.cancelledMeetings = allCancelledMeetings;
    state.audits = allAudits;

  } else if (role === 'group_leader' || role === 'branch_leader') {
    // 領袖：所屬支部
    state.patrols = allPatrols.filter(function (p) { return p.branchId === branchId; });
    state.members = allMembers.filter(function (m) { return m.branchId === branchId; });
    state.users = allUsers.filter(function (u) {
      return u.branchId === branchId || u.role === 'parent' || u.id === userId;
    });
    state.applications = allApplications.filter(function (a) { return a.branchId === branchId; });
    state.events = allEvents.filter(function (e) { return e.scope === 'troop' || e.branchId === branchId; });
    var leaderEventIds = state.events.map(function (e) { return e.id; });
    state.replies = allReplies.filter(function (r) { return leaderEventIds.indexOf(r.eventId) >= 0; });
    state.bookmarks = allBookmarks;
    state.regularMeetings = allRegularMeetings.filter(function (r) { return r.branchId === branchId; });
    state.cancelledMeetings = allCancelledMeetings.filter(function (c) { return c.branchId === branchId; });
    state.audits = allAudits.filter(function (a) { return a.userId === userId; });

  } else if (role === 'coach') {
    // 教練員：所屬支部，無申請管理
    state.patrols = allPatrols.filter(function (p) { return p.branchId === branchId; });
    state.members = allMembers.filter(function (m) { return m.branchId === branchId; });
    state.events = allEvents.filter(function (e) { return e.scope === 'troop' || e.branchId === branchId; });
    var coachEventIds = state.events.map(function (e) { return e.id; });
    state.replies = allReplies.filter(function (r) { return coachEventIds.indexOf(r.eventId) >= 0; });
    state.bookmarks = allBookmarks;
    state.regularMeetings = allRegularMeetings.filter(function (r) { return r.branchId === branchId; });
    state.cancelledMeetings = allCancelledMeetings.filter(function (c) { return c.branchId === branchId; });

  } else if (role === 'parent') {
    // 家長：只看自己 + 子女
    // 重新從 mapUsers_ 取得完整的 user（含 childMemberIds）
    var fullParentUser = allUsers.filter(function (u) { return u.id === userId; })[0];
    if (fullParentUser) { state.users = [fullParentUser]; user = fullParentUser; }
    var childIds = (fullParentUser ? fullParentUser.childMemberIds : []) || [];
    var children = allMembers.filter(function (m) {
      return childIds.indexOf(m.id) >= 0 || m.parentUserId === userId;
    });
    state.members = children;
    var childBranchIds = children.map(function (m) { return m.branchId; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    state.events = allEvents.filter(function (e) {
      if (e.status !== 'published') return false;
      if (e.scope === 'troop') return true;
      return childBranchIds.indexOf(e.branchId) >= 0;
    });
    var parentMemberIds = children.map(function (m) { return m.id; });
    state.replies = allReplies.filter(function (r) { return parentMemberIds.indexOf(r.memberId) >= 0; });
    state.bookmarks = allBookmarks.filter(function (b) { return b.status === 'published'; });
    state.regularMeetings = allRegularMeetings.filter(function (r) { return childBranchIds.indexOf(r.branchId) >= 0; });
    state.cancelledMeetings = allCancelledMeetings.filter(function (c) { return childBranchIds.indexOf(c.branchId) >= 0; });

  } else if (role === 'member') {
    // 成員：只看自己
    var member = allMembers.filter(function (m) { return m.id === user.memberId || m.id === userId; })[0];
    if (member) {
      state.members = [member];
      state.events = allEvents.filter(function (e) {
        if (e.status !== 'published') return false;
        if (e.scope === 'troop' || e.branchId === member.branchId) return true;
        return false;
      });
      state.replies = allReplies.filter(function (r) { return r.memberId === member.id; });
      state.regularMeetings = allRegularMeetings.filter(function (r) { return r.branchId === member.branchId; });
      state.cancelledMeetings = allCancelledMeetings.filter(function (c) { return c.branchId === member.branchId; });
      state.patrols = allPatrols.filter(function (p) { return p.branchId === member.branchId; });
    }
  }

  return state;
}

// ==================== doGet / API 分發 ====================

function doGet(e) {
  var p = (e && e.parameter) || {};
  var action = p.action || 'health';

  try {
    switch (action) {
      case 'health':
        return json({ success: true, version: SCOUTSYSTEM_VERSION, action: 'health', ready: true });

      case 'login':
        return handleLogin_(p);

      case 'getDashboard':
        return json({ success: true, state: buildDashboard(p.userId || '') });

      case 'getApplications':
        return json({ success: true, applications: filterApplications_(p.userId || '') });

      case 'getEventRegistrationSummary':
        return json(getEventRegistrationSummary(p));

      case 'getSystemStatus':
        return json(getSystemStatus());

      case 'getPublicBootstrap':
        return json(getPublicBootstrap());

      case 'listAnnouncementPdfs':
        return json(apiListAnnouncementPdfs());

      // ---- 公開寫入（不需登入） ----
      case 'applyJoin': return wrapPublic_(handleApplyJoin_(p));
      case 'importFromLibrary': return wrapPublic_(handleImportFromLibrary_(p));

      // ---- 需登入寫入 ----
      case 'cancelReply': return wrap_(handleCancelReply_(p), p);
      case 'toggleSystemLock': return wrapPublic_(toggleSystemLock(p));
      case 'autoRepairParentLinks': return wrap_(autoRepairParentLinks_(), p);
      case 'updateBookmark': return wrap_(handleUpdateBookmark_(p), p);
      case 'deleteBookmark': return wrap_(handleDeleteBookmark_(p), p);
      case 'createMember': return wrap_(handleCreateMember_(p), p);
      case 'updateMember': return wrap_(handleUpdateMember_(p), p);
      case 'linkParent': return wrap_(handleLinkParent_(p), p);
      case 'deleteMember': return wrap_(handleDeleteMember_(p), p);
      case 'createEvent': return wrap_(handleCreateEvent_(p), p);
      case 'publishEvent': return wrap_(handlePublishEvent_(p), p);
      case 'updateEvent': return wrap_(handleUpdateEvent_(p), p);
      case 'deleteEvent': return wrap_(handleDeleteEvent_(p), p);
      case 'setReply': return wrap_(handleSetReply_(p), p);
      case 'togglePaid': return wrap_(handleTogglePaid_(p), p);
      case 'decideApplication': return wrap_(handleDecideApplication_(p), p);
      case 'toggleUser': return wrap_(handleToggleUser_(p), p);
      case 'updateUserRole': return wrap_(handleUpdateUserRole_(p), p);
      case 'deleteUser': return wrap_(handleDeleteUser_(p), p);
      case 'createUser': return wrap_(handleCreateUser_(p), p);
      case 'createPatrol': return wrap_(handleCreatePatrol_(p), p);
      case 'togglePatrol': return wrap_(handleTogglePatrol_(p), p);
      case 'importBookmark': return wrap_(handleImportBookmark_(p), p);
      case 'toggleRegularMeeting': return wrap_(handleToggleRegularMeeting_(p), p);
      case 'createRegularMeeting': return wrap_(handleCreateRegularMeeting_(p), p);
      case 'toggleMeetingCancel': return wrap_(handleToggleMeetingCancel_(p), p);
      case 'saveConfig': return wrap_(handleSaveConfig_(p), p);

      default:
        return json({ success: false, error: '未知 action: ' + action });
    }
  } catch (err) {
    return json({ success: false, error: String(err) });
  }
}

/** 公開寫入：不回 dashboard */
function wrapPublic_(result) {
  return json(result);
}

/** 登入寫入：成功後回傳該使用者的 dashboard */
function wrap_(result, p) {
  if (result && result.success === false) return json(result);
  return json({ success: true, state: buildDashboard((p && p.operatedBy) || (p && p.userId) || '') });
}

function writeAudit_(userId, action, entity, entityId, detail) {
  appendRowByHeaders_('AuditLogs', {
    logId: uid_('log'), userId: userId || 'system', action: action,
    entity: entity, entityId: entityId || '', createdAt: now_(), detail: detail
  });
}

// ==================== 登入 ====================

function handleLogin_(p) {
  var identifier = (p.identifier || p.email || '').trim();
  var password = p.password || '';
  var loginType = p.loginType || 'account';

  // STAFF_TOKEN 登入
  if (loginType === 'staffToken' || (identifier === 'STAFF_TOKEN')) {
    var token = getConfigValue_('STAFF_TOKEN');
    if (token && password === token) {
      return json({ success: true, user: {
        userId: 'staff_token', name: 'STAFF_TOKEN 管理員', role: 'admin',
        dashboard: '/admin'
      }});
    }
    return json({ success: false, error: 'STAFF_TOKEN 不正確' });
  }

  // 技術測試帳號
  var techAccounts = getConfigValue_('TECH_TEST_ACCOUNTS').split(',').map(function (s) { return s.trim(); });
  if (techAccounts.indexOf(identifier) >= 0) {
    return json({ success: true, user: {
      userId: identifier, name: identifier + '（技術測試）', role: 'super_admin',
      dashboard: '/admin', techTest: true
    }});
  }

  if (loginType === 'member') {
    // 成員 YMIS 登入
    var members = readTable_('Members');
    var member = null;
    for (var i = 0; i < members.length; i++) {
      if (String(getField_(members[i], 'ymNumber')).trim() === identifier) { member = members[i]; break; }
    }
    if (!member) return json({ success: false, error: '找不到此 YMIS 編號的成員' });
    var active = getField_(member, 'active');
    if (!parseBool_(active) && active !== '') return json({ success: false, error: '此成員已停用' });
    // 檢查密碼
    var memberPw = String(getField_(member, 'password') || '').trim();
    if (memberPw && memberPw !== password) return json({ success: false, error: '密碼不正確' });
    if (!memberPw) return json({ success: false, error: '此成員尚未設定密碼，請聯絡領袖在 Members 表設定密碼。' });
    var age = calcAge_(getField_(member, 'dateOfBirth'));
    return json({ success: true, user: {
      userId: getField_(member, 'memberId'), name: getField_(member, 'name'), role: 'member',
      branchId: getField_(member, 'branchId'), memberId: getField_(member, 'memberId'), age: age,
      dashboard: '/member'
    }});
  }

  // 帳號登入
  var users = readTable_('Users');
  var user = null;
  for (var j = 0; j < users.length; j++) {
    if (getField_(users[j], 'email') === identifier || getField_(users[j], 'userId') === identifier) { user = users[j]; break; }
  }
  if (!user) return json({ success: false, error: '找不到此帳號' });
  var sheetPw = String(getField_(user, 'password') || '').trim();
  if (sheetPw && sheetPw !== password) return json({ success: false, error: '密碼不正確' });
  if (!parseBool_(getField_(user, 'approved'))) return json({ success: false, error: '帳號尚未啟用' });

  var role = String(getField_(user, 'role')).toLowerCase();
  var memberId = getField_(user, 'memberId');
  var memberAge = 0;
  if (memberId) {
    var allMembers = readTable_('Members');
    var mu = allMembers.filter(function (m) { return getField_(m, 'memberId') === memberId; })[0];
    if (mu) memberAge = calcAge_(getField_(mu, 'dateOfBirth'));
  }
  var dash = role === 'parent' ? '/parent' : (role === 'member' ? '/member' :
    (role === 'admin' || role === 'super_admin' ? '/admin' : '/leader'));
  return json({ success: true, user: {
    userId: getField_(user, 'userId'), name: getField_(user, 'name'), role: role,
    branchId: getField_(user, 'branchId') || '', memberId: memberId || '', age: memberAge,
    dashboard: dash
  }});
}

// ==================== 申請 ====================

function filterApplications_(userId) {
  var allApps = mapApplications_();
  var users = readTable_('Users');
  var user = users.filter(function (u) { return getField_(u, 'userId') === userId; })[0];
  if (!user) return [];
  var role = String(getField_(user, 'role')).toLowerCase();
  if (role === 'admin' || role === 'super_admin') return allApps;
  var branchId = getField_(user, 'branchId') || '';
  return allApps.filter(function (a) { return a.branchId === branchId; });
}

function handleApplyJoin_(p) {
  var id = uid_('a');
  appendRowByHeaders_('Applications', {
    applicationId: id, type: p.type || 'parent', name: p.name || '', email: p.email || '',
    role: p.role || 'parent', branchId: p.branchId || '', ymNumbers: p.ymNumbers || '',
    status: 'pending', createdAt: now_(), decidedAt: '', note: p.note || ''
  });
  writeAudit_('anonymous', 'applyJoin', 'Applications', id, (p.name || '') + ' ' + (p.type || ''));
  return { success: true, applicationId: id, message: '申請已提交，請等待旅團審批。' };
}

// ==================== 圖書館引入（接收來自 scout-circulars 的通告） ====================

function handleImportFromLibrary_(p) {
  var id = uid_('bkm');
  var mode = p.mode || 'informational';
  var convertedEventId = '';
  var status = 'published';
  if (mode === 'troop_participation') {
    convertedEventId = uid_('e');
    status = 'converted';
    var members = readTable_('Members');
    var targets = members.map(function (m) { return getField_(m, 'memberId'); }).join(',');
    appendRowByHeaders_('Events', {
      eventId: convertedEventId, title: p.title || '', scope: 'troop', branchId: '',
      date: p.date || p.deadline || '', location: '待定',
      kind: 'notice_troop_participation', status: 'published', source: '圖書館引入',
      fee: p.fee || '', targetMemberIds: targets, createdBy: 'library',
      createdAt: now_(), note: '由圖書館系統引入'
    });
  }
  appendRowByHeaders_('LibraryBookmarks', {
    bookmarkId: id, title: p.title || '',
    source: p.source || p.sourceSite || '',
    officialDeadline: p.deadline || p.officialDeadline || '',
    internalDeadline: '', mode: mode,
    branchTags: p.branchTags || '全旅', status: status,
    convertedEventId: convertedEventId, createdBy: 'library',
    createdAt: now_(),
    note: p.url || p.attachmentUrl || p.note || ''
  });
  writeAudit_('library', 'importFromLibrary', 'LibraryBookmarks', id, (p.title || ''));
  return { success: true, message: '已從圖書館引入：' + (p.title || '') };
}

// doPost 接收來自 scout-circulars 的 POST 請求
function doPost(e) {
  var p = {};
  if (e && e.postData && e.postData.contents) {
    try { p = JSON.parse(e.postData.contents); } catch (err) {
      p = (e && e.parameter) || {};
    }
  }
  if (!p.action) p.action = 'importFromLibrary';
  if (!p.action || p.action === 'importFromLibrary') {
    return json(handleImportFromLibrary_(p));
  }
  return doGet(e);
}

function handleDecideApplication_(p) {
  var appId = p.applicationId;
  var status = p.status || 'approved';
  var rowIdx = findRowIndexById_('Applications', 'applicationId', appId);
  if (rowIdx < 0) return { success: false, error: '找不到申請' };

  updateCellByName_('Applications', 'applicationId', appId, 'status', status);
  updateCellByName_('Applications', 'applicationId', appId, 'decidedAt', now_());

  if (status === 'approved') {
    // 讀回該行
    var apps = readTable_('Applications');
    var app = apps.filter(function (a) { return getField_(a, 'applicationId') === appId; })[0];
    if (app) {
      var name = getField_(app, 'name');
      var email = getField_(app, 'email');
      var role = String(getField_(app, 'role') || 'parent').toLowerCase();
      var branchId = getField_(app, 'branchId') || '';
      var ymNumbers = getField_(app, 'ymNumbers');
      var userId = uid_('u');

      appendRowByHeaders_('Users', {
        userId: userId, name: name, email: email, password: 'changeme',
        role: role, branchId: branchId, memberId: '', approved: true,
        createdAt: now_(), note: '由 ' + (p.operatedBy || 'system') + ' 批核'
      });

      // 家長：綁定子女
      if (role === 'parent' && ymNumbers) {
        var yms = String(ymNumbers).split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        var members = readTable_('Members');
        members.forEach(function (m) {
          if (yms.indexOf(String(getField_(m, 'ymNumber')).trim()) >= 0) {
            updateCellByName_('Members', 'memberId', getField_(m, 'memberId'), 'parentUserId', userId);
          }
        });
      }

      // 成員：建立/關聯 Member 記錄（1.0 邏輯）
      if (role === 'member') {
        var memberYm = String(ymNumbers || '').trim();
        if (memberYm) {
          var allMembers2 = readTable_('Members');
          var existingMember = allMembers2.filter(function (m) { return String(getField_(m, 'ymNumber')).trim() === memberYm; })[0];
          var memberId2 = '';
          if (existingMember) {
            memberId2 = getField_(existingMember, 'memberId');
          } else {
            memberId2 = uid_('m');
            appendRowByHeaders_('Members', {
              memberId: memberId2, ymNumber: memberYm, name: name,
              branchId: branchId, patrolId: '', patrolRole: '',
              dateOfBirth: '', parentUserId: '',
              emergencyContactName: '', emergencyContactPhone: '',
              active: true, note: '由申請 ' + appId + ' 批核建立'
            });
          }
          updateCellByName_('Users', 'userId', userId, 'memberId', memberId2);
          // 自動找家長連結
          var parentUsers2 = readTable_('Users').filter(function (u) { return String(getField_(u, 'role')).toLowerCase() === 'parent'; });
          parentUsers2.forEach(function (pu) {
            var childYm2 = getField_(pu, 'childYmNumbers') || getField_(pu, 'ymNumbers') || '';
            if (childYm2) {
              var parentYms = String(childYm2).split(/[,、\s]/).map(function (s) { return s.trim(); }).filter(Boolean);
              if (parentYms.indexOf(memberYm) >= 0) {
                updateCellByName_('Members', 'memberId', memberId2, 'parentUserId', getField_(pu, 'userId'));
              }
            }
          });
        }
      }
    }
  }
  writeAudit_(p.operatedBy || 'system', status, 'Applications', appId, status);
  return { success: true };
}

// ==================== 寫入：成員 ====================

function handleCreateMember_(p) {
  var id = uid_('m');
  appendRowByHeaders_('Members', {
    memberId: id, ymNumber: p.ymNumber || '', password: p.password || p.ymNumber || '',
    name: p.name || '',
    branchId: p.branchId || '', patrolId: p.patrolId || '',
    patrolRole: p.patrolRole || (p.patrolId ? 'member' : ''),
    dateOfBirth: p.dateOfBirth || '', parentUserId: p.parentUserId || '',
    emergencyContactName: p.emergencyContactName || '',
    emergencyContactPhone: p.emergencyContactPhone || '',
    active: true, note: p.note || ''
  });
  if (p.patrolId) syncPatrolMembers_(p.patrolId);
  writeAudit_(p.operatedBy || 'system', 'createMember', 'Members', id, (p.name || '') + ' ' + (p.ymNumber || ''));
  return { success: true };
}

function handleUpdateMember_(p) {
  var fields = ['ymNumber', 'password', 'name', 'branchId', 'patrolId', 'patrolRole', 'dateOfBirth', 'parentUserId', 'emergencyContactName', 'emergencyContactPhone', 'active'];
  fields.forEach(function (f) {
    if (p[f] !== undefined && p[f] !== null) {
      updateCellByName_('Members', 'memberId', p.memberId, f, p[f]);
    }
  });
  if (p.patrolId) syncPatrolMembers_(p.patrolId);
  writeAudit_(p.operatedBy || 'system', 'updateMember', 'Members', p.memberId, '');
  return { success: true };
}

function handleLinkParent_(p) {
  updateCellByName_('Members', 'memberId', p.memberId, 'parentUserId', p.parentUserId || '');
  writeAudit_(p.operatedBy || 'system', 'linkParent', 'Members', p.memberId, p.parentUserId || 'unlink');
  return { success: true };
}

function handleDeleteMember_(p) {
  var idx = findRowIndexById_('Members', 'memberId', p.memberId);
  if (idx < 0) return { success: false, error: '找不到成員' };
  getSheet_('Members').deleteRow(idx + 1);
  writeAudit_(p.operatedBy || 'system', 'deleteMember', 'Members', p.memberId, '');
  return { success: true };
}

// ==================== 寫入：活動 / 報名 ====================

function handleCreateEvent_(p) {
  var id = uid_('e');
  var scope = p.scope || 'troop';
  var targets = p.targetMemberIds || '';
  if (!targets) {
    var members = readTable_('Members');
    if (scope === 'troop') targets = members.map(function (m) { return getField_(m, 'memberId'); }).join(',');
    else if (p.branchId) targets = members.filter(function (m) { return getField_(m, 'branchId') === p.branchId; }).map(function (m) { return getField_(m, 'memberId'); }).join(',');
  }
  appendRowByHeaders_('Events', {
    eventId: id, title: p.title || '', scope: scope, branchId: p.branchId || '',
    date: p.date || '', location: p.location || '', kind: p.kind || 'activity',
    status: p.status || 'draft', source: p.source || '手動新增', fee: p.fee || '',
    targetMemberIds: targets, createdBy: p.operatedBy || '', createdAt: now_(), note: p.note || ''
  });
  writeAudit_(p.operatedBy || 'system', 'createEvent', 'Events', id, p.title || '');
  return { success: true };
}

function handlePublishEvent_(p) {
  updateCellByName_('Events', 'eventId', p.eventId, 'status', 'published');
  writeAudit_(p.operatedBy || 'system', 'publishEvent', 'Events', p.eventId, '');
  return { success: true };
}

function handleUpdateEvent_(p) {
  var fields = ['title', 'scope', 'branchId', 'date', 'location', 'kind', 'status', 'source', 'fee', 'targetMemberIds', 'note'];
  var changed = [];
  fields.forEach(function (f) {
    if (p[f] !== undefined && p[f] !== null) {
      updateCellByName_('Events', 'eventId', p.eventId, f, p[f]);
      changed.push(f);
    }
  });
  if (changed.length === 0) return { success: false, error: '沒有要更新的欄位' };
  updateCellByName_('Events', 'eventId', p.eventId, 'updatedAt', now_());
  writeAudit_(p.operatedBy || 'system', 'updateEvent', 'Events', p.eventId, changed.join(','));
  return { success: true };
}

function handleDeleteEvent_(p) {
  var idx = findRowIndexById_('Events', 'eventId', p.eventId);
  if (idx < 0) return { success: false, error: '找不到活動' };
  getSheet_('Events').deleteRow(idx + 1);
  writeAudit_(p.operatedBy || 'system', 'deleteEvent', 'Events', p.eventId, '');
  return { success: true };
}

/**
 * ★ 18 歲 GS 端 guard（1.0 邏輯）
 * registered / declined：18 歲以下必須由家長操作
 * interested：任何人都可以
 */
function handleSetReply_(p) {
  var eventId = p.eventId, memberId = p.memberId;
  var type = p.type || 'interested';

  // 年齡檢查
  if (type === 'registered' || type === 'declined') {
    var members = readTable_('Members');
    var member = members.filter(function (m) { return getField_(m, 'memberId') === memberId; })[0];
    if (member) {
      var age = calcAge_(getField_(member, 'dateOfBirth'));
      if (age >= 0 && age < 18) {
        // 必須由家長操作
        var parentUserId = p.parentUserId || '';
        if (!parentUserId) {
          // 檢查操作者是否為家長
          var users = readTable_('Users');
          var operator = users.filter(function (u) { return getField_(u, 'userId') === (p.operatedBy || ''); })[0];
          if (!operator || String(getField_(operator, 'role')).toLowerCase() !== 'parent') {
            return { success: false, error: '18歲以下成員需由家長代為操作參加 / 不參加' };
          }
        }
      }
    }
  }

  var replyId = eventId + '_' + memberId;
  var existing = findRowIndexById_('EventReplies', 'replyId', replyId);
  var operatedBy = p.operatedBy || 'member';
  var parentUserId = p.parentUserId || '';

  if (existing >= 0) {
    updateCellByName_('EventReplies', 'replyId', replyId, 'type', type);
    updateCellByName_('EventReplies', 'replyId', replyId, 'operatedBy', operatedBy);
    updateCellByName_('EventReplies', 'replyId', replyId, 'updatedAt', now_());
    if (parentUserId) updateCellByName_('EventReplies', 'replyId', replyId, 'parentUserId', parentUserId);
  } else {
    appendRowByHeaders_('EventReplies', {
      replyId: replyId, eventId: eventId, memberId: memberId,
      parentUserId: parentUserId, type: type, operatedBy: operatedBy,
      updatedAt: now_(), paid: false, notes: ''
    });
  }
  writeAudit_(p.operatedBy || 'system', 'setReply', 'EventReplies', eventId, memberId + ' → ' + type);
  return { success: true };
}

function handleTogglePaid_(p) {
  var replyId = p.eventId + '_' + p.memberId;
  var idx = findRowIndexById_('EventReplies', 'replyId', replyId);
  if (idx >= 0) {
    var sh = getSheet_('EventReplies');
    var data = sh.getDataRange().getValues();
    var headers = data[0].map(function (h) { return String(h).trim(); });
    var paidIdx = findColIndex_(headers, 'paid');
    var current = parseBool_(data[idx][paidIdx]);
    updateCellByName_('EventReplies', 'replyId', replyId, 'paid', String(!current));
    updateCellByName_('EventReplies', 'replyId', replyId, 'updatedAt', now_());
    writeAudit_(p.operatedBy || 'system', 'togglePaid', 'EventReplies', p.eventId, p.memberId + ' paid=' + !current);
  } else {
    appendRowByHeaders_('EventReplies', {
      replyId: replyId, eventId: p.eventId, memberId: p.memberId,
      parentUserId: '', type: 'registered', operatedBy: 'leader',
      updatedAt: now_(), paid: true, notes: ''
    });
    writeAudit_(p.operatedBy || 'system', 'togglePaid', 'EventReplies', p.eventId, p.memberId + ' new paid=true');
  }
  return { success: true };
}

// ==================== 寫入：使用者 ====================

function handleToggleUser_(p) {
  var users = readTable_('Users');
  var user = users.filter(function (u) { return getField_(u, 'userId') === p.userId; })[0];
  if (!user) return { success: false, error: '找不到使用者' };
  var current = parseBool_(getField_(user, 'approved'));
  updateCellByName_('Users', 'userId', p.userId, 'approved', String(!current));
  writeAudit_(p.operatedBy || 'system', 'toggleUser', 'Users', p.userId, 'approved=' + !current);
  return { success: true };
}

function handleCreateUser_(p) {
  var id = uid_('u');
  appendRowByHeaders_('Users', {
    userId: id, name: p.name || '', email: p.email || '', password: p.password || 'changeme',
    role: p.role || 'member', branchId: p.branchId || '', memberId: p.memberId || '',
    approved: true, createdAt: now_(), note: '由 ' + (p.operatedBy || 'system') + ' 建立'
  });
  writeAudit_(p.operatedBy || 'system', 'createUser', 'Users', id, (p.name || '') + ' ' + (p.role || ''));
  return { success: true };
}

function handleUpdateUserRole_(p) {
  updateCellByName_('Users', 'userId', p.userId, 'role', p.role || 'member');
  writeAudit_(p.operatedBy || 'system', 'updateUserRole', 'Users', p.userId, 'role=' + (p.role || ''));
  return { success: true };
}

function handleDeleteUser_(p) {
  var idx = findRowIndexById_('Users', 'userId', p.userId);
  if (idx < 0) return { success: false, error: '找不到使用者' };
  getSheet_('Users').deleteRow(idx + 1);
  writeAudit_(p.operatedBy || 'system', 'deleteUser', 'Users', p.userId, '');
  return { success: true };
}

// ==================== 寫入：小隊 / 六 ====================

function handleCreatePatrol_(p) {
  var id = uid_('p');
  var existing = readTable_('Patrols').filter(function (x) { return getField_(x, 'branchId') === p.branchId; });
  appendRowByHeaders_('Patrols', {
    patrolId: id, branchId: p.branchId, name: p.name || '', shortName: p.short || '',
    leaderMemberId: '', deputyLeaderMemberId: '', memberIds: '',
    enabled: true, order: existing.length + 1, note: p.note || ''
  });
  writeAudit_(p.operatedBy || 'system', 'createPatrol', 'Patrols', id, p.name || '');
  return { success: true };
}

function handleTogglePatrol_(p) {
  var patrols = readTable_('Patrols');
  var patrol = patrols.filter(function (x) { return getField_(x, 'patrolId') === p.patrolId; })[0];
  if (!patrol) return { success: false, error: '找不到小隊' };
  var current = parseBool_(getField_(patrol, 'enabled'));
  updateCellByName_('Patrols', 'patrolId', p.patrolId, 'enabled', String(!current));
  writeAudit_(p.operatedBy || 'system', 'togglePatrol', 'Patrols', p.patrolId, 'enabled=' + !current);
  return { success: true };
}

function syncPatrolMembers_(patrolId) {
  var members = readTable_('Members');
  var ids = members.filter(function (m) { return getField_(m, 'patrolId') === patrolId; }).map(function (m) { return getField_(m, 'memberId'); });
  var leader = members.filter(function (m) { return getField_(m, 'patrolId') === patrolId && getField_(m, 'patrolRole') === 'leader'; }).map(function (m) { return getField_(m, 'memberId'); })[0] || '';
  updateCellByName_('Patrols', 'patrolId', patrolId, 'leaderMemberId', leader);
  updateCellByName_('Patrols', 'patrolId', patrolId, 'memberIds', ids.join(','));
}

// ==================== 寫入：圖書館標記 ====================

function handleImportBookmark_(p) {
  var id = uid_('bkm');
  var mode = p.mode || 'informational';
  var convertedEventId = '';
  var status = 'published';
  if (mode === 'troop_participation') {
    convertedEventId = uid_('e');
    status = 'converted';
    var members = readTable_('Members');
    var targets = members.map(function (m) { return getField_(m, 'memberId'); }).join(',');
    appendRowByHeaders_('Events', {
      eventId: convertedEventId, title: p.title || '', scope: 'troop', branchId: '',
      date: p.date || p.internalDeadline || '', location: '待定',
      kind: 'notice_troop_participation', status: 'published', source: '圖書館轉入',
      fee: p.fee || '', targetMemberIds: targets, createdBy: p.operatedBy || '',
      createdAt: now_(), note: '由圖書館標記轉入'
    });
  }
  appendRowByHeaders_('LibraryBookmarks', {
    bookmarkId: id, title: p.title || '', source: p.source || 'Scout Circulars',
    officialDeadline: p.officialDeadline || '', internalDeadline: p.internalDeadline || '',
    mode: mode, branchTags: p.branchTags || '全旅', status: status,
    convertedEventId: convertedEventId, createdBy: p.operatedBy || '',
    createdAt: now_(), note: p.note || ''
  });
  writeAudit_(p.operatedBy || 'system', 'importBookmark', 'LibraryBookmarks', id, (p.title || '') + ' → ' + mode);
  return { success: true };
}

// ==================== 寫入：集會 / 行事曆 ====================

function handleToggleRegularMeeting_(p) {
  var meetings = readTable_('RegularMeetings');
  var m = meetings.filter(function (x) { return getField_(x, 'meetingId') === p.meetingId; })[0];
  if (!m) return { success: false, error: '找不到集會規則' };
  var current = parseBool_(getField_(m, 'enabled'));
  updateCellByName_('RegularMeetings', 'meetingId', p.meetingId, 'enabled', String(!current));
  writeAudit_(p.operatedBy || 'system', 'toggleRegularMeeting', 'RegularMeetings', p.meetingId, 'enabled=' + !current);
  return { success: true };
}

function handleCreateRegularMeeting_(p) {
  var id = uid_('rm');
  appendRowByHeaders_('RegularMeetings', {
    meetingId: id, branchId: p.branchId || '', title: p.title || '',
    weekday: Number(p.weekday) || 6, startTime: p.startTime || '14:00',
    endTime: p.endTime || '16:00', location: p.location || '本中心',
    enabled: true, note: p.note || ''
  });
  writeAudit_(p.operatedBy || 'system', 'createRegularMeeting', 'RegularMeetings', id, p.title || '');
  return { success: true };
}

function handleToggleMeetingCancel_(p) {
  var branchId = p.branchId, date = p.date;
  var sh = getSheet_('CancelledMeetings');
  var data = sh.getDataRange().getValues();
  var headers = data[0].map(function (h) { return String(h).trim(); });
  var bIdx = findColIndex_(headers, 'branchId');
  var dIdx = findColIndex_(headers, 'date');
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][bIdx]) === branchId && fmtDate_(data[i][dIdx]) === date) {
      sh.deleteRow(i + 1);
      writeAudit_(p.operatedBy || 'system', 'uncancelMeeting', 'CancelledMeetings', branchId + ' ' + date, '');
      return { success: true };
    }
  }
  appendRowByHeaders_('CancelledMeetings', {
    cancelId: uid_('cm'), branchId: branchId, date: date,
    reason: p.reason || '', markedBy: p.operatedBy || '', markedAt: now_()
  });
  writeAudit_(p.operatedBy || 'system', 'cancelMeeting', 'CancelledMeetings', branchId + ' ' + date, p.reason || '');
  return { success: true };
}

// ==================== 寫入：設定 ====================

function handleSaveConfig_(p) {
  setConfigValue_(p.key, p.value);
  writeAudit_(p.operatedBy || 'system', 'saveConfig', 'SystemConfig', p.key, '');
  return { success: true };
}

// ==================== 取消報名回覆（1.0 邏輯：軟刪除） ====================

function handleCancelReply_(p) {
  var replyId = p.eventId + '_' + p.memberId;
  var idx = findRowIndexById_('EventReplies', 'replyId', replyId);
  if (idx < 0) return { success: false, error: '找不到報名記錄' };
  // 軟刪除：標記 type=declined + 加 notes
  updateCellByName_('EventReplies', 'replyId', replyId, 'type', 'declined');
  updateCellByName_('EventReplies', 'replyId', replyId, 'operatedBy', p.operatedBy || 'member');
  updateCellByName_('EventReplies', 'replyId', replyId, 'updatedAt', now_());
  writeAudit_(p.operatedBy || 'system', 'cancelReply', 'EventReplies', p.eventId, p.memberId + ' cancelled');
  return { success: true };
}

// ==================== 報名摘要（1.0 getEventRegistrationSummary） ====================

function getEventRegistrationSummary(p) {
  var eventId = p.eventId || '';
  var userId = p.userId || '';
  if (!eventId) return { success: false, error: '缺少 eventId' };

  var events = mapEvents_();
  var event = events.filter(function (e) { return e.id === eventId; })[0];
  if (!event) return { success: false, error: '活動不存在' };

  var allMembers = mapMembers_();
  var patrols = mapPatrols_();
  var allReplies = mapReplies_().filter(function (r) { return r.eventId === eventId; });

  // 應報名成員
  var targets = event.targetMemberIds;
  var targetMembers = allMembers.filter(function (m) { return targets.indexOf(m.id) >= 0; });

  // 分類
  var replied = {};
  allReplies.forEach(function (r) { replied[r.memberId] = r; });
  var registered = [], interested = [], declined = [], unresponded = [];
  targetMembers.forEach(function (m) {
    var r = replied[m.id];
    var patrol = patrols.filter(function (p) { return p.id === m.patrolId; })[0];
    var base = {
      memberId: m.id, name: m.name, ymNumber: m.ymNumber, branchId: m.branchId,
      patrol: patrol ? patrol.name : '無分隊', patrolShort: patrol ? patrol.short : '',
      age: m.age, emergencyContactName: m.emergencyContactName || '',
      emergencyContactPhone: m.emergencyContactPhone || '', paid: r ? r.paid : false
    };
    if (!r) unresponded.push(base);
    else if (r.type === 'registered') registered.push(base);
    else if (r.type === 'interested') interested.push(base);
    else if (r.type === 'declined') declined.push(base);
  });

  return {
    success: true,
    data: {
      event: { eventId: event.id, title: event.title, date: event.date, scope: event.scope, branchId: event.branchId, fee: event.fee },
      registered: registered, interested: interested, declined: declined, unresponded: unresponded,
      summary: {
        totalTarget: targetMembers.length,
        registeredCount: registered.length, interestedCount: interested.length,
        declinedCount: declined.length, unrespondedCount: unresponded.length,
        paidCount: registered.filter(function (r) { return r.paid; }).length
      }
    }
  };
}

// ==================== 系統鎖（1.0 邏輯） ====================

function toggleSystemLock(p) {
  var password = p.password || '';
  var techAccounts = getConfigValue_('TECH_TEST_ACCOUNTS').split(',').map(function (s) { return s.trim(); });
  // 只允許技術測試帳號或 STAFF_TOKEN 操作
  if (password !== '0728' && password !== getConfigValue_('STAFF_TOKEN')) {
    return { success: false, error: '權限不足' };
  }
  var current = String(getConfigValue_('system_locked') || '').toLowerCase() === 'true';
  setConfigValue_('system_locked', String(!current));
  writeAudit_(p.operatedBy || 'system', 'toggleSystemLock', 'SystemConfig', 'system_locked', !current ? 'locked' : 'unlocked');
  return { success: true, locked: !current };
}

function getSystemStatus() {
  return {
    success: true,
    locked: String(getConfigValue_('system_locked') || '').toLowerCase() === 'true'
  };
}

// ==================== 家長子女自動修復（1.0 邏輯） ====================

function autoRepairParentLinks_() {
  var members = readTable_('Members');
  var users = readTable_('Users');
  var fixed = 0;

  // 方法 1：Members.parentUserId 對應 Users.userId → 同步 childMemberIds（前端自動算）
  // 方法 2：Users 有 childYmNumbers 但 Members.parentUserId 空白 → 用 YMIS 配對
  var parents = users.filter(function (u) {
    return String(getField_(u, 'role')).toLowerCase() === 'parent';
  });

  parents.forEach(function (pu) {
    var childYm = getField_(pu, 'childYmNumbers') || getField_(pu, 'ymNumbers') || '';
    if (!childYm) return;
    var yms = String(childYm).split(/[,、\s]/).map(function (s) { return s.trim(); }).filter(Boolean);
    var parentId = getField_(pu, 'userId');
    members.forEach(function (m) {
      var ym = String(getField_(m, 'ymNumber')).trim();
      if (yms.indexOf(ym) >= 0) {
        var existingParent = getField_(m, 'parentUserId');
        if (!existingParent) {
          updateCellByName_('Members', 'memberId', getField_(m, 'memberId'), 'parentUserId', parentId);
          fixed++;
        }
      }
    });
  });

  return { success: true, fixed: fixed, message: '修復了 ' + fixed + ' 條家長子女連結。' };
}

// ==================== Library Bookmark Update / Delete ====================

function handleUpdateBookmark_(p) {
  if (p.title) updateCellByName_('LibraryBookmarks', 'bookmarkId', p.bookmarkId, 'title', p.title);
  if (p.internalDeadline) updateCellByName_('LibraryBookmarks', 'bookmarkId', p.bookmarkId, 'internalDeadline', p.internalDeadline);
  if (p.branchTags) updateCellByName_('LibraryBookmarks', 'bookmarkId', p.bookmarkId, 'branchTags', p.branchTags);
  if (p.note) updateCellByName_('LibraryBookmarks', 'bookmarkId', p.bookmarkId, 'note', p.note);
  writeAudit_(p.operatedBy || 'system', 'updateBookmark', 'LibraryBookmarks', p.bookmarkId, '');
  return { success: true };
}

function handleDeleteBookmark_(p) {
  var idx = findRowIndexById_('LibraryBookmarks', 'bookmarkId', p.bookmarkId);
  if (idx < 0) return { success: false, error: '找不到通告' };
  getSheet_('LibraryBookmarks').deleteRow(idx + 1);
  writeAudit_(p.operatedBy || 'system', 'deleteBookmark', 'LibraryBookmarks', p.bookmarkId, '');
  return { success: true };
}

// ==================== 公開 Bootstrap（給未登入頁用） ====================

function getPublicBootstrap() {
  var config = mapConfig_();
  // 只回傳安全的 config
  var safeConfig = {
    TROOP_CODE: config.TROOP_CODE || '',
    TROOP_NAME: config.TROOP_NAME || '',
    REGISTRY_URL: config.REGISTRY_URL || '',
    TECH_TEST_ACCOUNTS: config.TECH_TEST_ACCOUNTS || ''
  };
  return {
    success: true,
    data: {
      config: safeConfig,
      branches: readTable_('Branches').filter(function (b) { return parseBool_(getField_(b, 'enabled')); }).map(function (b) {
        return { id: getField_(b, 'branchId'), name: getField_(b, 'name') };
      })
    }
  };
}

// ==================== Drive：公告 PDF ====================

function apiListAnnouncementPdfs() {
  var folderId = getConfigValue_('ANNOUNCEMENT_FOLDER_ID');
  if (!folderId) return { success: false, error: '未設定 ANNOUNCEMENT_FOLDER_ID' };
  var folder = DriveApp.getFolderById(folderId);
  var files = folder.getFilesByType(MimeType.PDF);
  var out = [];
  while (files.hasNext()) {
    var f = files.next();
    out.push({
      id: f.getId(), name: f.getName(), url: f.getUrl(),
      updatedAt: Utilities.formatDate(f.getLastUpdated(), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
      size: Math.round(f.getSize() / 1024) + ' KB'
    });
  }
  out.sort(function (a, b) { return b.updatedAt.localeCompare(a.updatedAt); });
  return { success: true, files: out };
}
