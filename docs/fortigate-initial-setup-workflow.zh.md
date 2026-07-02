# FortiGate 初始設定順序與操作說明

更新日期：2026-07-02

本文說明：如果現在有一台 FortiGate 防火牆，要透過目前 Firewall-Man / Kyklos 內的「FortiGate」功能來規劃與設定，應該從哪裡開始、設定順序為何、以及為什麼要照這個順序做。

> 重要限制：目前 Kyklos 的 FortiGate 功能仍是 FortiGate 90D 風格的前端管理介面原型，資料主要儲存在瀏覽器 `localStorage`。目前尚未連接真實 FortiGate API / SSH / CLI，因此不會真的把設定下發到 FortiGate 設備。以下流程可作為 UI 操作流程、設定規劃與未來後端串接的標準順序。

## 一、設定前先確認的事

在開始設定前，建議先確認以下資訊：

| 項目 | 需要確認的內容 | 原因 |
|---|---|---|
| FortiGate 型號與版本 | 例如 FortiGate 90D、FortiOS 版本 | 不同版本可用功能、選單位置與 CLI/API 可能不同 |
| 管理 IP | 例如 `https://192.168.1.99` | 未來後端要連線讀取/下發設定 |
| 管理帳號權限 | admin 或具備完整設定權限的帳號 | 若權限不足，很多設定無法套用 |
| WAN 資訊 | ISP IP、Gateway、DNS、PPPoE 或 DHCP | WAN 是外部連線基礎 |
| LAN / VLAN 規劃 | 內網網段、VLAN ID、DHCP 範圍 | 後續 Policy、VPN、WiFi 都會引用 |
| 安全政策需求 | 哪些網段可上網、哪些服務要開放 | 防火牆政策必須依需求建立 |
| VPN 需求 | IPsec site-to-site、SSL-VPN 遠端連線 | VPN 需要先知道本地/遠端子網與認證方式 |
| 日誌與監控需求 | 是否送 FortiAnalyzer、Syslog、SNMP | 後續維運與問題追蹤需要日誌 |

## 二、建議設定總順序

建議順序如下：

1. 系統管理
2. 網路
3. 物件
4. 用戶與設備
5. 資安管理設定
6. 政策 & 物件
7. VPN
8. WiFi & Switch 控制器
9. 安全織網
10. 日誌與報表
11. FortiView / 監測

這個順序的核心原因是：先建立「設備本身與網路基礎」，再建立「會被引用的物件與使用者」，接著建立「安全檢查設定檔」，最後才建立「真正允許或拒絕流量的政策」。如果順序反過來，政策會找不到介面、位址、服務、使用者群組或安全設定檔。

## 三、詳細設定流程

## 1. 系統管理

位置：

- FortiGate > 系統管理 > 設定
- FortiGate > 系統管理 > 系統管理員
- FortiGate > 系統管理 > 管理權限配置表
- FortiGate > 系統管理 > 證書
- FortiGate > 系統管理 > FortiGuard
- FortiGate > 系統管理 > 高可靠性
- FortiGate > 系統管理 > SNMP

建議先設定：

| 設定項目 | 操作內容 | 為什麼要先做 |
|---|---|---|
| Hostname | 設定設備名稱 | 日誌、監控、HA、拓樸中都需要識別設備 |
| 管理員帳號 | 建立管理員、設定權限 | 避免所有人共用 admin，也方便稽核 |
| 管理權限配置表 | 建立只讀、維運、管理者角色 | 不同人員應有不同權限 |
| 管理服務 | HTTPS / SSH / PING / SNMP | 決定哪些方式可管理設備 |
| 證書 | 匯入或選擇 HTTPS / SSL-VPN 憑證 | 管理介面與 SSL-VPN 需要安全憑證 |
| FortiGuard | 確認授權、更新模式與代理 | 防毒、IPS、網頁分類仰賴 FortiGuard |
| HA | 若有雙機，設定 HA mode 與 heartbeat | HA 會影響介面、管理 IP 與同步方式 |
| SNMP | 設定監控系統用的 community/user | 方便 NMS 監控 CPU、流量、介面狀態 |

目前 UI 狀態：

- 可操作多數清單、新增、編輯、刪除、啟用/停用。
- 目前不會真的修改 FortiGate。
- 若未來要接真實設備，這一段需要 FortiGate API/CLI 後端。

## 2. 網路

位置：

- FortiGate > 網路 > 介面
- FortiGate > 網路 > DNS
- FortiGate > 網路 > 靜態路由
- FortiGate > 網路 > SD-WAN
- FortiGate > 網路 > 封包擷取

建議設定：

| 設定項目 | 操作內容 | 為什麼要在政策前設定 |
|---|---|---|
| WAN 介面 | IP、Gateway、管理存取 | 所有對外流量都依賴 WAN |
| LAN 介面 | IP、DHCP、管理存取 | 內部設備要透過 LAN 出口 |
| VLAN 介面 | 建立部門/伺服器/訪客 VLAN | 後續 Policy 會引用 VLAN 名稱 |
| DNS | Primary / Secondary DNS | FortiGuard、更新、FQDN 物件都會用到 |
| 靜態路由 | 預設路由與內部路由 | 沒有 route，Policy 建好也不會通 |
| SD-WAN | 多 WAN member、SLA、規則 | 如果有多線路，Policy 可能導向 SD-WAN |
| 封包擷取 | 測試封包是否到達介面 | 用於排查路由與政策問題 |

建議順序：

1. 建立 WAN。
2. 建立 LAN。
3. 建立 VLAN。
4. 設定 DNS。
5. 設定預設路由或 SD-WAN。
6. 用封包擷取驗證流量方向。

為什麼：

- Policy 的來源與目的通常是介面或 Zone。
- VPN 的本地子網也依賴介面/VLAN。
- 日誌與 FortiView 也會以介面為流量分類基礎。

## 3. 政策物件的基礎資料

位置：

- FortiGate > 政策 & 物件 > 位址
- FortiGate > 政策 & 物件 > 服務
- FortiGate > 政策 & 物件 > 排程

建議設定：

| 物件 | 範例 | 用途 |
|---|---|---|
| 位址物件 | `LAN_SUBNET = 10.20.40.0/24` | Policy 的來源或目的 |
| 位址物件 | `SERVER_01 = 10.20.50.10/32` | 精準控制伺服器流量 |
| 服務物件 | TCP 80/443/22/3389 | Policy 控制服務 |
| 排程物件 | `work-hours` | 限制政策生效時間 |

為什麼要先建立物件：

- Policy 直接使用 IP 會很難維護。
- 使用位址、服務、排程物件後，未來只要改物件，不用逐條修改政策。
- VPN、SSL-VPN、Web Filter 等功能也會引用這些物件。

## 4. 用戶與設備

位置：

- FortiGate > 用戶與設備 > 用戶認證
- FortiGate > 用戶與設備 > 用戶群組
- FortiGate > 用戶與設備 > LDAP
- FortiGate > 用戶與設備 > RADIUS 認證
- FortiGate > 用戶與設備 > FortiToken

建議設定：

| 設定項目 | 操作內容 | 何時需要 |
|---|---|---|
| 本地用戶 | 建立 VPN 或管理用使用者 | 小型環境或測試 |
| 用戶群組 | 建立 SSLVPN_Users、Admin_Group | Policy / VPN 會引用 |
| LDAP | 串接 AD/LDAP | 企業使用者集中管理 |
| RADIUS | 串接 MFA 或網路認證 | VPN 或 WiFi 需要二次驗證 |
| FortiToken | 綁定雙因素驗證 | 管理員與 VPN 安全強化 |

為什麼放在 Policy / VPN 前：

- SSL-VPN 入口與 SSL-VPN 設定會引用用戶群組。
- 身分識別政策會引用使用者或群組。
- WiFi WPA2-Enterprise 可能引用 RADIUS。

## 5. 資安管理設定

位置：

- FortiGate > 資安管理設定 > 防毒
- FortiGate > 資安管理設定 > 網頁過濾
- FortiGate > 資安管理設定 > DNS 過濾器
- FortiGate > 資安管理設定 > 應用程式控制
- FortiGate > 資安管理設定 > 入侵偵測防禦
- FortiGate > 資安管理設定 > SSL/SSH 深層檢查
- FortiGate > 資安管理設定 > 自訂特徵值

建議設定：

| 設定檔 | 建議先建立的內容 | 會被誰引用 |
|---|---|---|
| 防毒 | 掃描 HTTP/HTTPS/SMTP/FTP | IPv4 Policy |
| 網頁過濾 | 禁止惡意網站、成人網站、釣魚網站 | IPv4 Policy |
| DNS 過濾器 | 阻擋惡意網域、C2 網域 | IPv4 Policy |
| 應用程式控制 | 控制 P2P、Proxy、遠端工具 | IPv4 Policy |
| IPS | 阻擋高風險漏洞攻擊 | IPv4 Policy / VPN Policy |
| SSL/SSH 檢查 | certificate-inspection 或 deep-inspection | Web Filter / AV / IPS |

為什麼要在 Policy 前設定：

- FortiGate 的安全檢查通常是透過 Policy 套用。
- 如果先建立 Policy 再補 Profile，容易漏套。
- SSL 深層檢查如果使用錯誤，可能造成網站憑證錯誤，因此應先規劃清楚。

## 6. 政策 & 物件：IPv4 政策

位置：

- FortiGate > 政策 & 物件 > IPv4 政策

建議建立順序：

1. LAN 到 WAN 上網政策。
2. VLAN 到 WAN 上網政策。
3. VLAN 之間互通政策。
4. VPN 到 LAN 政策。
5. 對外服務發布政策。
6. 最後確認隱含 deny 或明確 deny policy。

Policy 必備欄位：

| 欄位 | 說明 |
|---|---|
| Incoming Interface | 流量從哪裡進來，例如 `VLAN_40` |
| Outgoing Interface | 流量要去哪裡，例如 `wan1` |
| Source | 來源位址物件或群組 |
| Destination | 目的位址物件或群組 |
| Service | 允許的服務，例如 HTTP/HTTPS/SSH |
| Action | ACCEPT / DENY |
| NAT | 內網出 WAN 通常需要啟用 |
| Schedule | 生效時間 |
| Security Profiles | 防毒、網頁過濾、DNS 過濾、IPS 等 |
| Log | 建議啟用，方便測試與稽核 |

為什麼 Policy 要在中後段設定：

- Policy 需要引用介面、位址、服務、排程、使用者與資安設定檔。
- 這些前置物件沒有建立好，Policy 會不完整。
- Policy 順序會影響命中結果，應等需求明確後再整理順序。

測試方式：

1. 從內部主機測試 DNS。
2. 測試 HTTP/HTTPS 出口。
3. 測試被阻擋的網站或服務是否真的被擋。
4. 到日誌與 FortiView 查看 Policy hit。

## 7. VPN

位置：

- FortiGate > VPN > IPsec 通道
- FortiGate > VPN > IPsec 精靈
- FortiGate > VPN > IPsec 通道範本
- FortiGate > VPN > SSL-VPN 入口頁面
- FortiGate > VPN > SSL-VPN 設定

### IPsec Site-to-Site 建議順序

1. 先確認本地子網與遠端子網。
2. 建立或選擇 IPsec 通道範本。
3. 使用 IPsec 精靈建立通道草稿。
4. 到 IPsec 通道確認 Phase1 / Phase2。
5. 建立 VPN 到 LAN 的 IPv4 Policy。
6. 建立必要靜態路由或依介面型 VPN 設定 route。
7. 到 VPN 監測確認 tunnel 狀態。

為什麼：

- IPsec 通道只是建立加密隧道。
- 真正允許流量通過，仍需要 Policy。
- 路由不正確時，Tunnel Up 也可能無法通訊。

### SSL-VPN 建議順序

1. 建立用戶與用戶群組。
2. 建立 SSL-VPN 入口頁面。
3. 設定 SSL-VPN 監聽介面、Port、Tunnel IP Range。
4. 建立 SSL-VPN 到內網的 IPv4 Policy。
5. 測試使用者登入。
6. 查看 VPN 事件與 SSL-VPN 監測。

為什麼：

- SSL-VPN 入口頁面決定使用者登入後看到什麼、是否 Split Tunnel。
- SSL-VPN 設定決定使用哪個介面與 Port 對外提供登入。
- 沒有 Policy，使用者登入成功也可能無法存取內部資源。

## 8. WiFi & Switch 控制器

位置：

- FortiGate > WiFi & Switch 控制器 > 受管理的 FortiAP
- FortiGate > WiFi & Switch 控制器 > SSID
- FortiGate > WiFi & Switch 控制器 > 受管理的 FortiSwitch
- FortiGate > WiFi & Switch 控制器 > Switch Ports
- FortiGate > WiFi & Switch 控制器 > Switch VLANs
- FortiGate > WiFi & Switch 控制器 > WiFi / Switch 拓樸

建議順序：

1. 確認 FortiLink 或 Switch 管理介面。
2. 建立 Switch VLANs。
3. 設定 Switch Ports 的 Access / Trunk / Uplink。
4. 建立 SSID 並指定 VLAN。
5. 將 FortiAP 納入管理。
6. 查看 WiFi / Switch 拓樸。
7. 建立 WiFi/VLAN 到 WAN 或 LAN 的 Policy。

為什麼：

- VLAN 要先存在，Port 和 SSID 才能引用。
- AP/SSID 建好後，仍需要 Policy 允許 WiFi 用戶上網或存取內部資源。
- Switch Port 模式錯誤時，VLAN 流量不會正確通過。

## 9. 安全織網

位置：

- FortiGate > 安全織網 > 實體拓樸圖
- FortiGate > 安全織網 > 邏輯拓樸圖
- FortiGate > 安全織網 > 自動化
- FortiGate > 安全織網 > 設置
- FortiGate > 安全織網 > Fabric Connectors

建議順序：

1. 到設置確認 Fabric 狀態與管理介面。
2. 若有 FortiAnalyzer / FortiManager / Cloud，先到 Fabric Connectors 建立連線。
3. 到實體拓樸圖建立或檢查設備關係。
4. 到邏輯拓樸圖確認介面、VLAN、Policy、服務保護之間的關聯。
5. 到自動化建立事件觸發條件與通知。

為什麼放在後段：

- 安全織網需要介面、Policy、VPN、Connector 等資料才能呈現有意義的拓樸。
- 如果一開始就做拓樸，很多節點沒有實際關聯，只會變成裝飾圖。

## 10. 日誌與報表

位置：

- FortiGate > 日誌與報表

建議檢查：

| 日誌類型 | 用途 |
|---|---|
| 轉發流量 | 看 Policy 是否命中 |
| 本地流量 | 看管理介面、DNS、FortiGuard 等本機流量 |
| 系統事件 | 看設定變更、登入、系統狀態 |
| VPN 事件 | 看 IPsec / SSL-VPN 登入與斷線 |
| 防毒 / 網頁過濾 / DNS 查詢 / IPS | 看安全設定檔是否有效 |

為什麼最後一定要看日誌：

- 設定能不能通，不能只看畫面狀態。
- 日誌能確認流量被哪條 Policy 命中、被哪個 Profile 阻擋。
- 日誌是排查「網路不通」與「被防火牆擋住」最重要的依據。

## 11. FortiView / 監測

位置：

- FortiGate > FortiView
- FortiGate > 監測 > 路由監測
- FortiGate > 監測 > VPN 監測
- FortiGate > 監測 > Session Monitor

建議檢查：

| 頁面 | 檢查內容 |
|---|---|
| FortiView - 來源 / 目的 / 應用程式 | 哪些主機、目的地、應用佔流量 |
| FortiView - 政策 | 哪些 Policy 被命中 |
| FortiView - 介面 | WAN/LAN/VLAN 流量是否正常 |
| 路由監測 | 預設路由、VPN route、SD-WAN route 是否存在 |
| VPN 監測 | Tunnel 是否 Up、流量是否增加 |
| Session Monitor | 即時連線是否有建立 |

為什麼放最後：

- 監測與 FortiView 是用來驗證前面所有設定是否真的生效。
- 如果前面沒有 Policy / Route / VPN / Profile，監測頁沒有足夠資料可判斷。

## 四、最小可用設定範例

若只想建立一個最小可用的 FortiGate 設定，建議如下：

1. 系統管理
   - 設定 Hostname。
   - 建立管理員帳號。
   - 確認 HTTPS/SSH 管理存取。

2. 網路
   - `wan1` 設定 ISP 或 DHCP。
   - `internal` 或 `VLAN_40` 設定 `10.20.40.1/24`。
   - DNS 設定 `8.8.8.8` / `1.1.1.1` 或內部 DNS。
   - 建立預設路由到 WAN Gateway。

3. 位址與服務
   - 建立 `LAN_SUBNET = 10.20.40.0/24`。
   - 使用預設 `HTTP`、`HTTPS`、`DNS`、`PING` 服務。

4. 資安設定檔
   - 建立基本防毒 Profile。
   - 建立基本網頁過濾 Profile。
   - 建立基本 DNS 過濾 Profile。

5. IPv4 Policy
   - 建立 `LAN_to_WAN`。
   - Incoming：LAN 或 VLAN。
   - Outgoing：wan1。
   - Source：LAN_SUBNET。
   - Destination：all。
   - Service：ALL 或必要服務。
   - NAT：啟用。
   - Security Profiles：套用基本 Profile。
   - Log：啟用。

6. 驗證
   - 內部主機測試 ping gateway。
   - 測試 DNS 解析。
   - 測試 HTTP/HTTPS。
   - 查看 FortiView 與日誌。

## 五、常見錯誤順序

| 錯誤做法 | 可能結果 |
|---|---|
| 先建立 Policy，後建立介面/VLAN | Policy 找不到正確介面或後續需要重改 |
| 只建立 VPN，不建立 Policy | Tunnel Up 但流量不通 |
| 只建立 SSL-VPN 使用者，不設定 Portal/Policy | 使用者可登入但不能存取內網 |
| 建立 VLAN，但 Switch Port 沒設 Access/Trunk | 用戶端拿不到正確 VLAN |
| 套用 Web Filter，但沒設定 SSL Inspection | HTTPS 網站可能無法正確分類或檢查 |
| 不開 Log | 問題發生時無法判斷被哪條規則擋住 |
| 不確認 Route | Policy 正確但封包沒有正確路徑 |

## 六、目前 Kyklos UI 與真實 FortiGate 的差異

| 項目 | 目前 Kyklos FortiGate UI | 真實 FortiGate 需要 |
|---|---|---|
| 資料來源 | 前端預設資料與 localStorage | FortiGate REST API / SSH CLI |
| 設定套用 | 目前只保存 UI 狀態 | 寫入 FortiGate config |
| 狀態監測 | 模擬資料 | 真實介面、Session、VPN、Log |
| Policy 命中 | 模擬展示 | 真實 hit count / traffic log |
| FortiView | 模擬圖表 | 真實流量統計 |
| 備份還原 | 尚未實作 | 匯出 config、套用前備份 |
| 變更稽核 | local UI 狀態 | admin log、diff、rollback |

## 七、未來若要真正管理 FortiGate，建議補強順序

1. FortiGate 連線設定
   - Host
   - Port
   - API Token 或帳密
   - VDOM
   - Timeout
   - 連線測試

2. 後端讀取設備資訊
   - System status
   - Interface
   - Route
   - Policy
   - Address / Service object
   - VPN status
   - Log summary

3. 設定預覽與差異比對
   - UI 修改後先產生 preview。
   - 顯示目前設定與新設定差異。
   - 使用者確認後才下發。

4. 套用前備份
   - 自動匯出 FortiGate config。
   - 記錄時間、操作者、變更內容。

5. 套用後驗證
   - 重新讀取設定。
   - 檢查 route / policy / interface / VPN status。
   - 若失敗，提示 rollback。

## 八、建議測試流程

每次完成一個設定階段後，建議照以下方式測試：

| 階段 | 測試方式 |
|---|---|
| 系統管理 | 測試管理登入、帳號權限、HTTPS/SSH |
| 網路 | ping gateway、DNS lookup、traceroute |
| 靜態路由 | 從內部主機測試跨網段 |
| Policy | 查看 Policy hit、traffic log |
| 資安 Profile | 測試被允許與被阻擋的網站/服務 |
| IPsec VPN | tunnel up、兩端互 ping、查看 VPN event |
| SSL-VPN | 使用者登入、取得 tunnel IP、存取內網 |
| WiFi/Switch | Client 取得 DHCP、VLAN 正確、可上網 |
| 日誌 | 確認每個測試都有相對應 log |
| FortiView/監測 | 確認流量與 session 有出現 |

## 九、結論

FortiGate 初始設定最重要的觀念是：

1. 先設定設備與管理權限。
2. 再設定介面、VLAN、DNS、路由。
3. 再建立位址、服務、排程、使用者等可被引用的物件。
4. 再建立防毒、網頁過濾、DNS 過濾、IPS 等資安設定檔。
5. 最後建立 Policy、VPN、WiFi/Switch 與安全織網。
6. 完成後一定要透過日誌、FortiView、監測頁驗證。

照這個順序設定，可以避免「政策找不到物件」、「VPN 已建立但流量不通」、「VLAN 已建立但 Port 沒帶上」、「設定看起來完成但沒有日誌可查」這些常見問題。

