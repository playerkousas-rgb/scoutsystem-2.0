/** ScoutSystem 2.0 小白初始化草稿
 * 目標：像 DBS 3.0 一樣，初始化後只顯示小白需要看的分頁；
 * 系統後台表會自動上色、加說明、凍結表頭、隱藏，避免旅團看到太多分頁。
 */
var SCOUTSYSTEM_VERSION = '2.0-ui';

var SHEET_COLORS = {
  readme: '#0b5cab',       // 藍：新手入口
  config: '#fbbc04',       // 黃：必須人手填
  editable: '#34a853',     // 綠：旅團可按實際情況修改
  data: '#4285f4',         // 藍：日常資料
  system: '#9aa0a6',       // 灰：系統設定 / 通常隱藏
  audit: '#d93025'         // 紅：紀錄 / 不應手改
};

var VISIBLE_SHEETS_FOR_BEGINNERS = [
  'README_新手必看',
  'SystemConfig',
  'Branches',
  'Patrols',
  'Members'
];

var ADVANCED_SHEETS = [
  'Roles',
  'FieldSettings',
  'Users',
  'Applications',
  'Events',
  'EventReplies',
  'LibraryBookmarks',
  'Announcements',
  'RegularMeetings',
  'CancelledMeetings',
  'Notices',
  'Plugins',
  'AuditLogs'
];

function setupScoutSystem() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('請先在 Google Sheet 中開啟 Apps Script，再執行 setupScoutSystem()');

  var sheets = getInitialSheets_();

  Object.keys(sheets).forEach(function(name){
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    sh.showSheet();
    sh.clear();
    sh.getRange(1,1,sheets[name].length,sheets[name][0].length).setValues(sheets[name]);
    sh.setFrozenRows(1);
  });

  setupReadmeSheet_(ss);
  formatScoutSystemSheets_(ss);
  addHelpfulNotes_(ss);
  hideAdvancedSheets();

  var readme = ss.getSheetByName('README_新手必看');
  if (readme) ss.setActiveSheet(readme);

  SpreadsheetApp.getUi().alert(
    'ScoutSystem 2.0 初始化完成',
    '已建立工作表、標記顏色、加上欄位說明，並隱藏進階後台分頁。\n\n請先照 README_新手必看：\n1. 到黃色 SystemConfig 填旅團資料\n2. 到綠色 Branches / Patrols 修改支部及小隊 / 六\n3. 到藍色 Members 貼入或建立成員\n4. 需要進階表時，用上方 ScoutSystem 2.0 選單 → 顯示進階分頁',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function setup() {
  setupScoutSystem();
}

function getInitialSheets_() {
  return {
    SystemConfig: [
      ['key','value','note'],
      ['TROOP_CODE','0082','必填：旅團號，純數字；例如 0082。插件會用 u=0082 識別本旅。'],
      ['TROOP_NAME','第82旅','必填：旅團顯示名稱。'],
      ['ADMIN_EMAIL','','必填：第一位管理員 Email。'],
      ['FRONTEND_URL','','部署到 Vercel 後填入，例如 https://your-scoutsystem.vercel.app'],
      ['ANNOUNCEMENT_FOLDER_ID','','日常公告 PDF Google Drive 資料夾 ID。'],
      ['ANNOUNCEMENT_FOLDER_URL','','日常公告 PDF Google Drive 資料夾 URL。'],
      ['WEB_APP_URL','','Apps Script Deploy 後自動或人手填入 /exec URL。'],
      ['REGISTRY_URL','https://troop-router.vercel.app/api/registry.json','轉駁器 registry；正常不用改。'],
      ['TECH_TEST_ACCOUNTS','sheep,0728','技術測試帳號，權限等同最高但不是超管 / 旅團管理層。'],
      ['STAFF_TOKEN','','選填：後台 API token；正式接 API 時使用。']
    ],
    Roles: [
      ['role','label','level','note'],
      ['super_admin','技術測試帳號（權限等同最高）',100,'Sheep / 0728 類測試帳號；不是旅團超管身份。'],
      ['admin','管理員',90,'管理所有支部。'],
      ['group_leader','團長',70,'管理所屬支部 / 可按權限放元件給下級。'],
      ['branch_leader','支部領袖',60,'管理所屬支部。'],
      ['coach','教練員',50,'可標記圖書館；申請審核無權。'],
      ['parent','家長',20,'代 18 歲以下子女回覆活動。'],
      ['member','成員',10,'18 歲以下只可表示有興趣；18 歲以上可自行回覆。']
    ],
    Branches: [
      ['branchId','name','enabled','note'],
      ['b1','小童軍支部',true,'預設沒有分隊。'],
      ['b2','幼童軍支部',true,'按顏色分隊 / 六。'],
      ['b3','童軍支部',true,'按動物名稱小隊。'],
      ['b4','深資童軍支部',true,'預設沒有分隊。'],
      ['b5','樂行童軍支部',true,'預設沒有分隊。']
    ],
    Patrols: [
      ['patrolId','branchId','name','shortName','leaderMemberId','deputyLeaderMemberId','memberIds','enabled','order','note'],
      ['p1','b2','紅色六','紅','','','',true,1,'幼童軍顏色分隊，可改名。'],
      ['p2','b2','黃色六','黃','','','',true,2,'幼童軍顏色分隊，可改名。'],
      ['p3','b2','藍色六','藍','','','',true,3,'幼童軍顏色分隊，可改名。'],
      ['p4','b2','綠色六','綠','','','',true,4,'幼童軍顏色分隊，可改名。'],
      ['p5','b3','猛虎小隊','虎','','','',true,1,'童軍動物名稱小隊，可改名。'],
      ['p6','b3','雄鷹小隊','鷹','','','',true,2,'童軍動物名稱小隊，可改名。'],
      ['p7','b3','灰狼小隊','狼','','','',true,3,'童軍動物名稱小隊，可改名。']
    ],
    FieldSettings: [
      ['key','label','enabled','required','note'],
      ['ymNumber','YMIS 編號',true,true,'建議用純文字格式。'],
      ['name','姓名',true,true,'成員顯示姓名。'],
      ['dateOfBirth','出生日期',true,false,'用於判斷 18 歲以下 / 以上。'],
      ['emergencyContactPhone','緊急聯絡電話',true,false,'報名匯出用。'],
      ['patrolId','小隊 / 六',true,false,'不適用支部可留空。'],
      ['patrolRole','隊內身份',true,false,'leader / deputy / member / 空白。']
    ],
    Users: [['userId','name','email','role','branchId','childYmNumbers','approved','createdAt','note']],
    Applications: [['applicationId','type','name','email','role','branchId','ymNumbers','status','createdAt','approvedAt','note']],
    Members: [['memberId','ymNumber','name','branchId','patrolId','patrolRole','dateOfBirth','parentUserId','emergencyContactName','emergencyContactPhone','active','note']],
    Events: [['eventId','title','scope','branchId','date','location','kind','status','sourceRefId','createdBy','createdAt','note']],
    EventReplies: [['replyId','eventId','memberId','parentUserId','type','operatedBy','updatedAt','paid','notes']],
    LibraryBookmarks: [['bookmarkId','title','source','officialDeadline','internalDeadline','mode','branchTags','status','convertedEventId','createdBy','createdAt','note']],
    Announcements: [['announcementId','fileName','fileId','fileUrl','updatedAt','status','note']],
    RegularMeetings: [['meetingId','branchId','title','weekday','startTime','endTime','location','enabled','note'],['rm1','b3','童軍恆常集會',6,'14:00','16:00','本中心',true,'星期六恆常集會'],['rm2','b2','幼童軍恆常集會',6,'14:00','16:00','本中心',true,'星期六恆常集會']],
    CancelledMeetings: [['cancelId','branchId','date','reason','markedBy','markedAt']],
    Notices: [['noticeId','title','mode','branchTags','publishedAt','createdBy','status','note']],
    Plugins: [['cardId','title','icon','tier','url','embed','minRole','enabled','order','note']],
    AuditLogs: [['logId','userId','action','entity','entityId','createdAt','detail']]
  };
}

function setupReadmeSheet_(ss) {
  var name = 'README_新手必看';
  var sh = ss.getSheetByName(name) || ss.insertSheet(name, 0);
  sh.showSheet();
  sh.clear();
  var rows = [
    ['ScoutSystem 2.0 小白設定指南', ''],
    ['', ''],
    ['你現在需要做的事', '照順序完成右邊步驟。不要先改灰色 / 紅色後台表。'],
    ['1', '到黃色 SystemConfig 填 TROOP_CODE、TROOP_NAME、ADMIN_EMAIL、FRONTEND_URL。'],
    ['2', '到綠色 Branches 確認五個支部名稱及是否啟用。'],
    ['3', '到綠色 Patrols 修改幼童軍顏色六、童軍動物小隊；隊長 / 副隊長 / 成員可留空。'],
    ['4', '到藍色 Members 匯入或輸入成員資料；小童軍、深資、樂行可不填 patrolId。'],
    ['5', 'Apps Script Deploy 為 Web App 後，測試 ?action=health。'],
    ['6', '把 Web App URL 交回平台管理員或填入前端旅團設定。'],
    ['', ''],
    ['顏色說明', ''],
    ['藍色 README', '新手入口。'],
    ['黃色', '必須人手填的 Config。'],
    ['綠色', '旅團可按實際情況修改，例如支部、小隊 / 六。'],
    ['淺藍', '日常資料，例如 Members。'],
    ['灰色 / 紅色', '系統後台 / Audit，已隱藏，非必要不要改。'],
    ['', ''],
    ['如要看被隱藏表', '上方選單 ScoutSystem 2.0 → 顯示進階分頁。完成後可再隱藏。']
  ];
  sh.getRange(1,1,rows.length,2).setValues(rows);
  sh.getRange('A1:B1').merge().setBackground(SHEET_COLORS.readme).setFontColor('white').setFontWeight('bold').setFontSize(16);
  sh.getRange('A3:B3').setBackground('#e8f0fe').setFontWeight('bold');
  sh.getRange('A11:B11').setBackground('#e8f0fe').setFontWeight('bold');
  sh.setColumnWidth(1, 180);
  sh.setColumnWidth(2, 720);
  sh.setFrozenRows(1);
  sh.setTabColor(SHEET_COLORS.readme);
}

function formatScoutSystemSheets_(ss) {
  var all = ss.getSheets();
  all.forEach(function(sh){
    var name = sh.getName();
    var lastCol = Math.max(1, sh.getLastColumn());
    var lastRow = Math.max(1, sh.getLastRow());
    if (name !== 'README_新手必看') {
      sh.getRange(1,1,1,lastCol).setFontWeight('bold').setFontColor('white');
      sh.setFrozenRows(1);
      sh.autoResizeColumns(1,lastCol);
    }

    if (name === 'SystemConfig') {
      sh.setTabColor(SHEET_COLORS.config);
      sh.getRange(1,1,1,lastCol).setBackground('#f9ab00');
      if (lastRow > 1) sh.getRange(2,1,lastRow-1,lastCol).setBackground('#fff7d6');
      sh.setColumnWidth(1, 220); sh.setColumnWidth(2, 360); sh.setColumnWidth(3, 520);
    } else if (name === 'Branches' || name === 'Patrols') {
      sh.setTabColor(SHEET_COLORS.editable);
      sh.getRange(1,1,1,lastCol).setBackground('#188038');
      if (lastRow > 1) sh.getRange(2,1,lastRow-1,lastCol).setBackground('#e6f4ea');
    } else if (name === 'Members') {
      sh.setTabColor(SHEET_COLORS.data);
      sh.getRange(1,1,1,lastCol).setBackground('#1a73e8');
      if (lastRow > 1) sh.getRange(2,1,lastRow-1,lastCol).setBackground('#e8f0fe');
    } else if (name === 'AuditLogs') {
      sh.setTabColor(SHEET_COLORS.audit);
      sh.getRange(1,1,1,lastCol).setBackground('#d93025');
    } else if (name !== 'README_新手必看') {
      sh.setTabColor(SHEET_COLORS.system);
      sh.getRange(1,1,1,lastCol).setBackground('#5f6368');
    }
  });
}

function addHelpfulNotes_(ss) {
  var config = ss.getSheetByName('SystemConfig');
  if (config) {
    noteCell_(config, 'B2', '請填旅團號，建議 4 位純數字，例如 0082。');
    noteCell_(config, 'B3', '顯示於前端的旅團名稱。');
    noteCell_(config, 'B4', '第一位管理員 Email。');
    noteCell_(config, 'B5', 'Vercel 部署完成後填入。');
    noteCell_(config, 'B6', 'Apps Script Web App /exec URL。');
    noteCell_(config, 'B8', 'Sheep / 0728 是技術測試帳號，權限等同最高但不是超管。');
  }
  var branches = ss.getSheetByName('Branches');
  if (branches) {
    noteCell_(branches, 'A1', 'branchId 不建議隨意改，前端及成員會引用。');
    noteCell_(branches, 'C1', 'TRUE = 啟用；FALSE = 暫停顯示。');
  }
  var patrols = ss.getSheetByName('Patrols');
  if (patrols) {
    noteCell_(patrols, 'B1', '對應 Branches.branchId。小童軍 / 深資 / 樂行預設沒有分隊。');
    noteCell_(patrols, 'E1', '隊長 / 六長 memberId，可留空。');
    noteCell_(patrols, 'F1', '副隊長 / 副六長 memberId，可留空。');
    noteCell_(patrols, 'G1', '成員 memberId，可用逗號分隔；也可只在 Members 填 patrolId。');
  }
  var members = ss.getSheetByName('Members');
  if (members) {
    noteCell_(members, 'B1', 'YMIS 編號建議設為純文字格式。');
    noteCell_(members, 'E1', '對應 Patrols.patrolId；沒有分隊可留空。');
    noteCell_(members, 'F1', 'leader / deputy / member / 空白。');
    noteCell_(members, 'G1', '出生日期用於判斷 18 歲以下 / 以上。');
  }
}

function noteCell_(sheet, a1, note) {
  sheet.getRange(a1).setNote(note);
}

function hideAdvancedSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var readme = ss.getSheetByName('README_新手必看');
  if (readme) ss.setActiveSheet(readme);
  ADVANCED_SHEETS.forEach(function(name){
    var sh = ss.getSheetByName(name);
    if (sh) sh.hideSheet();
  });
}

function showAdvancedSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ADVANCED_SHEETS.forEach(function(name){
    var sh = ss.getSheetByName(name);
    if (sh) sh.showSheet();
  });
  SpreadsheetApp.getUi().alert('已顯示進階分頁。完成檢查後可用選單再隱藏。');
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('ScoutSystem 2.0')
    .addItem('顯示進階分頁', 'showAdvancedSheets')
    .addItem('隱藏進階分頁', 'hideAdvancedSheets')
    .addSeparator()
    .addItem('重新格式化 / 上色', 'reformatScoutSystem')
    .addToUi();
}

function reformatScoutSystem() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  formatScoutSystemSheets_(ss);
  addHelpfulNotes_(ss);
  SpreadsheetApp.getUi().alert('已重新上色及加入提示。');
}

function apiListAnnouncementPdfs() {
  var folderId = getConfigValue_('ANNOUNCEMENT_FOLDER_ID');
  if (!folderId) return { success:false, error:'未設定 ANNOUNCEMENT_FOLDER_ID' };
  var folder = DriveApp.getFolderById(folderId);
  var files = folder.getFilesByType(MimeType.PDF);
  var out = [];
  while (files.hasNext()) {
    var f = files.next();
    out.push({ id:f.getId(), name:f.getName(), url:f.getUrl(), updatedAt:f.getLastUpdated() });
  }
  return { success:true, files:out };
}
function getConfigValue_(key) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('SystemConfig');
  if (!sh) return '';
  var values = sh.getDataRange().getValues();
  for (var i=1;i<values.length;i++) if (values[i][0] === key) return values[i][1];
  return '';
}

function doGet(e){
  if (e.parameter.action === 'listAnnouncementPdfs') {
    return ContentService.createTextOutput(JSON.stringify(apiListAnnouncementPdfs())).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService
    .createTextOutput(JSON.stringify({
      success:true,
      version:SCOUTSYSTEM_VERSION,
      action:e.parameter.action||'health',
      ready:true
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
