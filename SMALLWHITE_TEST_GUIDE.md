# ScoutSystem 2.0 小白實測指南

> **你是新旅團，從 0 開始接入。照這份做。**

---

## 第 1 步：建立 Google Sheet

1. 開 [sheets.new](https://sheets.new)（空白 Google Sheet）
2. 改名為「ScoutSystem - 你的旅團名」
3. 開好就行，先不用填任何東西

---

## 第 2 步：加入 Apps Script

1. 在 Google Sheet 上方選單 → **擴充功能 → Apps Script**
2. 會打開 Apps Script 編輯器
3. 把裡面的預設代碼全部刪掉
4. 到 ScoutSystem 前端 `/downloads` 下載 `SCOUTSYSTEM_2_SETUP.gs.txt`
5. 打開它，全選複製，貼到 Apps Script 編輯器
6. 按 **儲存**（💾 圖示）

---

## 第 3 步：執行初始化

1. 在 Apps Script 上方下拉選 `setupScoutSystem`
2. 按 **執行**
3. 第一次會問你授權 → 按允許
4. 執行完會跳出 alert：「ScoutSystem 2.0 初始化完成」
5. 回到 Google Sheet，你會看到：

```
只顯示 5 個分頁：
  README_新手必看（藍色 tab）
  SystemConfig（黃色 tab）
  Branches（綠色 tab）
  Patrols（綠色 tab）
  Members（淺藍色 tab）
```

其他進階分頁已經隱藏了。

---

## 第 4 步：填寫旅團資料

### 4.1 到 SystemConfig（黃色）

填這幾個：

| key | 填甚麼 |
|---|---|
| TROOP_CODE | 你的旅團號，純數字，例如 `0082` |
| TROOP_NAME | 旅團名稱，例如 `第82旅` |
| ADMIN_EMAIL | 你的 email（第一位管理員） |
| FRONTEND_URL | 你的 Vercel URL（如果還沒有，之後再填） |

> `STAFF_TOKEN` 已經自動生成了（`sk_xxxxxxxx`），記住它。
> `ADMIN_DEFAULT_PASSWORD` 預設 `changeme`。

### 4.2 到 Branches（綠色）

確認五個支部名稱和是否啟用（enabled = TRUE）。

### 4.3 到 Patrols（綠色）

修改小隊名稱：
- 幼童軍：按顏色（RED / YELLOW / BLUE / GREEN）
- 童軍：按動物英文（TIGER / SEAGULL / WOLF）
- 其他支部：預設沒有分隊

### 4.4 到 Members（淺藍）

輸入幾個成員用來測試：

| memberId | ymNumber | name | branchId | dateOfBirth | emergencyContactPhone | active |
|---|---|---|---|---|---|---|
| m1 | 1234567890 | 測試童軍A | b3 | 2012-01-15 | 91234567 | TRUE |
| m2 | 2345678901 | 測試幼童軍B | b2 | 2015-06-20 | 98765432 | TRUE |

> ymNumber 必須是 10 位數字。
> memberId 可以自己編（m1, m2, m3...）。
> dateOfBirth 用來算年齡，18 歲以下只能按 ❤️。

---

## 第 5 步：部署 Web App

1. 在 Apps Script 右上方 → **部署 → 新增部署作業**
2. 選 **網頁應用程式**
3. 設定：
   - **執行身分**：我
   - **誰可以存取**：任何人
4. 按 **部署**
5. 複製 **網頁應用程式 URL**（`https://script.google.com/macros/s/.../exec`）

> 如果出現 Access Denied，確認「誰可以存取」設成了「任何人」。

---

## 第 6 步：測試後台連線

打開瀏覽器，在網址列貼上你的 URL 加上 `?action=health`：

```
https://script.google.com/macros/s/...../exec?action=health
```

應該回傳：

```json
{"success":true,"version":"2.0-live","action":"health","ready":true}
```

---

## 第 7 步：連接前端

1. 打開 ScoutSystem 前端首頁
2. 填入：
   - 旅團號：你的 TROOP_CODE
   - 旅團名稱：你的 TROOP_NAME
   - Apps Script Web App URL：你的 `/exec` URL
   - Google Sheet URL：你的 Sheet URL
3. 按 **測試並使用此旅團**
4. 看到 ✅ 後台連接成功

---

## 第 8 步：首次登入

有兩個方式：

### 方式 A：用 admin 帳號

1. 先回到 Google Sheet → Apps Script → 顯示進階分頁 → 打開 Users
2. 確認 `u_admin` 那行的 email 是否填了你的 ADMIN_EMAIL
3. 在前端 `/login` → 領袖及家長登入
4. 輸入 email + 密碼 `changeme`
5. 進入 `/admin`

### 方式 B：用 STAFF_TOKEN

1. 在 Google Sheet → SystemConfig 找到 `STAFF_TOKEN` 的值
2. 在前端 `/login` → STAFF_TOKEN
3. 貼上 token
4. 進入 `/admin`

### 方式 C：技術測試

1. `/login` → 領袖及家長登入
2. 輸入 `sheep`
3. 直接進入 `/admin`

---

## 第 9 步：測試申請帳號流程

1. 先登出
2. 到 `/apply`
3. 申請一個家長帳號：
   - 姓名：測試家長
   - Email：parent@test.com
   - 子女 YMIS：1234567890（你剛在 Members 填的）
4. 提交
5. 回到 `/login` 用 admin / STAFF_TOKEN / sheep 登入
6. 到 `/admin/applications`
7. 應該看到剛才的申請
8. 按 **批核**
9. 批核後會自動：
   - 建立 User（密碼 changeme）
   - 用 YMIS 綁定子女

---

## 第 10 步：測試家長登入

1. 登出
2. `/login` → 領袖及家長登入
3. 輸入 parent@test.com + changeme
4. 進入 `/parent`
5. 應該看到子女（測試童軍A）

---

## 第 11 步：測試成員登入

1. 登出
2. `/login` → 成員 YMIS 登入
3. 輸入 `1234567890`
4. 進入 `/member`
5. 因為測試童軍 A 是 13 歲（未滿 18）→ 只能按 ❤️ 有興趣

---

## 第 12 步：測試活動建立

1. 用 admin 登入
2. `/admin/events` → 新增活動
   - 標題：測試露營
   - 日期：選一個未來日期
   - scope：全旅
   - 費用：$80
3. 新增後狀態是 draft
4. 按 **發布**
5. 到 `/calendar` 看是否出現
6. 到 `/activities` 看是否出現

---

## 第 13 步：測試報名回覆

### 成員回覆

1. 登出 → 用成員 YMIS 登入
2. `/member` 看到測試露營
3. 按 ❤️ 有興趣

### 家長回覆

1. 登出 → 用家長登入
2. `/parent` 看到子女的測試露營
3. 按 ✅ 參加
4. 按 ❌ 不參加 → 然後再按 ✅ 參加（測試反悔）

---

## 第 14 步：測試報名管理

1. 用 admin 登入
2. `/admin/registrations` → 選擇測試露營
3. 看到小隊統計
4. 看到成員回覆狀態
5. 按切換付款
6. 按 **匯出 CSV** → 檢查 CSV 內容

---

## 第 15 步：測試行事曆

1. `/calendar`
2. 切換月曆 / 清單模式
3. 如果用家長登入 → 切換子女 Tab（全部 / 單個）
4. 如果用領袖登入 → 在恆常集會按 × 標記不用集會
5. 用成員登入 → 確認看不到被取消的集會

---

## 第 16 步：測試成員編輯

1. `/admin/members`
2. 按 ✏️ 編輯某個成員
3. 改名字、改支部、改出生日期
4. 按 **儲存**
5. 連結家長 → 下拉選擇

---

## 第 17 步：測試通告上傳

1. 製作一個 `.txt` 或 `.docx` 通告，用標準格式：

```
通告標題：測試訓練日
來源：總會
活動日期：2026-09-20
活動地點：大潭童軍中心
參加資格：童軍、深資童軍
收費：$80
官方截止日期：2026-09-10
本旅截止日期：2026-09-03
接入模式：旅團參與
是否加入行事曆：是
```

2. `/notices/upload` → 上傳
3. 檢查抽取結果
4. 選旅團參與 → 儲存
5. 到 `/calendar` 確認活動出現

---

## 第 18 步：測試 Drive PDF（可選）

1. 在 Google Drive 建一個資料夾，放幾個 PDF
2. 複製資料夾 ID（URL 最後一段）
3. 到 SystemConfig 填 `ANNOUNCEMENT_FOLDER_ID`
4. `/notices` → 重新讀取 PDF
5. 應該看到 PDF 列表

---

## 第 19 步：測試元件市場

1. `/marketplace`
2. 確認讀到轉駁器 registry（旅團圖書館、DBS、財務管家）
3. `/connectors` 確認轉駁狀態

---

## 第 20 步：測試審核紀錄

1. `/admin/audit`
2. 確認所有操作都有記錄

---

## 測試清單

- [ ] Google Sheet 建立並 setup
- [ ] 顏色 / 隱藏 / README 正確
- [ ] Deploy Web App（Anyone）
- [ ] health check 通過
- [ ] 前端連接成功
- [ ] admin / STAFF_TOKEN / sheep 登入
- [ ] 申請帳號 → 審批 → 建帳號
- [ ] 家長登入看到子女
- [ ] 成員 YMIS 登入
- [ ] 新增活動 → 發布 → 行事曆出現
- [ ] 成員按 ❤️
- [ ] 家長按 ✅ / ❌ / 再 ✅（反悔）
- [ ] 報名管理 → 小隊統計 → 付款 → CSV
- [ ] 行事曆月曆 / 清單切換
- [ ] 家長子女切換
- [ ] 領袖標記不用集會 → 成員看不到
- [ ] 成員編輯 → 儲存
- [ ] 活動編輯 → 儲存
- [ ] Word 通告上傳 → 抽取 → 加入行事曆
- [ ] Drive PDF 讀取
- [ ] 元件市場讀 registry
- [ ] 審核紀錄完整
