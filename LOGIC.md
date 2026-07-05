# 2026 Scout System 完整邏輯文件

> **最後更新：2026-06-16**
> **用途：系統架構、資料關係、API 合約、前後端對接的單一事實來源。**
> **如果 Agent 死了，照這份重建。**

---

## 1. 系統定位

2026 Scout System 是一個**多旅團共用前端、各旅團獨立後台**的旅團管理系統。

- 前端（Next.js）部署在 Vercel，所有旅團共用一份
- 後台（Google Sheet + Apps Script）各旅團獨立一份
- 旅團連接靠前端首頁填入 Apps Script Web App URL（存 localStorage）
- 轉駁器（troop-router.vercel.app）是獨立的靜態插件 registry，跟 GS 後台無關

---

## 2. 核心資料關係

### 2.1 角色

| 角色 | role 值 | 主管 | 登入方式 |
|---|---|---|---|
| 技術測試 | `super_admin` | sheep / 0728 | 在 identifier 欄直接輸入 sheep 或 0728 |
| 管理員 | `admin` | 管理所有支部 | email + password |
| 團長 | `group_leader` | 管理所屬支部 | email + password |
| 支部領袖 | `branch_leader` | 管理所屬支部 | email + password |
| 教練員 | `coach` | 可標記圖書館、看活動；無審核權限 | email + password |
| 家長 | `parent` | 代子女回覆活動 | email + password |
| 成員 | `member` | 看自己活動，回覆 | YMIS 10位數字 + 密碼（預設為 YMIS 或 changeme） |

**重要**：sheep / 0728 不等於超管，是技術管理人員的測試帳號，權限等同最高但身份上不是旅團管理層。

### 2.1.1 密碼管理

- **更改密碼**：登入後可在「個人資料」頁面自行更改。
- **忘記密碼**：登入頁面提供「忘記密碼」功能，系統會生成隨機新密碼並發送到帳號登記的 Email。
  - 成員若未登記 Email，會嘗試發送到家長的 Email。
  - 若兩者皆無，需聯絡領袖手動重設。

### 2.2 家長 → 子女連結（雙向）

```
Members.parentUserId = 'u5'        → 這個成員的家長是 u5
Users.childMemberIds = ['m1','m2'] → 這個家長的子女（前端從 Members 自動算）
```

- 一個家長的子女可能在不同支部（例如童軍 b3 + 幼童軍 b2）
- 家長行事曆 = 多支部聯合視圖
- 家長 dashboard 只回傳自己 + 子女相關資料

### 2.3 成員年齡 → 操作權限

```
18 歲以下：
  只能 ❤️ 有興趣
  不能自己 ✅ 參加 / ❌ 不參加
  → 「真正參加 / 不參加由家長決定」
  GS 端有 guard：registered/declined 必須由家長操作

18 歲以上：
  可自行 ❤️ / ✅ / ❌
```

年齡由 `Members.dateOfBirth` 計算。

### 2.4 支部與小隊

| 支部 | branchId | 分隊規則 |
|---|---|---|
| 小童軍 | b1 | 預設沒有分隊 |
| 幼童軍 | b2 | 按顏色分隊 / 六（RED / YELLOW / BLUE / GREEN） |
| 童軍 | b3 | 按動物名稱小隊，用英文（TIGER / SEAGULL / WOLF） |
| 深資童軍 | b4 | 預設沒有分隊 |
| 樂行童軍 | b5 | 預設沒有分隊 |

- 小隊名稱各旅團可自訂（Patrols 表）
- Patrols 有 leaderMemberId（隊長）、deputyLeaderMemberId（副隊長）、memberIds（成員）
- 這些全部不是必填
- 預設規則只是方便，不鎖死，旅團可自行新增

---

## 3. 活動 / 通告 / 公告（三種東西，完全分開）

### 3.1 活動（Event）

- 整個旅團或支部要報名參與的事項
- 會加入行事曆
- 家長需要回覆 ✅ 參加 / ❌ 不參加
- 進入報名管理
- **收款連結**：領袖可填寫 FPS/PayPal 等連結，家長可直接點擊付款。
- **值日小隊**：可標記由哪個小隊值日（如 TIGER），該小隊成員會看到專屬提示。

**建立方式**：
1. 管理員在 `/admin/events` 手動新增
2. 圖書館標記選「旅團參與」模式轉入
3. Word 通告上傳選「旅團參與」模式

**scope**：
- `troop` → 全旅活動，targetMemberIds 自動填全部成員
- `branch` → 支部活動，targetMemberIds 自動填該支部成員

**kind**：
- `activity` → 普通活動（藍色）
- `notice_troop_participation` → 圖書館轉入（紫色）

**關鍵欄位**：
- `paymentUrl`：收款跳轉連結。
- `dutyPatrol`：值日小隊名稱。

### 3.2 通告（LibraryBookmark / 圖書館引入）

從外部圖書館系統（scout-circulars）引入的通告。

**兩種模式**：
- `informational`（資訊性）：只作通告提醒，不加入行事曆，不需要家長回覆
- `troop_participation`（旅團參與）：轉成活動，加入行事曆，家長需要回覆

**引入方式**：
1. `/library/import` 手動輸入
2. Word 通告上傳 `/notices/upload`

**新增功能**：支持 `paymentUrl` 收款連結。

### 3.3 公告（Announcement PDF）

- 日常集會安排的 PDF
- 放在指定的 Google Drive 資料夾
- 前端自動列出資料夾內的 PDF
- 一點即可看整張
- 不需要家長回覆
- 不當通告、不當活動、不加入行事曆
- GS 用 `DriveApp.getFolderById(folderId)` 讀取

---

## 4. 個人化行事曆（核心邏輯）

### 4.1 行事曆上的東西

```
行事曮
├── 1. 活動 (Events)
│   ├── status = 'published' 才出現
│   ├── scope = 'troop' → 所有人看到
│   └── scope = 'branch' → 只有該支部看到
│
└── 2. 恆常集會 (RegularMeetings)
    ├── 每週固定星期幾、時間、地點
    └── 可以被 CancelledMeetings 覆蓋某一天
```

### 4.2 角色過濾

| 角色 | 看到甚麼 |
|---|---|
| 成員 | `scope=troop` + 自己支部活動 + 自己的恆常集會 |
| 家長 | 所有子女的支部活動 + 全旅活動 + 子女的恆常集會 |
| 領袖 | `scope=troop` + 自己支部活動 + 自己支部的恆常集會 + 報名統計 |
| 管理員 | 全部 |

### 4.3 declined 處理

```
成員自己 declined：
  → 從行事曆隱藏（因為已決定不參加）

家長 declined 子女：
  → 仍然顯示！
  → 因為家長可能反悔重新報名
  → 標記為 ❌ 不參加
```

### 4.4 集會取消

```
領袖在行事曆按 × 標記某日不用集會
  → 寫入 CancelledMeetings
  → 領袖 / 管理員：看到「已取消」
  → 成員：完全看不到那天有集會
  → 可按 ↺ 恢復
```

### 4.5 月曆模式

- 預設月曆模式
- 可切換清單模式
- 月曆：7 欄（星期日至星期六），每格顯示活動/集會
- 清單：按日期排序，顯示詳細資訊

### 4.6 家長子女切換

- 「全部」→ 合併所有子女的活動
- 單個子女 → 只看該子女的活動

---

## 5. GS 後台架構

### 5.1 檔案

```
gs/SCOUTSYSTEM_2_SETUP.gs  （~1493 行）
public/downloads/SCOUTSYSTEM_2_SETUP.gs.txt  （下載用副本）
```

### 5.2 Sheet 結構（17 張表）

| 表名 | 用途 | 顏色 | 可見性 |
|---|---|---|---|
| README_新手必看 | 旅團指南 | 藍 | 顯示 |
| SystemConfig | 旅團設定 | 黃 | 顯示 |
| Branches | 支部 | 綠 | 顯示 |
| Patrols | 小隊 / 六 | 綠 | 顯示 |
| Members | 成員資料 | 淺藍 | 顯示 |
| Roles | 角色定義 | 灰 | 隱藏 |
| FieldSettings | 欄位設定 | 灰 | 隱藏 |
| Users | 帳號 | 灰 | 隱藏 |
| Applications | 申請 | 灰 | 隱藏 |
| Events | 活動 | 灰 | 隱藏 |
| EventReplies | 報名回覆 | 灰 | 隱藏 |
| LibraryBookmarks | 圖書館通告 | 灰 | 隱藏 |
| Announcements | 公告 | 灰 | 隱藏 |
| RegularMeetings | 恆常集會 | 灰 | 隱藏 |
| CancelledMeetings | 取消集會 | 灰 | 隱藏 |
| Notices | 通告 | 灰 | 隱藏 |
| Plugins | 插件 | 灰 | 隱藏 |
| AuditLogs | 操作紀錄 | 紅 | 隱藏 |

### 5.2.1 API Key 認證（SHA-256 Hash + Proxy）

所有 API 請求必須帶 `apiKey` 參數，否則回傳 `Unauthorized`。

```
請求：?action=getDashboard&userId=xxx&apiKey=ak_xxxxxxxx
沒有 Key：→ {"success":false,"error":"Unauthorized: invalid or missing apiKey"}
```

**安全架構：**

```
瀏覽器 → /api/proxy → Vercel Server（從 env vars 讀 API Key）→ Google Apps Script
                                                              ↓
                                                    doGet() 用 SHA-256 驗證
```

- `API_KEY` 在 setup 時自動生成，**明文只顯示一次**（彈窗），之後再看不到
- SystemConfig 只存 `API_KEY_HASH`（SHA-256 雜湊值），無法還原明文
- GS `doGet()` 將傳入的 apiKey 做 SHA-256，與 `API_KEY_HASH` 比對
- 前端不直接呼叫 GS，而是經 `/api/proxy`，API Key 從 Vercel 環境變數讀取
- 環境變數命名：`TROOP_{旅團號}_APIKEY`（如 `TROOP_0083_APIKEY`）
- 每個旅團的 API Key 不同，形成數據隔離
- 手動連接（測試用）：前端帶 URL + API Key，proxy 直接轉發
- 忘記 Key：Sheet 選單 → 重新生成 API Key（舊 Key 即刻失效）
- 舊版兼容：如果只有 `API_KEY` 明文（無 `API_KEY_HASH`），也比對明文

### 5.3 API 端點（34 個 action）

#### 公開（不需登入）

| action | 參數 | 用途 |
|---|---|---|
| `health` | — | 連線測試 |
| `login` | identifier, password, loginType | 登入 |
| `forgotPassword` | identifier, loginType | 忘記密碼（Email 發送新密碼） |
| `applyJoin` | type, name, email, role, branchId, ymNumbers | 申請帳號 |
| `getPublicBootstrap` | — | 公開 config + branches |
| `getSystemStatus` | — | 系統鎖狀態 |
| `listAnnouncementPdfs` | — | Drive PDF 列表 |
| `toggleSystemLock` | password | 系統鎖（0728/STAFF_TOKEN） |

#### 讀取（按角色過濾）

| action | 參數 | 用途 |
|---|---|---|
| `getDashboard` | userId | **核心**：按角色回傳 AppState |
| `getApplications` | userId | 申請列表（按角色過濾） |
| `getEventRegistrationSummary` | eventId, userId | 報名摘要（含小隊統計） |

#### 寫入：帳號 / 密碼

| action | 參數 | 用途 |
|---|---|---|
| `updatePassword` | newPassword | 更改當前登入用戶密碼 |
| `createUser` | name, email, password, role, branchId | 新增帳號 |
| `toggleUser` | userId | 啟用/停用 |

#### 寫入：成員

| action | 參數 | 用途 |
|---|---|---|
| `createMember` | name, ymNumber, branchId, patrolId, dateOfBirth, parentUserId, ... | 新增成員 |
| `updateMember` | memberId, + 各欄位 | 編輯成員 |
| `linkParent` | memberId, parentUserId | 連結家長 |
| `deleteMember` | memberId | 刪除成員 |

#### 寫入：活動 / 報名

| action | 參數 | 用途 |
|---|---|---|
| `createEvent` | title, scope, branchId, date, location, fee, paymentUrl, dutyPatrol, ... | 新增活動 |
| `updateEvent` | eventId, + 各欄位 | 編輯活動 |
| `publishEvent` | eventId | 發布活動 |
| `deleteEvent` | eventId | 刪除活動 |
| `setReply` | eventId, memberId, type, parentUserId | 設定回覆（含18歲guard） |
| `cancelReply` | eventId, memberId | 取消回覆（軟刪除） |
| `togglePaid` | eventId, memberId | 切換付款狀態 |

#### 寫入：申請

| action | 參數 | 用途 |
|---|---|---|
| `decideApplication` | applicationId, status | 批核/拒絕（含建User/Member/家長連結） |

#### 寫入：小隊

| action | 參數 | 用途 |
|---|---|---|
| `createPatrol` | branchId, name, short | 新增小隊 |
| `togglePatrol` | patrolId | 啟用/停用 |

#### 寫入：圖書館 / 通告

| action | 參數 | 用途 |
|---|---|---|
| `importBookmark` | title, mode, source, deadlines, fee, paymentUrl | 引入通告（旅團參與會建Event） |
| `updateBookmark` | bookmarkId, + 各欄位 | 編輯通告 |
| `deleteBookmark` | bookmarkId | 刪除通告 |

#### 寫入：集會 / 行事曆

| action | 參數 | 用途 |
|---|---|---|
| `createRegularMeeting` | branchId, title, weekday, startTime, endTime, location | 新增集會規則 |
| `toggleRegularMeeting` | meetingId | 啟用/停用 |
| `toggleMeetingCancel` | branchId, date, reason | 取消/恢復某日集會 |

#### 寫入：設定 / 維護

| action | 參數 | 用途 |
|---|---|---|
| `saveConfig` | key, value | 修改 SystemConfig |
| `autoRepairParentLinks` | — | 自動修復家長子女連結 |

### 5.4 回傳格式

所有寫入操作（`wrap_`）成功後回傳：
```json
{ "success": true, "state": { ...更新後的Dashboard... } }
```
前端拿到後直接更新，不用再 fetch 一次。

公開操作（`wrapPublic_`）只回傳結果：
```json
{ "success": true, "applicationId": "a_xxx", "message": "申請已提交" }
```

### 5.5 角色過濾邏輯（buildDashboard）

```
admin / super_admin → 全部
group_leader / branch_leader → 所屬支部的成員、活動、申請、小隊、使用者 + 全旅活動
coach → 所屬支部成員、活動、小隊（無申請管理、無使用者管理）
parent → 自己 + 子女 + 子女相關活動/回覆（只看 published 活動）
member → 自己 + 自己支部活動/回覆
未登入 → 只有 config
```

### 5.6 Sheet 讀寫方式

- **header-based**，大小寫不敏感
- 不怕旅團改欄位順序
- 如果欄位不存在，`appendRowByHeaders_` 會自動新增
- `updateCellByName_` 也有自動新增欄位能力

---

## 6. 前端架構

### 6.1 目錄結構

```
lib/
  model.ts     → 角色定義、支部列表、小隊列表
  store.ts     → 資料型態、loadState()、純查詢函式
  api.ts       → 所有 API 呼叫
  session.ts   → localStorage session 管理
  registry.ts  → 轉駁器 registry 讀取
  noticeParser.ts → Word 通告抽取邏輯

components/
  Auth.tsx              → 權限閘門
  Cards.tsx             → SummaryCard / FeatureCard
  TopNav.tsx            → 頂欄
  RegistryMarketplace.tsx → 元件市場 / 轉駁中心

app/
  page.tsx              → 首頁（旅團連接）
  login/page.tsx        → 登入（帳號/YMIS/STAFF_TOKEN）
  apply/page.tsx        → 申請帳號
  admin/page.tsx        → 管理員控制台
  admin/members/        → 成員資料庫（可編輯）
  admin/events/         → 活動管理（可編輯）
  admin/applications/   → 申請審核
  admin/registrations/  → 報名管理
  admin/users/          → 使用者管理
  admin/branches/       → 支部與小隊設定
  admin/calendar/       → 集會規則設定
  admin/settings/       → 系統設定
  admin/audit/          → 審核紀錄
  leader/page.tsx       → 領袖控制台
  parent/page.tsx       → 家長控制台
  member/page.tsx       → 成員控制台
  calendar/page.tsx     → 個人化行事曆（月曆/清單）
  activities/page.tsx   → 活動列表
  notices/page.tsx      → 通告管理（書籤+PDF）
  notices/upload/       → Word 通告上傳
  library/page.tsx      → 圖書館
  library/import/       → 圖書館標記引入
  marketplace/          → 元件市場
  connectors/           → 轉駁中心
  setup/                → 旅團接入教學
  downloads/            → 模板下載
  troop-settings/       → 旅團設定
```

### 6.2 資料流

```
所有頁面：
  loadState() → fetchState() → api.ts → GET ?action=getDashboard&userId=xxx
  → GS buildDashboard(userId) → 角色過濾 → 回傳 AppState
  → 前端 setState() → 渲染

寫入操作：
  apiXxx() → apiMutate() → GET ?action=xxx&params
  → GS handle → 寫 Sheet + audit
  → 回傳 { success, state }
  → 前端 setState() → 即時更新
```

### 6.3 Session

```
localStorage:
  scoutsystem2_selected_troop → { id, name, webAppUrl, sheetUrl }
  scoutsystem2_current_user   → { userId, name, role, troopCode, troopName, branchId, memberId, age }
```

---

## 7. 轉駁器 / 插件系統

### 7.1 架構

```
troop-router.vercel.app/api/registry.json （靜態 JSON）
  ↓
  plugins[] → 有哪些插件、tier、url
  units[]   → 各旅團裝了甚麼、endpoints

ScoutSystem GS 完全不碰這個。
前端 lib/registry.ts 直接 fetch。
```

### 7.2 三層

| 層級 | 特性 | URL 來源 | GS 管？ |
|---|---|---|---|
| 核心 | ScoutSystem 內置 | — | ✅ |
| 第 2 級 | 無後台即插即用 | plugins.url | ❌ |
| 第 3 級 | 旅團自建後台 | units.endpoints[pluginId] | ❌ |

### 7.3 插件開啟合約

```
?u=0082&role=admin&from=portal&embed=1&ymis=1234567890

u = 旅團代碼
role = 使用者角色
from = portal
embed = 1（嵌入模式）
ymis = 成員 YMIS（如果是成員登入）
backend = 單位設定的 Apps Script URL (僅第3級)
apikey = 單位設定的 API Key (僅第3級)
```

---

## 8. 單位元件設定 (Tier 3)

對於第 3 級元件（如：進度性獎章追蹤），各旅團可自定義其後端。管理員可在「系統設定」→「單位元件設定」中填寫每個元件的：
- 前端 URL (選填)
- 後端 Apps Script URL
- API Key (安全鎖)

這些資訊會儲存在 GS 的 `PluginSettings` 表中。

---

## 8. 登入流程

### 8.1 完整流程（新旅團從 0 開始）

```
1. setup 後自動建立 u_admin（密碼 changeme）
2. setup 自動生成 STAFF_TOKEN
3. 首次登入方式：
   a. admin email + changeme
   b. STAFF_TOKEN（在 SystemConfig 找到）
   c. sheep / 0728（技術測試）
4. 登入後可審批申請
5. 申請批核後建立 User
6. 之後用帳號登入
```

### 8.2 登入類型

| loginType | identifier | password | 對照表 |
|---|---|---|---|
| account | email / userId | Users.password | Users |
| member | YMIS 10位數字 | 不需要 | Members.ymNumber |
| staffToken | STAFF_TOKEN | SystemConfig.STAFF_TOKEN | SystemConfig |

### 8.3 成員登入特殊性

- 不從 Users 表找
- 從 Members 表的 ymNumber 找
- 登入後 userId = memberId
- session 帶 memberId + branchId + age
- 年齡決定操作權限

---

## 9. STAFF_TOKEN

- setup 時自動生成（`sk_xxxxxxxx` 格式）
- 存在 SystemConfig
- 用途：首次管理員登入（在還沒有帳號之前）
- 不是長期認證機制
- 之後用正常 admin 帳號即可

---

## 10. Word 通告上傳

### 10.1 流程

```
上傳 .docx / .txt
  → mammoth 抽取純文字（.docx）
  → noticeParser.ts 按標頭逐行解析
  → 顯示抽取結果（可確認）
  → 選模式：
     旅團參與 → 建立 Event + LibraryBookmark → 加入行事曆
     資訊性 → 只加 LibraryBookmark → 不加入行事曆
```

### 10.2 標準標頭

```
通告類型：活動通告 / 日常集會安排
通告標題：
來源：
活動日期：
活動地點：
參加資格：
適合支部：
收費：
官方截止日期：
本旅截止日期：
接入模式：旅團參與 / 資訊性
是否加入行事曆：是 / 否
```

### 10.3 兩類通告

| 類型 | 處理 | 加入行事曆 | 家長回覆 |
|---|---|---|---|
| 活動通告 | 轉成 Event + Bookmark | ✅ | ✅ |
| 日常集會安排 | 當公告處理 | ❌ | ❌ |

---

## 11. 報名管理

### 11.1 功能

- 按活動查看報名狀態
- 按小隊統計（✅參加 ❤️有興趣 ⚠️未回覆）
- 標記付款
- 匯出 CSV（含姓名、YMIS、小隊、狀態、緊急聯絡人、緊急電話、付款）
- 領袖可刪除報名

### 11.2 EventReply 規則

- replyId = `eventId_memberId`（一個成員對一個活動只有一筆）
- type: `interested` / `registered` / `declined`
- 未回覆不存 row，查詢時計算
- paid: boolean

---

## 12. 1.0 vs 2.0 差異

| 項目 | 1.0 | 2.0 |
|---|---|---|
| 登入 | email+pw / YMIS | 同 + STAFF_TOKEN |
| 資料讀取 | getDashboardData（多 endpoint） | getDashboard（一個，角色過濾） |
| Sheet 讀寫 | header-based | header-based（一樣） |
| 18歲 guard | GS 端 | GS 端（一樣） |
| cancelReply | 有（軟刪除） | 有 |
| getEventRegistrationSummary | 有 | 有 |
| member 批核 | 建 Member + 找家長 | 同 |
| autoRepairParentLinks | 有 | 有 |
| 系統鎖 | 有 | 有 |
| 小隊 | 沒有 | Patrols 表 |
| 恆常集會 | 沒有 | RegularMeetings + CancelledMeetings |
| Drive PDF | 沒有 | 有 |
| 旅團 setup | 沒有 | 有（顏色、隱藏、README、notes） |
| STAFF_TOKEN | 沒有 | 有 |
| Word 通告上傳 | 沒有 | 有 |
| 通告兩種模式 | 沒有 | informational / troop_participation |
| 公告 vs 通告分離 | 沒有 | 公告=PDF folder / 通告=Word上傳 |
| 轉駁器 | 沒有 | 有 |
| 角色過濾 | 有 | 有（更嚴格） |
| doPost | 有 | 沒有（全 GET） |
| Notification | 有 | 沒有（1.0 也沒正式弄） |
