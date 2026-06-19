# ScoutSystem 2.0 旅團接入指南

> **你是新旅團，照這份做就可以接入。**

---

## 整個流程就 6 步

```
1. 建立 Sheet → 2. 貼 GS → 3. Setup → 4. 填資料 → 5. 部署 → 6. 提交申請
```

做完第 6 步，等平台管理員開通，你就可以用了。

---

## 第 1 步：建立 Google Sheet

1. 開 [sheets.new](https://sheets.new)（空白 Google Sheet）
2. 改名為「ScoutSystem - 你的旅團名」
3. 開好就行，不用填任何東西

---

## 第 2 步：加入 Apps Script

1. 在 Google Sheet → **擴充功能 → Apps Script**
2. 把預設代碼全部刪掉
3. 到系統前端 <a href="/downloads">模板下載</a> 下載 `SCOUTSYSTEM_2_SETUP.gs.txt`
4. 打開它，全選複製，貼到 Apps Script
5. 按 **儲存**（💾 圖示）

---

## 第 3 步：執行 Setup

1. 在 Apps Script 上方下拉選 `setupScoutSystem`
2. 按 **執行**
3. 第一次會問你授權 → 按允許
4. ⚠️ **彈窗會顯示你的 API Key（只顯示一次！立即複製！）**

> 🔑 **API Key 是連接你後台的鑰匙。** 彈窗只出現一次！
> 忘記了？到 Sheet 選單 → ScoutSystem 2.0 → 重新生成 API Key。

---

## 第 4 步：填寫旅團資料

### 到 SystemConfig（黃色 tab）

填這幾個：

| key | 填甚麼 |
|---|---|
| TROOP_CODE | 你的旅團號，純數字，例如 `0082` |
| TROOP_NAME | 旅團名稱，例如 `第82旅` |
| ADMIN_EMAIL | 你的 email（第一位管理員） |

> `STAFF_TOKEN` 已自動生成（`sk_xxxxxxxx`），記住它。
> `API_KEY_HASH` 是你 API Key 的雜湊值，不用改。

### 到 Members（淺藍色 tab）

輸入成員：

| memberId | ymNumber | name | branchId | dateOfBirth | emergencyContactPhone | active |
|---|---|---|---|---|---|---|
| m1 | 1234567890 | 測試童軍A | b3 | 2012-01-15 | 91234567 | TRUE |

> ymNumber 必須是 10 位數字。memberId 自己編（m1, m2, m3...）。

### 建立管理員帳號

上方選單 → ScoutSystem 2.0 → **重新建立管理員帳號**

---

## 第 5 步：部署 Web App

1. Apps Script 右上方 → **部署 → 新增部署作業**
2. 選「網頁應用程式」
3. 設定：
   - **執行身分**：我
   - **誰可以存取**：**任何人**
4. 按 **部署**
5. 複製 **/exec 網址**（`https://script.google.com/macros/s/.../exec`）

> ⚠️ 如果出現 Access Denied，確認「誰可以存取」設了「任何人」。

---

## 第 6 步：提交接入申請

1. 到系統前端 → **申請接入**（/onboard）
2. 填入：
   - 旅團名稱
   - 旅團號
   - 你的 Email
   - /exec 網址
   - **API Key**（第 3 步複製的）
3. 按 **📧 提交申請**

> 提交後等平台管理員開通。開通後到首頁選擇你的旅團，用 email + 密碼 `changeme` 登入。

---

## ✅ 開通後怎用

1. 到首頁 → 下拉選擇你的旅團 → 使用此旅團
2. 到 /login → 領袖及家長登入 → 輸入 ADMIN_EMAIL + 密碼 `changeme`
3. 登入後請立即修改密碼

**其他登入方式：**
- **STAFF_TOKEN**：在 /login → STAFF_TOKEN → 貼上 SystemConfig 裡的 `sk_xxxxxxxx`
- **成員**：在 /login → 成員 YMIS 登入 → 輸入 10 位 ymNumber
- **家長**：需先由管理員建立帳號並連結子女

---

## 🛡️ 你的資料有多安全？

| 層級 | 說明 |
|---|---|
| 資料存放 | Google 伺服器（Google Sheet），不是某台不知名的電腦 |
| API Key 存放 | Vercel 伺服器環境變數，不出現在任何前端代碼 |
| Sheet 存了甚麼 | 只有 SHA-256 雜湊值（API_KEY_HASH），連管理員也無法還原 |
| 攻擊門檻 | 要取得你的資料，攻擊者要麼攻破 Google 伺服器，要麼攻破 Vercel 伺服器 |
| 結論 | 比把資料存在自己家裡的電腦更安全 |

| 操作 | 說明 |
|---|---|
| 忘記 API Key？ | Sheet 選單 → 重新生成 API Key → 通知管理員更新 |
| 不要做 | ❌ 分享 Sheet 連結、❌ 在群組貼 API Key |

---

## ❓ 常見問題

**看不到我的旅團？**
→ 尚未開通。請到「申請接入」提交，等管理員確認。

**忘記了 API Key？**
→ Sheet 選單 → ScoutSystem 2.0 → 重新生成 API Key，然後提交新 Key 給管理員。

**登入後看不到成員？**
→ 確認 Members 表有填 ymNumber（10 位數字），active = TRUE。

**成員登入說「找不到」？**
→ ymNumber 必須是 10 位數字，前面不要加空格。
