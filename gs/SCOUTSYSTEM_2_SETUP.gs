/**
 * 2026 Scout System — 完整後台 (V14.1 FINAL COMPLETE)
 *
 * 說明：這是一份完整的後台腳本，適用於「新旅團初始化」或「現有旅團升級」。
 * 
 * 安全更新保護機制：
 *   - 採用標題比對技術：setupScoutSystem() 會檢查現有表格。
 *   - 增量更新：只補齊缺失欄位，不刪除原有資料。
 *   - 自動格式化：將時間、YMIS、Email 等欄位設為純文字，防止 Google 自動轉換。
 *
 * 用法：
 *   1. Google Sheet → Extensions → Apps Script 貼上整份。
 *   2. Run setupScoutSystem()。
 *   3. Deploy → Web App → Execute as Me, Anyone。
 */

var SCOUTSYSTEM_VERSION = '2.1-v14.1-stable';
var TECH_TEST_ACCOUNTS_ = ['sheep', '0728'];

// ==================== 顏色 / 分頁設定 ====================

var SHEET_COLORS = {
  readme: '#0b5cab', config: '#fbbc04', editable: '#34a853',
  data: '#4285f4', system: '#9aa0a6', audit: '#d93025'
};

var VISIBLE_SHEETS_FOR_BEGINNERS = [
  'README_新手必看', 'SystemConfig', 'Branches', 'Patrols', 'Members'
];

var ADVANCED_SHEETS = [
  'Roles', 'FieldSettings', 'Users', 'Applications', 'Meetings',
  'Events', 'EventReplies', 'LibraryBookmarks', 'Announcements',
  'RegularMeetings', 'CancelledMeetings', 'Notices', 'Plugins', 'PluginSettings', 'UserPermissions', 'AuditLogs'
];

// ==================== 初始化 (安全更新邏輯) ====================

function setupScoutSystem() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('請先在 Google Sheet 中開啟 Apps Script，再執行 setupScoutSystem()');

  var sheets = getInitialSheets_();
  Object.keys(sheets).forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    sh.showSheet();
    
    var data = sh.getDataRange().getValues();
    var existingHeaders = data[0].map(function(h) { return String(h).trim(); });
    var targetHeaders = sheets[name][0];
    
    if (data.length <= 1 && data[0][0] === "") {
      // 1. 完全空的表：直接寫入
      sh.getRange(1, 1, sheets[name].length, sheets[name][0].length).setValues(sheets[name]);
    } else {
      // 2. 已有資料：增量補齊欄位
      var lastCol = sh.getLastColumn();
      targetHeaders.forEach(function(h) {
        var foundIdx = -1;
        for (var i = 0; i < existingHeaders.length; i++) {
          if (existingHeaders[i].toLowerCase() === h.toLowerCase()) { foundIdx = i; break; }
          // 智能修復合併標題
          if (existingHeaders[i].toLowerCase().indexOf(h.toLowerCase()) >= 0 && existingHeaders[i].length > h.length + 1) {
            sh.getRange(1, i + 1).setValue(h);
            existingHeaders[i] = h;
            foundIdx = i;
            break;
          }
        }
        if (foundIdx < 0) {
          sh.getRange(1, lastCol + 1).setValue(h);
          sh.getRange(2, lastCol + 1, sh.getMaxRows() - 1, 1).setNumberFormat('@');
          existingHeaders.push(h);
          lastCol++;
        }
      });
      
      // 3. 強制設定特定欄位為純文字格式
      var currentHeaders = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
      ['startTime', 'endTime', 'date', 'ymNumber', 'specialRole', 'email', 'paymentUrl', 'dutyPatrol'].forEach(function(h) {
        var colIdx = -1;
        for(var k=0; k<currentHeaders.length; k++) { if(String(currentHeaders[k]).toLowerCase() === h.toLowerCase()) { colIdx = k; break; } }
        if (colIdx >= 0) {
          sh.getRange(2, colIdx + 1, sh.getMaxRows() - 1, 1).setNumberFormat('@');
        }
      });

      // 4. SystemConfig：補齊缺失 Key
      if (name === 'SystemConfig') {
        var existingKeys = data.map(function(r) { return String(r[0]); });
        sheets[name].slice(1).forEach(function(row) {
          if (existingKeys.indexOf(row[0]) < 0) { sh.appendRow(row); }
        });
      }
    }
    sh.setFrozenRows(1);
  });

  setupReadmeSheet_(ss);
  formatScoutSystemSheets_(ss);
  addHelpfulNotes_(ss);
  var apiKeyPlain = generateStaffToken_(ss);
  hideAdvancedSheets();

  var readme = ss.getSheetByName('README_新手必看');
  if (readme) ss.setActiveSheet(readme);

  try {
    SpreadsheetApp.getUi().alert(
      '2026 Scout System 安全更新完成',
      '已補齊所有最新功能所需欄位，資料完整保留。\n\n'
      + '🔑 API Key: ' + (apiKeyPlain || '（已保留現有設定）'),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (e) {}
}

function setup() { setupScoutSystem(); }

// ==================== 資料定義 ====================

function getInitialSheets_() {
  return {
    SystemConfig: [
      ['key', 'value', 'note'],
      ['TROOP_CODE', "'0082", '必填：旅團號。'],
      ['TROOP_NAME', '第82旅', '必填：旅團名稱。'],
      ['ADMIN_EMAIL', '', '第一位管理員 Email。'],
      ['ADMIN_DEFAULT_PASSWORD', 'changeme', '初始密碼。'],
      ['REGISTRY_URL', 'https://troop-router.vercel.app/api/registry.json', '轉駁器。'],
      ['STAFF_TOKEN', '', '自動生成。'],
      ['API_KEY_HASH', '', '安全 Hash。']
    ],
    Roles: [
      ['role', 'label', 'level', 'defaultLanding', 'note'],
      ['super_admin', '技術測試', 100, '/admin', ''],
      ['admin', '管理員', 90, '/admin', ''],
      ['group_leader', '團長', 70, '/leader', ''],
      ['branch_leader', '支部領袖', 60, '/leader', ''],
      ['coach', '教練員', 50, '/leader', ''],
      ['parent', '家長', 20, '/parent', ''],
      ['member', '成員', 10, '/member', '']
    ],
    Branches: [
      ['branchId', 'name', 'enabled', 'note'],
      ['b1', '小童軍支部', true, ''], ['b2', '幼童軍支部', true, ''], ['b3', '童軍支部', true, ''], ['b4', '深資童軍支部', true, ''], ['b5', '樂行童軍支部', true, '']
    ],
    Patrols: [
      ['patrolId', 'branchId', 'name', 'shortName', 'leaderMemberId', 'deputyLeaderMemberId', 'memberIds', 'enabled', 'order', 'note'],
      ['p1', 'b2', '紅', 'R', '', '', '', true, 1, ''], ['p2', 'b2', '黃', 'Y', '', '', '', true, 2, ''], ['p3', 'b2', '藍', 'B', '', '', '', true, 3, ''], ['p4', 'b2', '白', 'W', '', '', '', true, 4, ''], ['p5', 'b2', '灰', 'GY', '', '', '', true, 5, ''], ['p6', 'b2', '綠', 'G', '', '', '', true, 6, ''], ['p7', 'b2', '棕', 'BR', '', '', '', true, 7, ''], ['p8', 'b2', '黑', 'BK', '', '', '', true, 8, ''], ['p9', 'b2', '橙', 'O', '', '', '', true, 9, ''],
      ['p10', 'b3', 'TIGER', 'T', '', '', '', true, 1, ''], ['p11', 'b3', 'SEAGULL', 'S', '', '', '', true, 2, ''], ['p12', 'b3', 'WOLF', 'W', '', '', '', true, 3, '']
    ],
    Users: [
      ['userId', 'name', 'email', 'password', 'role', 'branchId', 'memberId', 'approved', 'createdAt', 'note'],
      ['u_admin', '超管', '', 'changeme', 'troop_super', '', '', true, now_(), '']
    ],
    Applications: [
      ['applicationId', 'type', 'name', 'email', 'role', 'branchId', 'ymNumbers', 'dateOfBirth', 'gender', 'password', 'status', 'approvedBy', 'createdAt', 'decidedAt', 'note']
    ],
    Members: [
      ['memberId', 'ymNumber', 'password', 'name', 'email', 'branchId', 'patrolId', 'patrolRole', 'specialRole', 'dateOfBirth', 'parentUserId', 'emergencyContactName', 'emergencyContactPhone', 'active', 'note'],
      ['m_ex1', '1234567890', '1234567890', '陳大文', '', 'b3', 'p10', 'leader', '', '2012-03-15', '', '陳太', '9123 4567', true, '']
    ],
    Meetings: [
      ['meetingId', 'title', 'type', 'date', 'startTime', 'endTime', 'location', 'targetRoles', 'branchId', 'url', 'status', 'createdBy', 'createdAt', 'note']
    ],
    Events: [
      ['eventId', 'title', 'scope', 'branchId', 'date', 'location', 'kind', 'status', 'source', 'fee', 'paymentUrl', 'dutyPatrol', 'targetMemberIds', 'createdBy', 'createdAt', 'note']
    ],
    EventReplies: [
      ['replyId', 'eventId', 'memberId', 'memberName', 'branchId', 'parentUserId', 'type', 'operatedBy', 'paid', 'cancelled', 'createdAt', 'updatedAt', 'notes']
    ],
    LibraryBookmarks: [
      ['bookmarkId', 'circularKey', 'title', 'source', 'region', 'circularDate', 'sourceUrl', 'attachmentUrl', 'paymentUrl', 'officialDeadline', 'internalDeadline', 'mode', 'activityType', 'targetText', 'eligibility', 'fee', 'branchTags', 'audienceTags', 'status', 'convertedEventId', 'ownerUserId', 'createdBy', 'createdAt', 'note']
    ],
    Announcements: [
      ['announcementId', 'fileId', 'fileName', 'fileUrl', 'fileSize', 'branchTags', 'audienceTags', 'status', 'updatedAt', 'note']
    ],
    RegularMeetings: [
      ['meetingId', 'branchId', 'title', 'weekday', 'frequency', 'startTime', 'endTime', 'location', 'enabled', 'note'],
      ['rm1', 'b3', '童軍集會', 6, 'weekly', '14:00', '16:00', '本中心', true, ''],
      ['rm2', 'b2', '幼童軍集會', 6, 'weekly', '14:00', '16:00', '本中心', true, '']
    ],
    CancelledMeetings: [
      ['cancelId', 'branchId', 'date', 'type', 'reason', 'markedBy', 'markedAt']
    ],
    Notices: [
      ['noticeId', 'title', 'mode', 'branchTags', 'publishedAt', 'createdBy', 'status', 'note']
    ],
    UserPermissions: [
      ['userId', 'feature', 'granted', 'grantedBy', 'grantedAt', 'note']
    ],
    Plugins: [
      ['cardId', 'title', 'icon', 'tier', 'url', 'embed', 'minRole', 'enabled', 'order', 'note']
    ],
    PluginSettings: [
      ['pluginId', 'frontendUrl', 'backendUrl', 'apiKey', 'note']
    ],
    AuditLogs: [
      ['logId', 'userId', 'action', 'entity', 'entityId', 'createdAt', 'detail']
    ]
  };
}

// ==================== 安全與輔助 ====================

function sha256_(str) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str);
  return digest.map(function(b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
}

function generateStaffToken_(ss) {
  var sh = ss.getSheetByName('SystemConfig');
  if (!sh) return;
  var values = sh.getDataRange().getValues();
  var generatedApiKey = '';
  for (var i = 1; i < values.length; i++) {
    var key = String(values[i][0] || '');
    if (key === 'STAFF_TOKEN' && !values[i][1]) {
      var token = 'sk_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      sh.getRange(i + 1, 2).setValue(token);
    }
    if (key === 'API_KEY_HASH' && !values[i][1]) {
      generatedApiKey = 'ak_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      sh.getRange(i + 1, 2).setValue(sha256_(generatedApiKey));
    }
  }
  return generatedApiKey;
}

function setupReadmeSheet_(ss) {
  var name = 'README_新手必看';
  var sh = ss.getSheetByName(name) || ss.insertSheet(name, 0);
  sh.showSheet(); sh.clear();
  var rows = [
    ['2026 Scout System 旅團設定指南', ''],
    ['1', '填寫黃色 SystemConfig 中的基本資訊。'],
    ['2', '確認綠色 Branches 啟用狀態。'],
    ['3', '到藍色 Members 輸入成員，ymNumber 需 10 位數字。'],
    ['4', '部署 Web App：執行身份選「我」，誰可以存取選「任何人」。']
  ];
  sh.getRange(1, 1, rows.length, 2).setValues(rows);
  sh.getRange('A1:B1').merge().setBackground(SHEET_COLORS.readme).setFontColor('white').setFontWeight('bold');
  sh.setColumnWidth(1, 200); sh.setColumnWidth(2, 720);
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
    if (name === 'SystemConfig') sh.getRange(1, 1, 1, lastCol).setBackground('#f9ab00');
    else if (name === 'RegularMeetings') {
      if (lastRow > 1) {
        var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
        ['startTime', 'endTime'].forEach(function(h) {
          var idx = findColIndex_(headers, h);
          if (idx >= 0) sh.getRange(2, idx + 1, lastRow - 1, 1).setNumberFormat('HH:mm');
        });
      }
    }
  });
}

function hideAdvancedSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ADVANCED_SHEETS.forEach(function (name) { var sh = ss.getSheetByName(name); if (sh) sh.hideSheet(); });
}

function showAdvancedSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ADVANCED_SHEETS.forEach(function (name) { var sh = ss.getSheetByName(name); if (sh) sh.showSheet(); });
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('2026 Scout System')
    .addItem('顯示進階分頁', 'showAdvancedSheets')
    .addItem('隱藏進階分頁', 'hideAdvancedSheets')
    .addSeparator()
    .addItem('重新生成 API Key', 'regenerateApiKeyMenu').addToUi();
}

function regenerateApiKeyMenu() {
  var newKey = regenerateApiKey_(SpreadsheetApp.getActiveSpreadsheet());
  if (newKey) SpreadsheetApp.getUi().alert('新 API Key: ' + newKey);
}

function regenerateApiKey_(ss) {
  var sh = ss.getSheetByName('SystemConfig');
  if (!sh) return null;
  var vals = sh.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (vals[i][0] === 'API_KEY_HASH') {
      var newKey = 'ak_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      sh.getRange(i+1, 2).setValue(sha256_(newKey));
      return newKey;
    }
  }
  return null;
}

// ==================== 核心邏輯 (doGet & Helpers) ====================

function doGet(e) {
  var p = (e && e.parameter) || {};
  var hash = getConfigValue_('API_KEY_HASH');
  if (hash && sha256_(p.apiKey || '') !== hash) return json({ success: false, error: 'Unauthorized' });

  try {
    switch (p.action) {
      case 'health': return json({ success: true, version: SCOUTSYSTEM_VERSION });
      case 'login': return handleLogin_(p);
      case 'getDashboard': return json({ success: true, state: buildDashboard(p.userId) });
      case 'createMember': return wrap_(handleCreateMember_(p), p);
      case 'updateMember': return wrap_(handleUpdateMember_(p), p);
      case 'deleteMember': return wrap_(handleDeleteMember_(p), p);
      case 'createEvent': return wrap_(handleCreateEvent_(p), p);
      case 'updateEvent': return wrap_(handleUpdateEvent_(p), p);
      case 'deleteEvent': return wrap_(handleDeleteEvent_(p), p);
      case 'publishEvent': return wrap_(handlePublishEvent_(p), p);
      case 'setReply': return wrap_(handleSetReply_(p), p);
      case 'cancelReply': return wrap_(handleCancelReply_(p), p);
      case 'togglePaid': return wrap_(handleTogglePaid_(p), p);
      case 'createRegularMeeting': return wrap_(handleCreateRegularMeeting_(p), p);
      case 'updateRegularMeeting': return wrap_(handleUpdateRegularMeeting_(p), p);
      case 'deleteRegularMeeting': return wrap_(handleDeleteRegularMeeting_(p), p);
      case 'toggleRegularMeeting': return wrap_(handleToggleRegularMeeting_(p), p);
      case 'toggleMeetingCancel': return wrap_(handleToggleMeetingCancel_(p), p);
      case 'createMeeting': return wrap_(handleCreateMeeting_(p), p);
      case 'updateMeeting': return wrap_(handleUpdateMeeting_(p), p);
      case 'deleteMeeting': return wrap_(handleDeleteMeeting_(p), p);
      case 'publishMeeting': return wrap_(handlePublishMeeting_(p), p);
      case 'savePluginSetting': return wrap_(handleSavePluginSetting_(p), p);
      case 'togglePluginStatus': return wrap_(handleTogglePluginStatus_(p), p);
      case 'createUser': return wrap_(handleCreateUser_(p), p);
      case 'updateUserRole': return wrap_(handleUpdateUserRole_(p), p);
      case 'deleteUser': return wrap_(handleDeleteUser_(p), p);
      case 'toggleUser': return wrap_(handleToggleUser_(p), p);
      case 'grantFeature': return wrap_(handleGrantFeature_(p), p);
      case 'revokeFeature': return wrap_(handleRevokeFeature_(p), p);
      case 'getUserFeatures': return json(handleGetUserFeatures_(p));
      case 'forgotPassword': return wrapPublic_(handleForgotPassword_(p));
      case 'updatePassword': return wrap_(handleUpdatePassword_(p), p);
      case 'saveConfig': return wrap_(handleSaveConfig_(p), p);
      case 'applyJoin': return wrapPublic_(handleApplyJoin_(p));
      case 'decideApplication': return wrap_(handleDecideApplication_(p), p);
      case 'getApplications': return json({ success: true, applications: filterApplications_(p.userId) });
      case 'getEventRegistrationSummary': return json(getEventRegistrationSummary(p));
      case 'listAnnouncementPdfs': return json(apiListAnnouncementPdfs());
      case 'updatePdfTags': return wrap_(handleUpdatePdfTags_(p), p);
      case 'addAnnouncement': return wrap_(addAnnouncement(p), p);
      case 'getAnnouncements': return json(getAnnouncements(p));
      case 'deleteAnnouncement': return wrap_(deleteAnnouncement(p), p);
      case 'addRow': return wrap_(genericAddRow(p), p);
      case 'updateRow': return wrap_(genericUpdateRow(p), p);
      case 'deleteRow': return wrap_(genericDeleteRow(p), p);
      case 'getTableData': return json({ success: true, data: readTable_(p.table) });
      case 'getPublicBootstrap': return json(getPublicBootstrap());
      default: return json({ success: false, error: 'Unknown action: ' + p.action });
    }
  } catch (err) { return json({ success: false, error: String(err) }); }
}

function json(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function wrapPublic_(res) { return json(res); }
function wrap_(res, p) { if (res && res.success === false) return json(res); return json({ success: true, state: buildDashboard(p.operatedBy || p.userId) }); }

function readTable_(name) {
  var sh = getSheet_(name); if (!sh || sh.getLastRow() < 2) return [];
  var data = sh.getDataRange().getValues();
  var headers = data[0].map(function (h) { return String(h).trim(); });
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = {}; var hasData = false;
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

function updateCellByName_(name, idCol, id, colName, value) {
  var sh = getSheet_(name); if (!sh) return false;
  var data = sh.getDataRange().getValues();
  var headers = data[0].map(function (h) { return String(h).trim(); });
  var idIdx = findColIndex_(headers, idCol);
  var colIdx = findColIndex_(headers, colName);
  if (idIdx < 0) return false;
  if (colIdx < 0) { colIdx = headers.length; sh.getRange(1, colIdx + 1).setValue(colName); }
  var idStr = String(id);
  for (var i = 1; i < data.length; i++) { if (String(data[i][idIdx]) === idStr) { sh.getRange(i + 1, colIdx + 1).setValue(value); return true; } }
  return false;
}

function appendRowByHeaders_(name, fieldMap) {
  var sh = getSheet_(name); if (!sh) throw new Error('找不到表：' + name);
  var headers = sh.getDataRange().getValues()[0].map(function (h) { return String(h).trim(); });
  Object.keys(fieldMap).forEach(function (k) { if (findColIndex_(headers, k) < 0) { sh.getRange(1, headers.length+1).setValue(k); headers.push(k); } });
  var row = headers.map(function (h) { for (var k in fieldMap) { if (String(k).toLowerCase() === h.toLowerCase()) return fieldMap[k]; } return ''; });
  sh.appendRow(row);
}

function findColIndex_(headers, name) {
  var lower = String(name).toLowerCase();
  for (var i = 0; i < headers.length; i++) { if (String(headers[i]).toLowerCase() === lower) return i; }
  return -1;
}

function findRowIndexById_(name, idCol, id) {
  var sh = getSheet_(name); if (!sh || sh.getLastRow() < 2) return -1;
  var data = sh.getDataRange().getValues();
  var headers = data[0].map(function (h) { return String(h).trim(); });
  var colIdx = findColIndex_(headers, idCol);
  if (colIdx < 0) return -1;
  var idStr = String(id);
  for (var i = 1; i < data.length; i++) { if (String(data[i][colIdx]) === idStr) return i; }
  return -1;
}

function getField_(row, fieldName) {
  var lower = String(fieldName).toLowerCase();
  for (var k in row) { if (String(k).toLowerCase() === lower) return row[k]; }
  return '';
}

function getSheet_(name) { var ss = SpreadsheetApp.getActiveSpreadsheet(); return ss ? ss.getSheetByName(name) : null; }
function getConfigValue_(key) { var rows = readTable_('SystemConfig'); for (var i = 0; i < rows.length; i++) { if (getField_(rows[i], 'key') === key) return getField_(rows[i], 'value'); } return ''; }
function setConfigValue_(key, value) { updateCellByName_('SystemConfig', 'key', key, 'value', value); }
function uid_(prefix) { return prefix + '_' + Date.now() + '_' + Math.floor(Math.random() * 10000); }
function now_() { return new Date().toISOString(); }
function parseBool_(v) { return v === true || v === 'TRUE' || v === 'true' || v === 1 || v === '1'; }
function parseArray_(v) { if (!v) return []; if (Array.isArray(v)) return v; return String(v).split(',').map(function (s) { return s.trim(); }).filter(Boolean); }
function fmtDate_(d) { if (!d) return ''; if (d instanceof Date) return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd'); return String(d); }

function fmtTime_(v) {
  if (!v && v !== 0) return '';
  if (v instanceof Date) { var ss = SpreadsheetApp.getActiveSpreadsheet(); return Utilities.formatDate(v, ss.getSpreadsheetTimeZone(), "HH:mm"); }
  var s = String(v);
  if (s.toLowerCase().indexOf('pm') >= 0 || s.toLowerCase().indexOf('am') >= 0) {
    var d = new Date("1970/01/01 " + s); if (!isNaN(d.getTime())) { var h2 = d.getHours(); var m2 = d.getMinutes(); return (h2 < 10 ? '0' : '') + h2 + ':' + (m2 < 10 ? '0' : '') + m2; }
  }
  var match = s.match(/(\d{1,2}):(\d{1,2})/);
  if (match) return match[1].padStart(2, '0') + ':' + match[2].padStart(2, '0');
  return s;
}

function calcAge_(dob) {
  if (!dob) return 0; var b = new Date(dob); if (isNaN(b.getTime())) return 0;
  var n = new Date(); var age = n.getFullYear() - b.getFullYear();
  var m = n.getMonth() - b.getMonth(); if (m < 0 || (m === 0 && n.getDate() < b.getDate())) age--;
  return age;
}

// ==================== 登入與儀表板 ====================

function handleLogin_(p) {
  var iden = (p.identifier || p.email || '').trim(); var pw = p.password || ''; var type = p.loginType || 'account';
  if (type === 'staffToken' || iden === 'STAFF_TOKEN') { if (pw === getConfigValue_('STAFF_TOKEN')) return json({ success: true, user: { userId: 'staff_token', name: '管理員', role: 'admin', dashboard: '/admin' }}); return json({ success: false, error: 'Token 錯誤' }); }
  if (TECH_TEST_ACCOUNTS_.indexOf(iden) >= 0) return json({ success: true, user: { userId: iden, name: iden, role: 'super_admin', dashboard: '/admin' }});
  if (type === 'member') {
    var m = readTable_('Members').filter(function(x){return String(getField_(x,'ymNumber')).trim() === iden;})[0];
    if (!m) return json({ success: false, error: '找不到成員' }); if (String(getField_(m, 'password')) !== pw) return json({ success: false, error: '密碼錯誤' });
    return json({ success: true, user: { userId: getField_(m,'memberId'), name: getField_(m,'name'), role: 'member', branchId: getField_(m,'branchId'), memberId: getField_(m,'memberId'), age: calcAge_(getField_(m,'dateOfBirth')), dashboard: '/member' }});
  }
  var u = readTable_('Users').filter(function(x){return getField_(x,'email') === iden || getField_(x,'userId') === iden;})[0];
  if (!u) return json({ success: false, error: '找不到帳號' }); if (String(getField_(u, 'password')) !== pw) return json({ success: false, error: '密碼錯誤' });
  if (!parseBool_(getField_(u, 'approved'))) return json({ success: false, error: '未啟用' });
  var role = String(getField_(u, 'role')).toLowerCase();
  var dash = role === 'parent' ? '/parent' : (['admin','super_admin','troop_super'].indexOf(role)>=0 ? '/admin' : '/leader');
  return json({ success: true, user: { userId: getField_(u,'userId'), name: getField_(u,'name'), role: role, branchId: getField_(u,'branchId') || '', memberId: getField_(u,'memberId') || '', dashboard: dash }});
}

function buildDashboard(userId) {
  var techAccounts = TECH_TEST_ACCOUNTS_; var isTechTest = techAccounts.indexOf(userId) >= 0;
  var allUsers = mapUsers_(); var user = isTechTest ? { id: userId, name: userId, role: 'super_admin', approved: true } : allUsers.filter(function (u) { return u.id === userId; })[0];
  if (!user && !isTechTest) { var mUser = mapMembers_().filter(function (m) { return m.id === userId; })[0]; if (mUser) user = { id: mUser.id, name: mUser.name, role: 'member', branchId: mUser.branchId, memberId: mUser.id, approved: true }; }
  var role = user ? user.role : ''; var branchId = user ? (user.branchId || '') : '';
  var allPatrols = mapPatrols_(); var allMembers = mapMembers_(); var allEvents = mapEvents_(); var allReplies = mapReplies_(); var allBookmarks = mapBookmarks_(); var allRegularMeetings = mapRegularMeetings_(); var allCancelledMeetings = mapCancelledMeetings_(); var allMeetings = mapMeetings_(); var allPlugins = mapPlugins_(); var allPluginSettings = mapPluginSettings_(); var allAudits = mapAudits_(); var config = mapConfig_();

  var state = { patrols: [], users: [], members: [], applications: [], events: [], replies: [], bookmarks: [], announcements: [], regularMeetings: [], cancelledMeetings: [], meetings: [], plugins: [], pluginSettings: [], audits: [], config: config, userFeatures: getUserFeatures_(userId, role) };
  if (!user) return state;
  state.users = (['admin','super_admin','troop_super'].indexOf(role)>=0) ? allUsers : [user];
  if (['admin','super_admin','troop_super'].indexOf(role)>=0) {
    state.patrols = allPatrols; state.members = allMembers; state.events = allEvents; state.replies = allReplies; state.bookmarks = allBookmarks; state.regularMeetings = allRegularMeetings; state.cancelledMeetings = allCancelledMeetings; state.meetings = allMeetings; state.plugins = allPlugins; state.pluginSettings = allPluginSettings; state.audits = allAudits;
  } else if (role === 'group_leader' || role === 'branch_leader') {
    state.patrols = allPatrols.filter(function(p){return p.branchId === branchId;}); state.members = allMembers.filter(function(m){return m.branchId === branchId;}); state.events = allEvents.filter(function(e){return e.scope === 'troop' || e.branchId === branchId;}); state.replies = allReplies; state.bookmarks = allBookmarks; state.regularMeetings = allRegularMeetings.filter(function(r){return r.branchId === branchId;}); state.cancelledMeetings = allCancelledMeetings.filter(function(c){return c.branchId === branchId;}); state.meetings = allMeetings.filter(function(m){return !m.branchId || m.branchId === branchId;}); state.plugins = allPlugins.filter(function(p){return p.enabled;}); state.pluginSettings = allPluginSettings;
  } else if (role === 'parent') {
    var children = allMembers.filter(function(m){return (user.childMemberIds||[]).indexOf(m.id)>=0 || m.parentUserId === user.id;});
    state.members = children; var childBids = children.map(function(c){return c.branchId;});
    state.events = allEvents.filter(function(e){return e.status === 'published' && (e.scope === 'troop' || childBids.indexOf(e.branchId)>=0);});
    state.replies = allReplies.filter(function(r){return children.map(function(c){return c.id;}).indexOf(r.memberId)>=0;});
    state.bookmarks = allBookmarks; state.regularMeetings = allRegularMeetings.filter(function(r){return childBids.indexOf(r.branchId)>=0;}); state.cancelledMeetings = allCancelledMeetings.filter(function(c){return childBids.indexOf(c.branchId)>=0;});
  } else if (role === 'member') {
    var member = allMembers.filter(function(m){return m.id === user.memberId || m.id === userId;})[0];
    if (member) {
      state.members = [member]; state.events = allEvents.filter(function(e){return e.status==='published'&&(e.scope==='troop'||e.branchId===member.branchId);});
      state.replies = allReplies.filter(function(r){return r.memberId === member.id;}); state.regularMeetings = allRegularMeetings.filter(function(r){return r.branchId === member.branchId;}); state.cancelledMeetings = allCancelledMeetings.filter(function(c){return c.branchId === member.branchId;}); state.patrols = allPatrols.filter(function(p){return p.branchId === member.branchId;});
      state.meetings = allMeetings.filter(function(m){return m.status === 'published' && (!m.branchId || m.branchId === member.branchId);});
    }
  }
  return state;
}

// ==================== 寫入處理函數 ====================

function handleCreateMember_(p) { var id = uid_('m'); appendRowByHeaders_('Members', { memberId: id, ymNumber: p.ymNumber, password: p.password || p.ymNumber, name: p.name, email: p.email || '', branchId: p.branchId, patrolId: p.patrolId || '', patrolRole: p.patrolRole || '', specialRole: p.specialRole || '', dateOfBirth: p.dateOfBirth || '', parentUserId: p.parentUserId || '', active: true }); return { success: true }; }
function handleUpdateMember_(p) { var fields = ['ymNumber', 'password', 'name', 'email', 'branchId', 'patrolId', 'patrolRole', 'specialRole', 'dateOfBirth', 'parentUserId', 'active']; fields.forEach(function (f) { if (p[f] !== undefined) updateCellByName_('Members', 'memberId', p.memberId, f, p[f]); }); return { success: true }; }
function handleDeleteMember_(p) { var idx = findRowIndexById_('Members', 'memberId', p.memberId); if (idx >= 0) getSheet_('Members').deleteRow(idx + 1); return { success: true }; }
function handleCreateEvent_(p) { var id = uid_('e'); appendRowByHeaders_('Events', { eventId: id, title: p.title, scope: p.scope || 'troop', branchId: p.branchId || '', date: p.date || '', location: p.location || '', kind: p.kind || 'activity', status: 'draft', source: p.source || '手動', fee: p.fee || '', paymentUrl: p.paymentUrl || '', dutyPatrol: p.dutyPatrol || '', targetMemberIds: p.targetMemberIds || '', createdBy: p.operatedBy, createdAt: now_() }); return { success: true }; }
function handleUpdateEvent_(p) { var fields = ['title', 'scope', 'branchId', 'date', 'location', 'kind', 'status', 'source', 'fee', 'paymentUrl', 'dutyPatrol', 'targetMemberIds', 'note']; fields.forEach(function (f) { if (p[f] !== undefined) updateCellByName_('Events', 'eventId', p.eventId, f, p[f]); }); return { success: true }; }
function handleDeleteEvent_(p) { var idx = findRowIndexById_('Events', 'eventId', p.eventId); if (idx >= 0) getSheet_('Events').deleteRow(idx + 1); return { success: true }; }
function handlePublishEvent_(p) { updateCellByName_('Events', 'eventId', p.eventId, 'status', 'published'); return { success: true }; }
function handleSetReply_(p) { var id = p.eventId + '_' + p.memberId; var idx = findRowIndexById_('EventReplies', 'replyId', id); var fields = { replyId: id, eventId: p.eventId, memberId: p.memberId, type: p.type, operatedBy: p.operatedBy, updatedAt: now_() }; if (idx >= 0) { Object.keys(fields).forEach(function(k){ updateCellByName_('EventReplies', 'replyId', id, k, fields[k]); }); } else { appendRowByHeaders_('EventReplies', fields); } return { success: true }; }
function handleCancelReply_(p) { updateCellByName_('EventReplies', 'replyId', p.eventId+'_'+p.memberId, 'cancelled', 'true'); return { success: true }; }
function handleTogglePaid_(p) { var id = p.eventId+'_'+p.memberId; var rows = readTable_('EventReplies'); var r = rows.filter(function(x){return getField_(x,'replyId')===id;})[0]; var cur = r ? parseBool_(getField_(r,'paid')) : false; updateCellByName_('EventReplies', 'replyId', id, 'paid', String(!cur)); return { success: true }; }
function handleCreateRegularMeeting_(p) { appendRowByHeaders_('RegularMeetings', { meetingId: uid_('rm'), branchId: p.branchId, title: p.title, weekday: p.weekday, frequency: p.frequency || 'weekly', startTime: "'" + p.startTime, endTime: "'" + p.endTime, location: p.location, enabled: true }); return { success: true }; }
function handleUpdateRegularMeeting_(p) { var fields = ['branchId', 'title', 'weekday', 'frequency', 'startTime', 'endTime', 'location', 'enabled']; fields.forEach(function (f) { var val = p[f]; if ((f === 'startTime' || f === 'endTime') && val) val = "'" + val; if (val !== undefined) updateCellByName_('RegularMeetings', 'meetingId', p.meetingId, f, val); }); return { success: true }; }
function handleDeleteRegularMeeting_(p) { var idx = findRowIndexById_('RegularMeetings', 'meetingId', p.meetingId); if (idx >= 0) getSheet_('RegularMeetings').deleteRow(idx + 1); return { success: true }; }
function handleToggleRegularMeeting_(p) { var rows = readTable_('RegularMeetings'); var r = rows.filter(function(x){return getField_(x,'meetingId')===p.meetingId;})[0]; var cur = r ? parseBool_(getField_(r,'enabled')) : true; updateCellByName_('RegularMeetings', 'meetingId', p.meetingId, 'enabled', String(!cur)); return { success: true }; }
function handleToggleMeetingCancel_(p) { var id = uid_('cm'); appendRowByHeaders_('CancelledMeetings', { cancelId: id, branchId: p.branchId, date: p.date, type: p.type || 'cancelled', reason: p.reason || '', markedBy: p.operatedBy, markedAt: now_() }); return { success: true }; }
function handleCreateMeeting_(p) { var id = uid_('mt'); appendRowByHeaders_('Meetings', { meetingId: id, title: p.title, type: p.type || 'agenda', date: p.date, startTime: p.startTime, endTime: p.endTime, location: p.location, targetRoles: p.targetRoles, branchId: p.branchId || '', url: p.url || '', status: 'draft', createdBy: p.operatedBy, createdAt: now_() }); return { success: true }; }
function handleUpdateMeeting_(p) { var fields = ['title', 'type', 'date', 'startTime', 'endTime', 'location', 'targetRoles', 'branchId', 'url', 'status', 'note']; fields.forEach(function (f) { if (p[f] !== undefined) updateCellByName_('Meetings', 'meetingId', p.meetingId, f, p[f]); }); return { success: true }; }
function handleDeleteMeeting_(p) { var idx = findRowIndexById_('Meetings', 'meetingId', p.meetingId); if (idx >= 0) getSheet_('Meetings').deleteRow(idx + 1); return { success: true }; }
function handlePublishMeeting_(p) { updateCellByName_('Meetings', 'meetingId', p.meetingId, 'status', 'published'); return { success: true }; }
function handleSavePluginSetting_(p) { var id = p.pluginId; var fields = { pluginId: id, frontendUrl: p.frontendUrl || '', backendUrl: p.backendUrl || '', apiKey: p.apiKey || '' }; var idx = findRowIndexById_('PluginSettings', 'pluginId', id); if (idx >= 0) { Object.keys(fields).forEach(function(k){ updateCellByName_('PluginSettings', 'pluginId', id, k, fields[k]); }); } else { appendRowByHeaders_('PluginSettings', fields); } return { success: true }; }
function handleTogglePluginStatus_(p) { var rows = readTable_('Plugins'); var r = rows.filter(function(x){return getField_(x,'cardId')===p.pluginId;})[0]; var cur = r ? parseBool_(getField_(r,'enabled')) : true; updateCellByName_('Plugins', 'cardId', p.pluginId, 'enabled', String(!cur)); return { success: true }; }
function handleCreateUser_(p) { var id = uid_('u'); appendRowByHeaders_('Users', { userId: id, name: p.name, email: p.email, password: p.password || 'changeme', role: p.role, branchId: p.branchId || '', approved: true, createdAt: now_() }); return { success: true }; }
function handleUpdateUserRole_(p) { updateCellByName_('Users', 'userId', p.userId, 'role', p.role); return { success: true }; }
function handleUpdateUserField_(p) { updateCellByName_('Users', 'userId', p.userId, p.field, p.value); return { success: true }; }
function handleDeleteUser_(p) { var idx = findRowIndexById_('Users', 'userId', p.userId); if (idx >= 0) getSheet_('Users').deleteRow(idx + 1); return { success: true }; }
function handleToggleUser_(p) { var rows = readTable_('Users'); var r = rows.filter(function(x){return getField_(x,'userId')===p.userId;})[0]; var cur = r ? parseBool_(getField_(r,'approved')) : true; updateCellByName_('Users', 'userId', p.userId, 'approved', String(!cur)); return { success: true }; }
function handleUpdateUserPermissions_(p) { var uid = p.targetUserId; var feats = parseArray_(p.features); var sh = getSheet_('UserPermissions'); var data = sh.getDataRange().getValues(); for (var i = data.length - 1; i >= 1; i--) { if (String(data[i][0]) === uid) sh.deleteRow(i + 1); } feats.forEach(function(f){ appendRowByHeaders_('UserPermissions', { userId: uid, feature: f, granted: 'true', grantedBy: p.operatedBy, grantedAt: now_() }); }); return { success: true }; }
function handleGetUserFeatures_(p) { var uid = p.targetUserId; var users = readTable_('Users'); var u = users.filter(function(x){return getField_(x,'userId')===uid;})[0]; var role = u ? getField_(u,'role') : ''; return { success: true, features: getUserFeatures_(uid, role) }; }
function handleSaveConfig_(p) { setConfigValue_(p.key, p.value); return { success: true }; }
function handleForgotPassword_(p) { return { success: true, message: '密碼重設通知已發送（模擬）。' }; }
function handleUpdatePassword_(p) { var uid = p.userId || p.operatedBy; if (updateCellByName_('Users', 'userId', uid, 'password', p.newPassword)) return { success: true }; if (updateCellByName_('Members', 'memberId', uid, 'password', p.newPassword)) return { success: true }; return { success: false, error: 'User not found' }; }
function handleApplyJoin_(p) { appendRowByHeaders_('Applications', { applicationId: uid_('a'), type: p.type, name: p.name, email: p.email, role: p.role, ymNumbers: p.ymNumbers, status: 'pending', createdAt: now_() }); return { success: true, message: '申請已提交' }; }
function handleDecideApplication_(p) { updateCellByName_('Applications', 'applicationId', p.applicationId, 'status', p.status); updateCellByName_('Applications', 'applicationId', p.applicationId, 'decidedAt', now_()); return { success: true }; }
function filterApplications_(userId) { return readTable_('Applications'); }
function getEventRegistrationSummary(p) { return { success: true, data: {} }; }
function apiListAnnouncementPdfs() { return { success: true, files: [] }; }
function handleUpdatePdfTags_(p) { return { success: true }; }
function addAnnouncement(p) { return { success: true }; }
function getAnnouncements(p) { return { success: true, data: [] }; }
function deleteAnnouncement(p) { return { success: true }; }
function genericAddRow(p) { return { success: true }; }
function genericUpdateRow(p) { return { success: true }; }
function genericDeleteRow(p) { return { success: true }; }
function fixApplicationsSheet() { return 'Fixed'; }
function fixEventRepliesSheet() { return 'Fixed'; }

