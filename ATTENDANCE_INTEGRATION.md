# 簽到／點名與報名管理分流

本系統把「實際出席點名」與「活動報名」視為兩個獨立功能，不共用卡片、頁面或狀態。

## 功能邊界

| 功能 | 適用項目 | 主要資料 |
|---|---|---|
| **簽到／點名** | 日常／恆常集會、旅團自己舉辦的活動 | P 出席、A 缺席、L 遲到、E 請假、S 病假、備註及歷史出席 |
| **報名管理** | 旅團自己舉辦的活動、外間活動／圖書館引入通告 | 確定參加、婉拒、有興趣、尚未回覆、付款及報名名單 |

旅團自辦活動可能同時需要兩個功能，但兩者代表不同階段：

1. 活動前在「報名管理」收集參加意願及付款。
2. 活動當日到「簽到／點名」記錄實際出席。

外間活動只進入報名管理；日常集會只進入簽到／點名。

## 主系統入口

- 管理員控制台：獨立顯示「簽到／點名」和「報名管理」兩張卡片。
- 領袖控制台：獨立顯示兩張卡片。
- 成員控制台：顯示「簽到／點名」卡片，供查看個人出席紀錄。
- `/admin/registrations`：只處理活動報名、付款、統計及 CSV。
- `/attendance`：只接入集會點名元件。

## troop-attendance Tier 3 接入

點名介面依照 [`playerkousas-rgb/troop-attendance`](https://github.com/playerkousas-rgb/troop-attendance) 的雙軌／Tier 3 合約接入：

```text
https://troop-attendance.vercel.app/?u=82&role=leader&ymis=USER_ID&name=領袖姓名&from=portal&embed=1
```

主系統會：

- 將 `0082` 等主系統旅團號正規化成點名元件 Registry 使用的 `82`。
- 將 `coach`、`branch_leader`、`group_leader` 映射為 `leader`。
- 將 `troop_super`、`super_admin` 映射為 `admin`。
- 成員進入時以成員資料中的 YMIS 作身份參數。
- 傳送 `name`、`from=portal` 及 `embed=1`，並提供新視窗備用入口。
- **不會**把報名回覆、付款狀態、主系統 GAS URL 或 API key 放入點名元件 URL。

點名元件使用自己每旅團的 `AttendanceRecords` 後端；主系統報名管理繼續使用 `Events` 及 `EventReplies`。兩套資料不可互相代替。
