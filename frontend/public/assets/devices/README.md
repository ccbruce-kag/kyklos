# 設備圖片目錄

放置替換 Iconify 3D 圖示的真實設備 PNG 圖檔。

## 對應表

將下列檔名放入此目錄後，把 `NetworkArchitectureEditorModal.tsx` 中
`DEVICE_KINDS` 的 `icon` 欄位從 Iconify 名稱改為 `/assets/devices/<檔名>`：

| 設備 | 預期檔名 |
|------|----------|
| 路由器 | `router.png` |
| 交換器 | `switch.png` |
| 防火牆 | `firewall.png` |
| 伺服器 | `server.png` |
| 資料庫 | `database.png` |
| 負載平衡 | `lb.png` |
| 無線 AP | `ap.png` |
| 終端 | `client.png` |
| 雲端 | `cloud.png` |
| 網際網路 | `internet.png` |

## 替換範例

原本：
```ts
{ kind: 'router', icon: 'fluent-emoji:antenna-bars', ... }
```

換成 PNG 後：
```ts
{ kind: 'router', icon: '/assets/devices/router.png', ... }
```

`DeviceIcon` 元件會自動偵測 `icon` 欄位：
- 含 `:` 視為 Iconify 名稱
- 以 `/` 開頭或含副檔名（png/jpg/svg/...）視為本地圖檔
