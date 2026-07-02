# FortiGate 功能與操作說明

更新日期：2026-07-01

本文整理目前 Firewall-Man / Kyklos 內「FortiGate」功能的選單、操作方式、目前是否正常、是否必要、設計完整度與後續可擴充方向。

> 重要說明：目前 FortiGate 功能主要是前端模擬管理介面，資料多數儲存在瀏覽器 `localStorage`，尚未連線真實 FortiGate 90D API / SSH / CLI，也不會實際下發 FortiGate 設定。本文中的「正常」指目前 UI 操作、資料新增/編輯/刪除、頁面切換與本地保存是否正常，不代表已完成真實設備設定同步。

## 整體狀態

目前 FortiGate 模組已有完整左側選單、次選單展開、頁面切換、部分資料 CRUD、拓樸示意、監測示意、日誌檢視與 VPN/IPsec 操作流程。

整體設計方向大致正確，已接近「FortiGate 90D Web UI 原型操作介面」。但若要作為真正設備管理工具，仍缺少後端連線、設定下發、設定備份、差異比對、權限控管、真實日誌/監控資料來源等關鍵功能。

## 操作共通說明

1. 左側點擊主選單可展開次選單。
2. 點擊次選單會切換右側內容頁。
3. 多數清單頁可點選資料列，選取後可編輯、刪除或啟用/停用。
4. 多數新增/編輯資料目前保存於瀏覽器 `localStorage`。
5. 重新整理頁面後，多數前端狀態會保留，但清除瀏覽器資料後會恢復預設值。
6. 目前「重新整理」多為 UI 回饋與時間更新，不會從真實 FortiGate 拉資料。

## 狀態標記

| 標記 | 意義 |
|---|---|
| 正常 | 目前 UI 流程可操作，資料可保存或互動正常 |
| 部分正常 | 主要畫面可用，但仍有功能不足或資料未連真實來源 |
| 展示用 | 以畫面展示、假資料、模擬圖表為主 |
| 待補後端 | UI 已具雛形，但需要真實 FortiGate 後端 API / SSH / CLI 才能算完成 |

## 選單總覽

目前 FortiGate 模組包含以下主選單：

| 主選單 | 說明 | 目前狀態 |
|---|---|---|
| 儀表板 | FortiGate 系統總覽、狀態卡與流量摘要 | 展示用 |
| 安全織網 | 實體/邏輯拓樸、自動化、Fabric 設定與 Connector | 部分正常 |
| FortiView | 流量、來源、目的、應用、威脅、會話等視覺化檢視 | 展示用 |
| 網路 | 介面、DNS、封包擷取、SD-WAN、靜態路由 | 部分正常 |
| 系統管理 | 管理員、憑證、HA、SNMP、FortiGuard、進階功能等 | 部分正常 |
| 政策 & 物件 | IPv4 政策、位址、服務、排程 | 部分正常 |
| 資安管理設定 | 防毒、網頁/DNS 過濾、IPS、SSL 檢查等 | 部分正常 |
| VPN | Overlay VPN、IPsec、SSL-VPN | 部分正常 |
| 用戶與設備 | 使用者、群組、設備、LDAP/RADIUS、FortiToken | 部分正常 |
| WiFi & Switch 控制器 | FortiAP、SSID、FortiSwitch、Ports、VLAN、拓樸 | 部分正常 |
| 日誌與報表 | 流量、系統、VPN、用戶、資安相關日誌 | 展示用 |
| 監測 | 路由、VPN、Session 監測 | 部分正常 |

## 儀表板

| 項目 | 說明 |
|---|---|
| 功能 | 顯示系統狀態、流量摘要、Widget 類資訊 |
| 是否正常 | 展示正常 |
| 是否需要 | 需要，是進入 FortiGate 工具後的總覽入口 |
| 目前設計是否正確 | 方向正確，但目前資料為靜態/模擬 |
| 尚缺功能 | 真實 CPU/Memory/Session、授權狀態、FortiGuard 狀態、HA 狀態、介面流量 |
| 可再添加 | 自動刷新、Widget 自訂、告警摘要、最近設定變更 |

## 安全織網

| 次選單 | 功能 | 是否正常 | 是否需要 | 設計評估 | 尚缺或可加 |
|---|---|---|---|---|---|
| 實體拓樸圖 | 新增/刪除拓樸物件、顯示實體關聯 | 部分正常 | 需要 | 接近可視化管理，但仍是模擬 | 拖拉位置保存、連線關係編輯、設備狀態同步 |
| 邏輯拓樸圖 | 顯示邏輯流向與 Fabric 關係 | 部分正常 | 需要 | 已比原始表格更合理 | 與介面/VLAN/Policy 實際關聯 |
| 自動化 | 管理自動化項目，支援新增/編輯/刪除 | 正常 | 需要 | UI 可操作 | 事件觸發條件、Action 腳本、通知管道 |
| 設置 | Fabric 狀態與管理介面設定 | 部分正常 | 需要 | 基本方向正確 | 真實 Fabric enable/disable、上游 FortiManager/FortiAnalyzer |
| Fabric Connectors | Connector 清單與管理 | 正常 | 需要 | 可作為初版 | Connector 類型細分、雲端帳號驗證、連線測試 |

## FortiView

FortiView 目前以視覺化與表格模擬為主，適合展示操作流程，不是真實即時流量分析。各頁面的搜尋、Top N、時間範圍與主要下拉篩選已會實際影響前端表格結果；但資料仍為範例資料，尚未串接真實 FortiGate log / runtime statistics。

| 次選單 | 功能 | 是否正常 | 是否需要 | 設計評估 | 尚缺或可加 |
|---|---|---|---|---|---|
| 流量來自 LAN/DMZ | 來源區段流量檢視、真實流量來源欄位、時間範圍 | 展示用 | 需要 | 已加入資料來源提示與時間範圍 | 待串接真實 Traffic log |
| 來源 | 來源 IP/主機排行、Top N、篩選條件 | 部分正常 | 需要 | Top N、來源角色、排序依據、時間範圍已可篩選/排序前端資料 | 待串接真實 source 統計 |
| 目的 | 目的 IP/FQDN、國家、目的介面統計 | 展示用 | 需要 | 已加入 destination 統計欄位 | 待串接真實 destination 統計 |
| 應用程式 | App category、風險等級、使用者、Policy | 展示用 | 需要 | 已加入 App category 與 risk 欄位 | 待串接 Application Control |
| 雲端應用程式 | SaaS 分類、使用者關聯、動作 | 展示用 | 視需求 | 已加入 SaaS 分類與 user mapping | 待串接 Cloud App DB |
| 網站 | URL category、allowed/blocked、Policy | 展示用 | 需要 | 已加入 URL 類別與動作欄位 | 待串接 Web Filter log |
| 威脅 | IPS/AV/DNS 事件、嚴重性、動作 | 展示用 | 需要 | 已整合成單一威脅選單 | 待串接 IPS/AV 真實事件 |
| WiFi 客戶端 | FortiAP client list、SSID、訊號、頻段 | 展示用 | 視是否管理 WiFi | 已加入 FortiAP client 欄位 | 待串接 FortiAP client list |
| 流量塑形 | Shaper policy、bandwidth、Dropped bytes | 展示用 | 視需求 | 已加入 Shaper policy 與頻寬欄位 | 待串接 Traffic Shaper counters |
| 流量來自 WAN | WAN interface、Rx/Tx、來源國家統計 | 展示用 | 需要 | 已加入 WAN interface 統計欄位 | 待串接介面流量來源 |
| 主機 | IP/MAC/user mapping、OS、最後活動 | 展示用 | 需要 | 已加入主機映射欄位 | 待串接 DHCP/Device inventory |
| 所有區段 | 多維度篩選、Traffic/Security/Event 彙整 | 展示用 | 需要 | 已加入區段與資料類型篩選 | 待串接多來源 log |
| VPN | IPsec/SSL-VPN session | 展示用 | 需要 | 已加入真實 session 欄位設計 | 待串接 VPN runtime status |
| Endpoint 漏洞 | FortiClient EMS、Compliance、漏洞數 | 展示用 | 視 FortiClient 使用情況 | 已加入 EMS 整合欄位 | 待串接 FortiClient EMS |
| 資安威脅地圖 | GeoIP、即時事件流、事件表、篩選 | 部分正常 | 可選但有展示價值 | 目前已重新設計 | 待串接真實 GeoIP / event stream |
| 政策 | Policy UUID / hit count | 展示用 | 需要 | 已加入 UUID 與 Hit Count 欄位 | 待串接 Policy statistics |
| 介面 | RX/TX、錯誤封包、Sessions | 展示用 | 需要 | 已加入 RX/TX error 欄位 | 待串接 interface counters |
| 連線會話 | Session table、Kill session preview | 展示用 | 需要 | 已加入 Session ID 與 Kill 操作入口 | 待串接真實 kill session API/CLI |

## 網路

| 次選單 | 功能 | 是否正常 | 是否需要 | 設計評估 | 尚缺或可加 |
|---|---|---|---|---|---|
| 介面 | 介面清單、成員、DHCP、狀態、讀取介面、建立 VLAN、IP/DHCP 下發入口 | 部分正常 | 必要 | 已加入同步/下發與 CLI 預覽流程 | 待串接真實 FortiGate interface API/CLI |
| DNS | DNS 模式、Primary/Secondary、本機網域、DNS over TLS、FortiGuard DNS、CLI 同步 | 部分正常 | 必要 | 已加入 DoT/FortiGuard DNS 與 CLI preview | 待串接真實 DNS CLI 下發 |
| 封包擷取 | Capture 條件、開始/停止、輸出摘要、pcap preview 下載 | 部分正常 | 需要 | 已具備可操作 sniffer 流程 | 待串接真實 sniffer 與 pcap 檔案 |
| SD-WAN | SD-WAN member、Zone、gateway、SLA、member 狀態 | 部分正常 | 視需求 | 已改為專用 SD-WAN member 頁 | 待串接真實 SD-WAN member 狀態 |
| SD-WAN 服務品質檢測 | SLA 目標、latency、jitter、loss、linked member | 部分正常 | 視需求 | 已加入實測結果欄位與執行實測入口 | 待串接真實 SLA probe |
| SD-WAN 優先等級規則 | SD-WAN rule、match 條件、策略、policy linkage | 部分正常 | 視需求 | 已加入 Policy 關聯與規則條件欄位 | 待串接真實 SD-WAN rule 下發 |
| 靜態路由 | Route 清單、routing table 讀取、distance/priority 下發入口 | 部分正常 | 必要 | 已加入 routing table 同步與 distance/priority 預覽 | 待串接真實 routing table 與 route 下發 |

## 系統管理

| 次選單 | 功能 | 是否正常 | 是否需要 | 設計評估 | 尚缺或可加 |
|---|---|---|---|---|---|
| 系統管理員 | 管理員清單、密碼更新入口、2FA、trusthost、profile、管理方式 | 前端正常 | 必要 | 已改為管理員專用表格與彈窗 | 待串接真實 FortiGate admin CLI/API |
| 管理權限配置表 | Admin profile 權限矩陣 | 前端正常 | 必要 | 已加入 System/Network/Policy/VPN/Log read-write/read/none 矩陣 | 待串接真實 profile 權限讀寫 |
| 證書 | 匯入/匯出、CSR、Issuer、使用服務、到期提醒 | 前端正常 | 必要 | 已改為憑證管理頁與提醒狀態 | 待串接檔案上傳、CSR 產生與 FortiGate 憑證庫 |
| 設定 | Hostname、時區、管理 port、NTP、CLI preview | 前端正常 | 必要 | 欄位已持久化並可產生 CLI 同步草稿 | 待串接真實 CLI 下發 |
| 高可靠性 | HA peer、heartbeat、sync status、failover | 前端正常 | 視環境 | 已加入 peer/sync/failover 操作入口 | 待串接 HA status 與 failover API/CLI |
| SNMP | v2c、v3 user、trap host、測試 | 前端正常 | 視需求 | 已加入 v3/trap/test 區塊 | 待串接 snmpwalk/trap 測試與 CLI 下發 |
| 替換訊息 | Replacement message 清單、HTML/template editor | 前端正常 | 可選 | 已可編輯並保存 template 草稿 | 待串接 FortiGate replacement message 寫入 |
| FortiGuard | 授權、資料庫版本、更新、連線測試 | 前端正常 | 必要 | 已加入 license/update/connectivity 操作入口 | 待串接授權與 FortiGuard update 狀態 |
| 進階設定 | CLI-only 參數、管理安全性、風險提示 | 前端正常 | 可選 | 已加入 CLI-only 參數與風險提示 | 待串接 CLI diff 與備份流程 |
| 進階功能開關 | Feature visibility、同步時間 | 前端正常 | 需要 | 已加入真實狀態同步入口與同步時間 | 待串接真實 feature visibility CLI |
| 標籤 | Tag/Label 管理、物件引用統計 | 前端正常 | 可選 | 已加入引用總數與目前選取標籤引用摘要 | 待串接政策/物件實際引用查詢 |

## 政策 & 物件

| 次選單 | 功能 | 是否正常 | 是否需要 | 設計評估 | 尚缺或可加 |
|---|---|---|---|---|---|
| IPv4 政策 | Policy 新增/編輯/刪除、NAT、Profile | 部分正常 | 必要 | 核心方向正確 | Policy order、drag reorder、install preview |
| 位址 | Address object 管理 | 部分正常 | 必要 | 已有 IP/FQDN 欄位 | Address group、GeoIP、Interface binding |
| 服務 | Service object 管理 | 正常 | 必要 | 基本可用 | TCP/UDP/SCTP、service group |
| 排程 | Schedule object 管理 | 部分正常 | 必要 | 已包含時間欄位 | Recurring/one-time 詳細 UI |

## 資安管理設定

| 次選單 | 功能 | 是否正常 | 是否需要 | 設計評估 | 尚缺或可加 |
|---|---|---|---|---|---|
| 防毒 | AV profile 與掃描選項 | 部分正常 | 需要 | 可作為初版 | Profile 保存/載入、Protocol options |
| 網頁過濾 | URL filter / category | 部分正常 | 需要 | 已具備 URL 欄位 | Category rating、override、quota |
| DNS 過濾器 | DNS domain filter | 部分正常 | 需要 | 已具備 domain/DNS 欄位 | DNS category、safe search |
| 應用程式控制 | App control profile | 部分正常 | 視需求 | 初版可用 | App signature category、action |
| 入侵偵測防禦 | IPS profile | 部分正常 | 需要 | 初版可用 | Signature filter、severity、sensor |
| FortiClient Compliance | Endpoint compliance | 部分正常 | 視 EMS 是否使用 | 已多次重新設計 | EMS API、posture、quarantine |
| SSL/SSH 深層檢查 | Inspection profile | 部分正常 | 需要 | 目前可操作 | CA 選擇、exempt list |
| 網站自定惡意評級 | Rating override | 部分正常 | 可選 | 可保留 | FortiGuard override sync |
| 自訂特徵值 | Custom signature | 部分正常 | 進階功能 | 可保留 | 語法檢查、測試、版本管理 |

## VPN

| 次選單 | 功能 | 是否正常 | 是否需要 | 設計評估 | 尚缺或可加 |
|---|---|---|---|---|---|
| Overlay Controller VPN | 分支 Peer 管理 | 部分正常 | 視 SD-Branch 需求 | 目前可作初版 | Peer onboarding、拓樸、健康狀態 |
| IPsec 通道 | 通道清單、狀態圖、Phase、設定摘要、CRUD | 正常（前端） | 必要 | 已重新設計，較完整 | 真實 tunnel status、bring up/down、CLI preview |
| IPsec 精靈 | 三步驟建立草稿 | 部分正常 | 必要 | 流程合理 | 更多 VPN 類型、PSK/憑證、proposal/lifetime |
| IPsec 通道範本 | 範本清單、參數、建立草稿、套用精靈 | 正常（前端） | 需要 | 已配合新版 IPsec 通道重設計 | 自訂範本、匯入/匯出、範本版本 |
| SSL-VPN 入口頁面 | Portal、Bookmark、Split Tunnel | 部分正常 | 需要 | 有基本關聯 | Portal rule、user group mapping |
| SSL-VPN 設定 | Listen port、interface、host、address range | 部分正常 | 必要 | 基本方向正確 | 真實 ssl.root、policy linkage、登入測試 |

## 用戶與設備

| 次選單 | 功能 | 是否正常 | 是否需要 | 設計評估 | 尚缺或可加 |
|---|---|---|---|---|---|
| 用戶認證 | Local user 類資料管理 | 正常 | 必要 | 可作初版 | 密碼、2FA、status、expiry |
| 用戶群組 | User group 管理 | 正常 | 必要 | 可作初版 | member picker、remote group |
| 來賓管理 | Guest account / portal | 正常 | 視需求 | 可保留 | 到期時間、Sponsor approval |
| 設備清單 | Device inventory | 正常 | 需要 | 可保留 | MAC/IP/user mapping |
| 設備群組 | Device group | 正常 | 視需求 | 可保留 | Dynamic group |
| LDAP | LDAP server 管理 | 正常 | 視需求 | 可保留 | Bind test、Base DN browse |
| RADIUS 認證 | RADIUS server 管理 | 正常 | 視需求 | 可保留 | Auth test、secret masking |
| 身份驗證設定 | Auth global settings | 正常 | 需要 | 可保留 | Timeout、portal、fallback |
| FortiToken | Token 管理 | 正常 | 視需求 | 可保留 | Activate/revoke、user binding |

## WiFi & Switch 控制器

| 次選單 | 功能 | 是否正常 | 是否需要 | 設計評估 | 尚缺或可加 |
|---|---|---|---|---|---|
| 受管理的 FortiAP | AP 清單管理 | 正常 | 視環境 | 可保留 | AP online status、channel/power |
| SSID | SSID 管理 | 正常 | 視環境 | 可保留 | Security mode、VLAN、schedule |
| FortiAP 設定檔 | AP profile 管理 | 正常 | 視環境 | 可保留 | Radio profile |
| 受管理的 FortiSwitch | Switch 清單管理 | 正常 | 視環境 | 可保留 | FortiLink status |
| Switch Ports | Port 清單、示意圖連動、避免重複 Port | 部分正常 | 需要 | 已多次修正，方向正確 | 真實 port status、PoE、LLDP |
| Switch VLANs | VLAN 清單與示意 | 部分正常 | 需要 | 可保留 | VLAN/Port 關聯同步 |
| WiFi / Switch 拓樸 | WiFi/Switch 拓樸 | 部分正常 | 視環境 | 可保留 | AP/Switch/VLAN 真實關聯 |

## 日誌與報表

目前日誌與報表多為假資料與 UI 展示，尚未接 FortiGate log source。

| 次選單 | 功能 | 是否正常 | 是否需要 | 設計評估 | 尚缺或可加 |
|---|---|---|---|---|---|
| 轉發流量 | Forward traffic log | 展示用 | 必要 | 可保留 | 真實 traffic log、filter/export |
| 本地流量 | Local traffic log | 展示用 | 需要 | 可保留 | Local-in/out log |
| 系統事件 | System event log | 展示用 | 必要 | 可保留 | Event subtype |
| 路由事件 | Routing log | 展示用 | 視需求 | 可保留 | Route change events |
| VPN 事件 | VPN log | 展示用 | 必要 | 可保留 | IPsec/SSL-VPN auth events |
| 用戶事件 | User auth log | 展示用 | 需要 | 可保留 | Login/logout |
| 端點事件 | Endpoint log | 展示用 | 視 EMS 需求 | 可保留 | EMS/FortiClient |
| HA 事件 | HA log | 展示用 | 視 HA 需求 | 可保留 | Failover/sync |
| WiFi 事件 | WiFi log | 展示用 | 視 WiFi 需求 | 可保留 | AP/client events |
| 防毒 | AV log | 展示用 | 需要 | 可保留 | Malware detection |
| 網頁過濾器 | Web filter log | 展示用 | 需要 | 可保留 | URL/category/action |
| DNS 查詢 | DNS log | 展示用 | 需要 | 可保留 | Query/domain/action |
| 應用控制 | App control log | 展示用 | 視需求 | 可保留 | App/category/action |
| 入侵偵測 | IPS log | 展示用 | 需要 | 可保留 | Signature/severity |
| 異常 | Anomaly log | 展示用 | 視需求 | 可保留 | DoS/anomaly |

## 監測

| 次選單 | 功能 | 是否正常 | 是否需要 | 設計評估 | 尚缺或可加 |
|---|---|---|---|---|---|
| 路由監測 | Route 狀態卡與清單連動 | 部分正常 | 需要 | 已有互動 | 真實 routing table、gateway check |
| VPN 監測 | VPN 狀態圖與清單連動 | 部分正常 | 需要 | 可保留 | 真實 tunnel/session |
| Session Monitor | Session 表格 | 展示用 | 必要 | 可保留 | Kill session、filter、NAT detail |

## 目前設計是否正確

目前設計作為「FortiGate 90D 風格的管理介面原型」是正確的，尤其是：

- 左側選單結構已接近 FortiGate 類型。
- 多數頁面已不是空白模板，而有各自的功能語意。
- 清單、選取、彈窗、啟用/停用、搜尋、拓樸、狀態卡等基本互動已具備。
- VPN / IPsec 頁面近期已重新設計，完整度比其他模組更高。
- WiFi/Switch、監測、日誌、資安管理設定已有明確方向。

但作為「真正可管理 FortiGate 設備」仍不完整，因為缺少後端整合與真實設備狀態。

## 尚缺的核心功能

以下是若要從 UI 原型進入可用管理工具，必須補上的功能：

1. FortiGate 連線設定
   - Host/IP
   - Port
   - HTTPS API Token 或帳密
   - VDOM
   - Timeout
   - 連線測試

2. FortiGate API / CLI service
   - REST API client
   - SSH CLI fallback
   - 錯誤處理
   - Commit / preview / rollback

3. 設定同步
   - 從設備讀取目前設定
   - UI 修改後產生設定差異
   - 套用前預覽
   - 套用後重新讀取確認

4. 設定備份與還原
   - 匯出完整 config
   - 匯入/還原
   - 套用前自動備份

5. 權限控管
   - 只讀/可編輯/管理員
   - 危險操作二次確認
   - 操作紀錄

6. 真實監控資料
   - Interface status
   - Session
   - VPN tunnel
   - FortiGuard license
   - HA sync
   - Logs

7. 設定驗證
   - IP/CIDR 格式
   - Port 範圍
   - 重複物件名稱
   - Policy 順序與引用檢查
   - VLAN / Interface / Address object 引用檢查

## 建議後續開發順序

建議不要一次把所有 FortiGate 功能接上真實設備，應分階段完成。

### 第一階段：設備連線與唯讀同步

1. FortiGate 連線設定頁
2. 設備資訊
3. Interface 讀取
4. Address object 讀取
5. IPv4 Policy 讀取
6. VPN/IPsec 狀態讀取
7. System / FortiGuard / HA 狀態讀取

### 第二階段：核心設定可寫入

1. Address object CRUD
2. Service object CRUD
3. Schedule CRUD
4. IPv4 Policy CRUD
5. Static route CRUD
6. Interface 基本設定

### 第三階段：VPN

1. IPsec tunnel 讀取
2. IPsec tunnel 草稿產生
3. 設定預覽
4. 套用 / rollback
5. Bring up / bring down
6. SSL-VPN portal / settings 同步

### 第四階段：監控與日誌

1. Session Monitor
2. VPN Monitor
3. Route Monitor
4. Traffic logs
5. Security logs
6. Log filter / export

### 第五階段：進階模組

1. WiFi / FortiSwitch
2. FortiClient Compliance
3. FortiGuard license/update
4. HA failover/sync
5. Automation stitches
6. Fabric Connectors

## 可再添加的功能

| 功能 | 說明 | 優先度 |
|---|---|---|
| 設定差異比對 | 顯示 UI 草稿與設備目前設定差異 | 高 |
| 套用前預覽 | 顯示將下發的 API/CLI 指令 | 高 |
| 操作審計 | 記錄誰在何時改了什麼 | 高 |
| 設定快照 | 每次套用前自動保存設備設定 | 高 |
| 真實 FortiGate API Token 管理 | 安全保存 token | 高 |
| 日誌查詢與匯出 | CSV/JSON 匯出 | 中 |
| Dashboard 自動刷新 | 週期拉取設備狀態 | 中 |
| Policy hit count | 顯示政策命中次數 | 中 |
| Object reference viewer | 查某個 address/service 被哪些 policy 使用 | 中 |
| VPN 診斷 | Phase1/Phase2 狀態、錯誤原因、IKE debug 摘要 | 高 |
| CLI Console | 受限制的 FortiGate CLI 執行 | 中 |
| 多設備管理 | 管理多台 FortiGate | 中 |
| VDOM 支援 | 多 VDOM 選擇與切換 | 中 |
| 匯入 FortiGate config | 從 config 解析現有設定 | 中 |

## 結論

目前 FortiGate 功能已經具備完整前端原型與大部分操作入口。若目標是展示與 UI 驗收，目前功能已可繼續細修畫面與互動。

若目標是實際管理 FortiGate 90D，下一步不應繼續只補畫面，而應優先實作 FortiGate 連線設定、唯讀資料同步與設定套用前預覽。完成這三件事後，現有 UI 才能逐步轉成真正可用的 FortiGate 管理工具。
