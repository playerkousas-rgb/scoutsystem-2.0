# ScoutSystem 2.0 權限與功能對照表

> **最後更新：2026-06-16**
> **用途：定義每個角色能做甚麼、每個功能卡片的入口。**

---

## 1. 角色階級

由低到高：

```
member < parent < coach < branch_leader < group_leader < admin < super_admin
```

**規則：下級看到，上級一定看到。** 但反過來不是。

---

## 2. 角色定義

| 角色 | role 值 | 身份說明 | 登入入口 |
|---|---|---|---|
| 技術測試帳號 | `super_admin` | 技術管理人員的測試帳號；權限等同最高但**不是**旅團管理層身份。sheep / 0728。 | 直接輸入 sheep / 0728 |
| 管理員 | `admin` | 由旅團設定；管理所有支部、審核申請、活動管理、系統設定。 | email + password |
| 團長 | `group_leader` | 管理所屬支部的活動、家長審核、成員資料、圖書館標記。 | email + password |
| 支部領袖 | `branch_leader` | 管理所屬支部的活動、家長審核、成員資料、圖書館標記。權限低於團長。 | email + password |
| 教練員 | `coach` | 可標記圖書館、看活動、看報名管理；**無審核權限**。 | email + password |
| 家長 | `parent` | 管理子女資料、代子女回覆活動。子女可能在不同支部。 | email + password |
| 成員 | `member` | 查看自己活動。18 歲以下只能 ❤️；18 歲以上可 ✅ / ❌。 | YMIS 10位數字 |

---

## 3. 功能權限對照表

### 3.1 控制台

| 功能 | super_admin | admin | group_leader | branch_leader | coach | parent | member |
|---|---|---|---|---|---|---|---|
| 管理員控制台 `/admin` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 領袖控制台 `/leader` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| 家長控制台 `/parent` | — | — | — | — | — | ✅ | ❌ |
| 成員控制台 `/member` | — | — | — | — | — | — | ✅ |

### 3.2 摘要卡片（控制台頂部，只顯示數量）

| 摘要 | 顯示給 | 點擊跳轉 |
|---|---|---|
| 用戶數 | admin / super_admin | `/admin/users` |
| 待審批數 | admin / super_admin / group_leader / branch_leader | `/admin/applications` |
| 活動數 | admin / super_admin / leader | `/admin/events` |
| 通告數 | admin / super_admin / leader | `/notices` |

> 摘要卡片只負責顯示數量，不是管理入口。要管理就跳轉到功能卡片。

### 3.3 功能卡片（管理入口）

| 功能卡片 | super_admin | admin | group_leader | branch_leader | coach | parent | member |
|---|---|---|---|---|---|---|---|
| 支部管理 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 成員資料庫 | ✅ 全部 | ✅ 全部 | ✅ 所屬支部 | ✅ 所屬支部 | ❌ | ❌ | ❌ |
| 家長審核 / 申請管理 | ✅ | ✅ | ✅ 所屬支部 | ✅ 所屬支部 | ❌ | ❌ | ❌ |
| 活動管理 | ✅ | ✅ | ✅ 所屬支部 | ✅ 所屬支部 | ✅ 所屬支部 | ❌ | ❌ |
| 報名管理 | ✅ | ✅ | ✅ 所屬支部 | ✅ 所屬支部 | ✅ 所屬支部 | ❌ | ❌ |
| 圖書館標記 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| 通告管理 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| 使用者管理 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 系統設定 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 審核紀錄 | ✅ | ✅ | ✅ 自己的 | ❌ | ❌ | ❌ | ❌ |
| 元件市場 / 轉駁中心 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 旅團設定 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 行事曆管理 | ✅ | ✅ | ✅ 所屬支部 | ✅ 所屬支部 | ❌ | ❌ | ❌ |

### 3.4 建立管理員

只有 super_admin（技術測試帳號）能建立管理員。admin 不能建立管理員。

---

## 4. 各功能詳細權限

### 4.1 成員資料庫 `/admin/members`

| 操作 | admin | group_leader | branch_leader |
|---|---|---|---|
| 查看全部成員 | ✅ | ❌ 只看自己支部 | ❌ 只看自己支部 |
| 新增成員 | ✅ | ✅ | ✅ |
| 編輯成員 | ✅ | ✅ | ✅ |
| 刪除成員 | ✅ | ✅ | ✅ |
| 連結家長 | ✅ | ✅ | ✅ |

### 4.2 活動管理 `/admin/events`

| 操作 | admin | group_leader | branch_leader | coach |
|---|---|---|---|---|
| 新增活動（全旅） | ✅ | ❌ | ❌ | ❌ |
| 新增活動（支部） | ✅ | ✅ | ✅ | ✅ |
| 編輯活動 | ✅ | ✅ 所屬 | ✅ 所屬 | ✅ 所屬 |
| 刪除活動 | ✅ | ✅ 所屬 | ✅ 所屬 | ❌ |
| 發布活動 | ✅ | ✅ 所屬 | ✅ 所屬 | ✅ 所屬 |

### 4.3 報名管理 `/admin/registrations`

| 操作 | admin | leader | coach |
|---|---|---|---|
| 查看報名狀態 | ✅ 全部 | ✅ 所屬支部 | ✅ 所屬支部 |
| 標記付款 | ✅ | ✅ | ✅ |
| 匯出 CSV | ✅ | ✅ | ✅ |
| 刪除報名 | ✅ | ✅ | ❌ |
| 按小隊統計 | ✅ | ✅ | ✅ |

### 4.4 家長審核 `/admin/applications`

| 操作 | admin | group_leader | branch_leader | coach |
|---|---|---|---|---|
| 查看待審批 | ✅ 全部 | ✅ 所屬支部 | ✅ 所屬支部 | ❌ |
| 批核 | ✅ | ✅ | ✅ | ❌ |
| 拒絕 | ✅ | ✅ | ✅ | ❌ |
| 批核後建 User | ✅ 自動 | ✅ 自動 | ✅ 自動 | ❌ |
| 批核家長後綁子女 | ✅ 自動 | ✅ 自動 | ✅ 自動 | ❌ |

### 4.5 圖書館標記 `/library/import`

| 操作 | admin | leader | coach | parent | member |
|---|---|---|---|---|---|
| 引入通告 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 選擇資訊性模式 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 選擇旅團參與模式 | ✅ | ✅ | ✅ | ❌ | ❌ |

### 4.6 通告管理 `/notices`

| 操作 | admin | leader | coach | parent | member |
|---|---|---|---|---|---|
| 上傳 Word 通告 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 查看 PDF 公告 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 設定 Drive 資料夾 | ✅ | ❌ | ❌ | ❌ | ❌ |

### 4.7 行事曆 `/calendar`

| 操作 | admin | leader | coach | parent | member |
|---|---|---|---|---|---|
| 月曆 / 清單切換 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 查看活動 | ✅ 全部 | ✅ 所屬支部 | ✅ 所屬支部 | ✅ 子女相關 | ✅ 自己相關 |
| 查看報名統計 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 子女切換 | ❌ | ❌ | ❌ | ✅ | ❌ |
| 標記不用集會 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 恢復集會 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 跳轉報名管理 | ✅ | ✅ | ✅ | ❌ | ❌ |

### 4.8 集會規則 `/admin/calendar`

| 操作 | admin | group_leader | branch_leader | coach |
|---|---|---|---|---|
| 新增集會規則 | ✅ | ✅ | ✅ | ❌ |
| 啟用/停用 | ✅ | ✅ | ✅ | ❌ |

### 4.9 使用者管理 `/admin/users`

| 操作 | admin | 其他 |
|---|---|---|
| 查看使用者 | ✅ 全部 | ❌ |
| 新增使用者 | ✅ | ❌ |
| 啟用/停用 | ✅ | ❌ |
| 修改角色 | ✅ | ❌ |
| 修改密碼 | ✅ | ❌ |

### 4.10 系統設定 `/admin/settings`

| 操作 | admin | 其他 |
|---|---|---|
| 修改 SystemConfig | ✅ | ❌ |
| 修改 TROOP_CODE / TROOP_NAME | ✅ | ❌ |
| 修改 REGISTRY_URL | ✅ | ❌ |

> 只有 super_admin（技術測試帳號）。admin 也不能。

### 4.11 小隊 / 六 `/admin/branches`

| 操作 | admin | group_leader | branch_leader | coach |
|---|---|---|---|---|
| 新增小隊 | ✅ | ✅ | ✅ | ❌ |
| 停用小隊 | ✅ | ✅ | ✅ | ❌ |
| 查看小隊成員 | ✅ | ✅ 所屬支部 | ✅ 所屬支部 | ✅ 所屬支部 |

---

## 5. 個人化行事曆權限

### 5.1 各角色看到的活動範圍

| 角色 | 看到甚麼活動 |
|---|---|
| 成員 | `scope=troop` + 自己支部活動 + 自己的恆常集會 |
| 家長 | 所有子女的支部活動 + 全旅活動 + 子女的恆常集會 |
| 領袖 | `scope=troop` + 自己支部活動 + 自己支部的恆常集會 |
| 管理員 | 全部 |

### 5.2 declined 處理

| 角色 | declined 後 |
|---|---|
| 成員自己 declined | 行事曆隱藏 |
| 家長 declined 子女 | **仍然顯示**（可反悔重新報名） |

### 5.3 集會取消可見性

| 角色 | 被取消的集會 |
|---|---|
| 領袖 / 管理員 | 看到「已取消」標記 |
| 成員 | 完全看不到 |
| 家長 | 完全看不到 |

---

## 6. 頂欄導覽

### 6.1 未登入

```
ScoutSystem | 接入 | 下載 | 更新 | 使用旅團 | [申請帳戶(如有旅團)] | 登入
```

### 6.2 已登入（一般角色）

```
ScoutSystem | 行事曆 | 活動 | 圖書館 | 控制台 | [旅團名 · 姓名] | 登出
```

### 6.3 已登入（管理員以上）

```
ScoutSystem | 行事曆 | 活動 | 圖書館 | 更新 | 元件市場 | 轉駁中心 | 控制台 | [旅團名 · 姓名] | 登出
```

---

## 7. 轉駁器 / 插件可見性

### 7.1 元件市場 `/marketplace`

只有 admin / super_admin 能看到元件市場入口。

### 7.2 插件最低可見角色

每個插件可以設定「最低可見角色」。

```
如果設為 member → 成員、家長、教練員、支部領袖、團長、管理員 都看到
如果設為 branch_leader → 支部領袖、團長、管理員 看到
如果設為 admin → 只有管理員 看到
```

規則：**下級看到，上級一定看到。**

### 7.3 插件分級

| 級別 | 誰部署 | URL 來源 | 需要旅團後台 |
|---|---|---|---|
| 第 2 級 | 平台管理員（1份共用） | plugins.url | ❌ |
| 第 3 級 | 各旅團自部署 | units.endpoints | ✅ |

---

## 8. 申請帳號流程

```
1. 用戶到首頁填入旅團的 Apps Script URL → 選擇旅團
2. 到 /apply 申請
   - 家長：填姓名、email、子女 YMIS
   - 領袖 / 教練員：填姓名、email、支部、經驗
   - 成員：填姓名、YMIS
3. 申請寫入 Applications Sheet（status = pending）
4. 管理員 / 領袖在 /admin/applications 審批
5. 批核後：
   - 自動建立 User（密碼 changeme）
   - 家長：自動用 YMIS 綁定子女
   - 成員：自動建立 / 關聯 Member 記錄
6. 用戶用帳號登入
```

---

## 9. 審核紀錄 (AuditLogs)

所有寫入操作都會記錄：

| 欄位 | 說明 |
|---|---|
| logId | 唯一 ID |
| userId | 操作者 |
| action | 動作名稱 |
| entity | 操作的表 |
| entityId | 操作的記錄 ID |
| createdAt | 時間 |
| detail | 詳細說明 |

### 記錄的操作

- createMember / updateMember / deleteMember / linkParent
- createEvent / updateEvent / publishEvent / deleteEvent
- setReply / cancelReply / togglePaid
- decideApplication（approve / reject）
- toggleUser / createUser
- createPatrol / togglePatrol
- importBookmark / updateBookmark / deleteBookmark
- toggleRegularMeeting / createRegularMeeting
- toggleMeetingCancel / uncancelMeeting
- saveConfig
- toggleSystemLock
- autoRepairParentLinks
- applyJoin

只有 admin 能看全部紀錄。group_leader 只能看自己的。
