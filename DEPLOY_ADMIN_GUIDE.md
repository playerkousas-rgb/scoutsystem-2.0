# 2026 Scout System — 平台管理員部署指南

> 收到旅團接入申請後，照這份做。

---

## 收到申請時

旅團會從「申請接入」頁面提交 Email，格式：

```
旅團名稱：第82旅
旅團號：0082
聯絡人 Email：admin@82troop.org
Apps Script URL：https://script.google.com/macros/s/AKfycbw.../exec
API Key：ak_m1a2b3c4d5
備註：（如果有）
```

---

## 你要做的事（4 步）

### Step 1：驗證

在瀏覽器貼上：

```
https://script.google.com/macros/s/.../exec?action=health&apiKey=ak_xxxxxxxx
```

✅ `{"success":true,"version":"2.0-live","ready":true}` → 後台正常

❌ `Unauthorized` → API Key 不對，叫旅團到 Sheet 選單「重新生成 API Key」

❌ 無回傳 → 部署有問題，叫旅團確認 Deploy → Anyone

同時驗證旅團身份（聯絡人 email 是否合理、旅團號是否正確）。

### Step 2：加入旅團

開啟 `lib/troops.ts`，在 `APPROVED_TROOPS` 加入（不需要 API Key）：

```typescript
{
  key: 'troop_0082',
  id: '0082',
  name: '第82旅',
  webAppUrl: 'https://script.google.com/macros/s/.../exec',
  status: 'active',    // 或 'testing'
},
```

### Step 3：設定環境變數

Vercel Dashboard → Project → Settings → Environment Variables：

```
Name:  TROOP_0082_APIKEY
Value: ak_m1a2b3c4d5
```

> 命名規則：`TROOP_{旅團號}_APIKEY`
> 這個變數只有伺服器能讀取，不會出現在前端 JS。

### Step 4：部署 + 通知

```bash
git add lib/troops.ts
git commit -m "接入：第82旅"
git push
```

然後 Email 回覆旅團：

```
✅ 你的旅團已開通！
到首頁選擇「第82旅」，用 email + changeme 登入。
```

---

## 旅團要更改 API Key

1. 旅團在 Sheet 選單 → 重新生成 API Key
2. 把新 Key Email 給你
3. 你更新 Vercel 環境變數
4. Redeploy

## 停用旅團

`troops.ts` 把 status 改 `'inactive'`，或直接刪掉那行 + 刪掉對應的 env var。

---

## 快速檢查清單

- [ ] health + apiKey 測試通過
- [ ] 驗證旅團身份
- [ ] 確認旅團號不重複
- [ ] 加入 `lib/troops.ts`
- [ ] 設定 Vercel env var `TROOP_{旅團號}_APIKEY`
- [ ] git push
- [ ] 通知旅團已開通
