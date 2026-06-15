# Kyklos / Firewall-Man 防火牆管理操作手冊

本文件依照目前專案程式碼整理，目標是讓使用者知道「防火牆管理」頁面每個功能如何操作，以及如何確認規則真的有套用。

目前你的主機是 Ubuntu，因此實際使用的是 Linux 後端：

- IPv4：`iptables`
- IPv6：`ip6tables`
- Web UI：`http://10.20.100.241:10002`
- API 路由：維持舊版相容格式，沒有 `/api` prefix

## 1. 啟動與基本確認

防火牆管理會直接操作系統防火牆，不是先寫入 SQLite。因此服務必須用 root 權限執行。

建議啟動方式：

```bash
cd /workspaces/firewall-man
sudo ./kyklos -a :10002
```

確認 10002 port 是 `kyklos` 在監聽：

```bash
sudo ss -ltnp 'sport = :10002'
```

確認目前 process 實際執行的檔案：

```bash
sudo readlink -f /proc/<PID>/exe
```

確認平台 API：

```bash
curl -u admin:admin http://127.0.0.1:10002/platform
```

確認防火牆列表 API：

```bash
curl -u admin:admin -X POST http://127.0.0.1:10002/listRule \
  -d 'table=filter' \
  -d 'chain=' \
  -d 'protocol=ipv4'
```

如果回傳 `Permission denied`、`Operation not permitted`、`you must be root`，代表 `kyklos` 沒有足夠權限操作 iptables。

## 2. 頁面基本概念

左側進入：

```text
網路工具 / 防火牆管理
```

畫面上方有四個 iptables table：

- `filter`：最常用，控制允許或封鎖，例如 `INPUT`、`OUTPUT`、`FORWARD`。
- `nat`：NAT、Port Forward、MASQUERADE，例如 `PREROUTING`、`POSTROUTING`。
- `mangle`：封包標記、進階封包修改。
- `raw`：較早期的封包處理，一般較少使用。

畫面左上或上方有 IPv4 / IPv6 切換：

- 選 `ipv4` 時，後端呼叫 `iptables`。
- 選 `ipv6` 時，後端呼叫 `ip6tables`。

每個 table 下面會顯示 chain：

- `INPUT`：進入 Firewall-Man 主機本機的封包。
- `OUTPUT`：Firewall-Man 主機送出去的封包。
- `FORWARD`：經過 Firewall-Man 轉送的封包。
- `PREROUTING`：封包剛進入 NAT 流程時處理。
- `POSTROUTING`：封包準備送出前處理。

規則表格欄位：

- `num`：規則行號，刪除、修改、清零單條規則時會用到。
- `pkts` / `bytes`：命中封包數與流量。
- `target`：動作，例如 `ACCEPT`、`DROP`、`REJECT`、`MASQUERADE`。
- `prot`：協定，例如 `tcp`、`udp`、`icmp`、`all`。
- `in` / `out`：入口與出口介面。
- `source` / `destination`：來源與目的位址。
- `action`：延伸條件，例如 `tcp dpt:80`。

## 3. 按鈕用途

每個 chain 區塊上方的按鈕：

| 按鈕 | 用途 |
|---|---|
| 插入 | 在該 chain 前方插入規則，實際走 `iptables -I` |
| 添加 | 在該 chain 最後追加規則，實際走 `iptables -A` |
| 清零計數 | 清空該 chain 的封包與 bytes 計數，實際走 `iptables -Z` |
| 清空鏈 | 清空該 chain 所有規則，實際走 `iptables -F <chain>` |
| 重新整理 | 重新讀取該 chain |
| 查看命令 | 顯示該 chain 目前對應的 `iptables-save` 內容 |

每條規則右側的按鈕：

| 按鈕 | 用途 |
|---|---|
| 清零 | 只清零該規則行號的計數 |
| 刪除 | 刪除該規則行號 |

右側固定操作按鈕：

| 按鈕 | 用途 |
|---|---|
| 清空所有表規則 | 對 raw/mangle/nat/filter 執行 `-F`，風險高 |
| 清空當前表規則 | 清空目前選取 table 的所有 chain 規則 |
| 清空自定義空鏈 | 對所有 table 執行 `-X`，刪除沒有被引用的自定義 chain |
| 清零所有表計數 | 對所有 table 執行 `-Z` |
| 清零當前表計數 | 對目前 table 執行 `-Z` |
| 查看當前表規則 | 顯示目前 table 的 `iptables-save -t <table>` |
| 執行命令 | 手動送 iptables 參數 |
| 導出規則 | 匯出目前防火牆規則 |
| 導入規則 | 貼上 `iptables-save` 格式並匯入 |
| 命令文件 | 顯示 iptables 命令參考 |

## 4. 新增規則：最重要的操作方式

新增規則建議使用 chain 內的「插入」或「添加」按鈕，不要一開始就用「執行命令」。

操作流程：

1. 選擇 `ipv4` 或 `ipv6`。
2. 選擇 table，通常先選 `filter`。
3. 找到要操作的 chain，例如 `INPUT`。
4. 按「插入」或「添加」。
5. 在彈窗內填欄位。
6. 按「產出」，確認上方預覽命令。
7. 按「確認」套用。
8. 頁面會重新載入該 chain。

「插入」與「添加」差異：

- 插入：用 `-I`，通常會放在 chain 前面，優先匹配。
- 添加：用 `-A`，放在 chain 最後，可能被前面的 DROP 規則先擋掉。

正式放行服務時，通常建議先用「插入」。

## 5. 常用新增範例

允許外部連到本機 TCP 8080：

```text
table: filter
chain: INPUT
操作: 插入
協定: tcp
目的埠: 8080
目標: ACCEPT
```

等同：

```bash
iptables -t filter -I INPUT -p tcp --dport 8080 -j ACCEPT
```

只允許 10.20.50.0/24 連 SSH：

```text
table: filter
chain: INPUT
操作: 插入
協定: tcp
來源: 10.20.50.0/24
目的埠: 22
目標: ACCEPT
```

等同：

```bash
iptables -t filter -I INPUT -p tcp -s 10.20.50.0/24 --dport 22 -j ACCEPT
```

封鎖單一來源 IP：

```text
table: filter
chain: INPUT
操作: 插入
來源: 10.20.50.123
目標: DROP
```

等同：

```bash
iptables -t filter -I INPUT -s 10.20.50.123 -j DROP
```

允許已建立連線回應封包：

```text
table: filter
chain: INPUT
操作: 插入
比對模組: conntrack
連線狀態: ESTABLISHED, RELATED
目標: ACCEPT
```

等同：

```bash
iptables -t filter -I INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
```

內網透過 enp6s0 NAT 出去：

```text
table: nat
chain: POSTROUTING
操作: 添加
來源: 10.20.50.0/24
出介面: enp6s0
目標: MASQUERADE
```

等同：

```bash
iptables -t nat -A POSTROUTING -s 10.20.50.0/24 -o enp6s0 -j MASQUERADE
```

## 6. 修改規則

目前 UI 的修改方式是點規則列最左邊的 `num` 欄位。

操作流程：

1. 找到要修改的規則。
2. 點該列最左邊的 `num` 行號。
3. 後端會呼叫 `/getRuleInfo` 取得該行規則。
4. UI 會把 `-A` 改成 `-R <chain> <num>`。
5. 在彈窗內修改欄位或命令。
6. 按「確認」後套用。

範例：

```bash
iptables -t filter -R INPUT 3 -p tcp --dport 8080 -j ACCEPT
```

注意：修改規則時，如果點到 checkbox、空白區、或非規則列，可能沒有 table/chain/id，會出現：

```text
GetRuleInfo args error. table: chain: id:
```

這代表前端沒有帶到規則資訊，不是 iptables 本身錯誤。請改點規則列最左邊的 `num` 欄位。

## 7. 刪除規則

刪除單條規則：

1. 找到該規則。
2. 按右側「刪除」。
3. 確認彈窗。
4. 後端會執行：

```bash
iptables -t <table> -D <chain> <num>
```

例如刪除 `filter` table、`INPUT` chain 的第 3 條：

```bash
iptables -t filter -D INPUT 3
```

注意：iptables 行號會隨刪除而變動。連續刪多條時，請每刪一次重新確認行號。

## 8. 清零計數與清空規則

清零計數只會清除 `pkts` / `bytes`，不會刪除規則：

```bash
iptables -t filter -Z INPUT
iptables -t filter -Z INPUT 3
```

清空規則會刪除規則，風險較高：

```bash
iptables -t filter -F INPUT
iptables -t filter -F
```

正式環境操作前建議先匯出備份。

## 9. 執行命令的正確方式

「執行命令」只需要輸入 iptables 後面的參數，不要輸入完整 `iptables`。

正確：

```bash
-t filter -L -n -v --line-numbers
```

錯誤：

```bash
iptables -t filter -L -n -v --line-numbers
```

原因是後端已經會自己呼叫 `iptables` 或 `ip6tables`。如果你輸入完整指令，會變成類似：

```bash
iptables iptables -t filter -L -n -v --line-numbers
```

這會失敗。

手動新增 8080 放行時，輸入：

```bash
-t filter -I INPUT -p tcp --dport 8080 -j ACCEPT
```

不要輸入：

```bash
iptables -t filter -I INPUT -p tcp --dport 8080 -j ACCEPT
```

## 10. 匯出與匯入

「導出規則」會呼叫 `/export`，Linux 後端使用 `iptables-save`。

你也可以在主機手動備份：

```bash
sudo iptables-save > /tmp/iptables-backup.rules
sudo ip6tables-save > /tmp/ip6tables-backup.rules
```

「導入規則」會呼叫 `/import`，Linux 後端使用 `iptables-restore`。

匯入內容應該是 `iptables-save` 格式，不是單行 `iptables -A ...` 指令。例如：

```text
*filter
:INPUT ACCEPT [0:0]
:FORWARD ACCEPT [0:0]
:OUTPUT ACCEPT [0:0]
-A INPUT -p tcp --dport 8080 -j ACCEPT
COMMIT
```

## 11. 如何確認真的有套用

UI 新增規則後，建議用主機命令確認。

查看 filter table：

```bash
sudo iptables -t filter -nvL --line-numbers
```

查看 NAT table：

```bash
sudo iptables -t nat -nvL --line-numbers
```

查看完整 save 格式：

```bash
sudo iptables-save
```

如果是 IPv6：

```bash
sudo ip6tables -t filter -nvL --line-numbers
sudo ip6tables-save
```

用 curl 測試本機 port 是否被放行：

```bash
curl -I http://10.20.100.241:8080
```

用 nc 測試 TCP port：

```bash
nc -zv 10.20.100.241 8080
```

觀察規則計數是否增加：

```bash
sudo iptables -t filter -nvL INPUT --line-numbers
```

如果 `pkts` / `bytes` 沒增加，代表流量沒有打到該規則，可能是順序不對、table/chain 選錯、介面條件不符、或服務本身沒有監聽。

## 12. 常見測試情境

測試 1：開放 Web UI 10002

```text
table: filter
chain: INPUT
操作: 插入
協定: tcp
目的埠: 10002
目標: ACCEPT
```

主機確認：

```bash
sudo iptables -t filter -nvL INPUT --line-numbers
```

外部測試：

```bash
curl -I http://10.20.100.241:10002
```

測試 2：只允許 10.20.50.0/24 連 10002

```text
table: filter
chain: INPUT
操作: 插入
協定: tcp
來源: 10.20.50.0/24
目的埠: 10002
目標: ACCEPT
```

測試 3：阻擋特定 IP

```text
table: filter
chain: INPUT
操作: 插入
來源: 10.20.50.123
目標: DROP
```

測試 4：Juniper 管理網段 NAT 出外網

```text
table: nat
chain: POSTROUTING
操作: 添加
來源: 10.20.50.0/24
出介面: enp6s0
目標: MASQUERADE
```

## 13. 常見問題

### 13.1 UI 顯示成功，但主機查不到規則

請確認：

```bash
sudo ss -ltnp 'sport = :10002'
sudo readlink -f /proc/<PID>/exe
ps -eo pid,user,cmd | grep -E 'kyklos|firewall-man'
```

如果不是 root 執行，iptables 可能不會成功。

### 13.2 IPv4 / IPv6 選錯

UI 上選 `ipv4` 才會操作 `iptables`。

UI 上選 `ipv6` 才會操作 `ip6tables`。

請分別確認：

```bash
sudo iptables -t filter -nvL --line-numbers
sudo ip6tables -t filter -nvL --line-numbers
```

### 13.3 iptables-nft 與 iptables-legacy 不一致

Ubuntu 22.04 預設常見是 `iptables-nft`。確認目前系統使用哪個 backend：

```bash
sudo iptables --version
sudo update-alternatives --display iptables
```

如果主管用 `iptables-legacy` 看，而 Kyklos 用 `iptables-nft` 寫，會以為沒有套用。

### 13.4 規則順序錯誤

iptables 是由上往下匹配。若前面已經有 DROP，後面再 ACCEPT 可能不會生效。

解法：

- 放行規則用「插入」而不是「添加」。
- 查看 `num` 順序。
- 必要時修改或刪除前面的 DROP。

### 13.5 防火牆規則正確，但服務仍連不上

請確認服務本身有監聽：

```bash
sudo ss -ltnp
```

例如 8080 沒有任何服務 listen，即使防火牆 ACCEPT，連線仍會失敗。

### 13.6 `GetRuleInfo args error. table: chain: id:`

代表修改規則時沒有帶到 table、chain、id。通常是點錯位置。

正確做法：

- 點規則表格最左邊的 `num` 欄位進行修改。
- 不要點 Port 管理或其他頁面的 checkbox 觸發防火牆規則編輯。

## 14. API 對照表

| API | 方法 | 說明 |
|---|---|---|
| `/listRule` | POST | 列出規則 |
| `/listExec` | POST | 顯示 save 格式規則 |
| `/flushRule` | POST | 清空規則 |
| `/deleteRule` | POST | 刪除指定行號規則 |
| `/flushMetrics` | POST | 清零計數 |
| `/getRuleInfo` | POST | 取得指定行號規則 |
| `/flushEmptyCustomChain` | POST | 清除空的自定義 chain |
| `/export` | POST | 匯出規則 |
| `/import` | POST | 匯入規則 |
| `/exec` | POST | 執行手動參數 |

常用 curl 範例：

```bash
curl -u admin:admin -X POST http://127.0.0.1:10002/listRule \
  -d 'table=filter' \
  -d 'chain=INPUT' \
  -d 'protocol=ipv4'
```

```bash
curl -u admin:admin -X POST http://127.0.0.1:10002/exec \
  -d 'protocol=ipv4' \
  -d 'args=-t filter -I INPUT -p tcp --dport 8080 -j ACCEPT'
```

```bash
curl -u admin:admin -X POST http://127.0.0.1:10002/deleteRule \
  -d 'table=filter' \
  -d 'chain=INPUT' \
  -d 'id=3' \
  -d 'protocol=ipv4'
```

## 15. 安全建議

正式操作前先備份：

```bash
sudo iptables-save > /tmp/iptables-backup-$(date +%Y%m%d%H%M%S).rules
sudo ip6tables-save > /tmp/ip6tables-backup-$(date +%Y%m%d%H%M%S).rules
```

避免直接清空所有表規則，除非已確認主機可從 console 或其他方式救援。

若要修改 SSH 或 Web UI port 的規則，先開第二個連線視窗確認新規則有效，再關閉原連線。
