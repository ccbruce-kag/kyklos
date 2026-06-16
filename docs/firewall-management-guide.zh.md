# Firewall-Man 防火牆管理操作說明

本文件依照目前專案程式碼整理。防火牆管理頁面不是把規則先存到 SQLite，而是透過後端直接呼叫系統指令：

- Linux：`iptables` / `ip6tables`
- macOS：`pfctl`
- Windows：PowerShell NetSecurity

目前 Firewall-Man 主機是 Ubuntu，因此實際會走 Linux 的 `iptables` / `ip6tables`。

## 1. 執行前條件

Linux 防火牆管理要能正常套用，必須符合以下條件：

1. Firewall-Man 服務要用 root 權限執行，或具備 `CAP_NET_ADMIN`。
2. 系統上要有 `iptables` 指令。
3. 若要管理 IPv6，系統上也要有 `ip6tables` 指令。
4. Web UI 使用中的 process 必須是目前重新編譯後的新版 binary。
5. 若在 container 內執行，container 必須具備操作 host firewall 的權限，否則畫面能開但規則不會作用到主機。

建議啟動方式：

```bash
cd /workspaces/firewall-man
sudo ./kyklos -a :10002
```

若你目前仍使用舊檔名，也可能是：

```bash
sudo ./firewall-man -a :10002
```

請以實際編譯出的 binary 為準。目前 `Makefile` 的 release 目標會產出 `kyklos`。

## 2. 確認服務是否真的跑新版

查看 10002 port 目前由哪個 process 監聽：

```bash
sudo ss -ltnp 'sport = :10002'
```

假設看到 PID 是 `12345`，再確認它指向哪個 binary：

```bash
sudo readlink -f /proc/12345/exe
```

確認 API 可用：

```bash
curl -i -u admin:admin http://127.0.0.1:10002/platform
curl -i -u admin:admin http://127.0.0.1:10002/version
```

確認防火牆列表 API 可用：

```bash
curl -u admin:admin -X POST http://127.0.0.1:10002/listRule \
  -d 'table=filter' \
  -d 'chain=' \
  -d 'protocol=ipv4'
```

如果這裡回傳 `Permission denied`、`Operation not permitted`、`you must be root`，代表服務執行權限不對。

## 3. 防火牆頁面概念

頁面上方的 `raw`、`mangle`、`nat`、`filter` 是 iptables table。

常用的是：

- `filter`：一般允許、拒絕封包，例如 INPUT / OUTPUT / FORWARD。
- `nat`：位址轉換、Port Forward，例如 PREROUTING / POSTROUTING。
- `mangle`：封包標記或進階調整。
- `raw`：較早期的封包處理，通常少用。

每個 table 下面會列出 chain：

- `INPUT`：進入 Firewall-Man 主機本機的流量。
- `OUTPUT`：Firewall-Man 主機送出去的流量。
- `FORWARD`：經過 Firewall-Man 轉送的流量。
- `PREROUTING` / `POSTROUTING`：多見於 NAT table。

每條規則的 `num` 是目前行號。刪除或修改規則時會用這個行號。

## 4. UI 操作對應的後端行為

防火牆 API 沒有 `/api` prefix，路由是舊版相容格式：

- 查詢規則：`POST /listRule`
- 查看目前表規則命令：`POST /listExec`
- 清空規則：`POST /flushRule`
- 刪除規則：`POST /deleteRule`
- 清零計數：`POST /flushMetrics`
- 修改單條規則：`POST /getRuleInfo` 後再 `POST /exec`
- 匯出規則：`POST /export`
- 匯入規則：`POST /import`
- 手動執行命令：`POST /exec`

後端會依 `protocol` 選擇：

- `ipv4`：執行 `iptables`
- `ipv6`：執行 `ip6tables`

## 5. 新增規則的填寫方式

在某個 chain 按「插入」或「追加」時，畫面會自動帶入前綴，例如：

```bash
iptables -t filter -A INPUT
```

你只需要填前綴後面的條件，例如：

```bash
-p tcp --dport 8080 -j ACCEPT
```

最後後端實際執行會變成：

```bash
iptables -t filter -A INPUT -p tcp --dport 8080 -j ACCEPT
```

常用欄位：

- 協定 `-p`：`tcp`、`udp`、`icmp`。
- 來源 `-s`：來源 IP 或 CIDR，例如 `10.20.50.0/24`。
- 目的 `-d`：目的 IP 或 CIDR。
- 入介面 `-i`：例如 `enp6s0`。
- 出介面 `-o`：例如 `enp7s0`。
- 目的埠 `--dport`：例如 `22`、`80`、`443`。
- 來源埠 `--sport`：通常較少填。
- 連線狀態 `--ctstate`：例如 `NEW`、`ESTABLISHED`、`RELATED`。
- 目標 `-j`：`ACCEPT`、`DROP`、`REJECT`、`LOG`、`MASQUERADE`、`DNAT`、`SNAT`。

## 6. 常見範例

允許外部連到本機 TCP 8080：

```bash
table: filter
chain: INPUT
操作: 追加
條件: -p tcp --dport 8080 -j ACCEPT
```

允許 10.20.50.0/24 連到本機 SSH：

```bash
table: filter
chain: INPUT
操作: 插入
條件: -p tcp -s 10.20.50.0/24 --dport 22 -j ACCEPT
```

封鎖某個來源 IP：

```bash
table: filter
chain: INPUT
操作: 插入
條件: -s 10.20.50.123 -j DROP
```

NAT 出口轉換，常見於內網對外：

```bash
table: nat
chain: POSTROUTING
操作: 追加
條件: -s 10.20.50.0/24 -o enp6s0 -j MASQUERADE
```

## 7. 「執行命令」按鈕注意事項

「執行命令」雖然畫面會顯示 `iptables`，但輸入框只要填參數，不要填完整指令。

正確：

```bash
-t filter -L -n -v --line-numbers
```

錯誤：

```bash
iptables -t filter -L -n -v --line-numbers
```

原因是後端已經固定呼叫 `iptables` binary。若輸入完整指令，會變成類似：

```bash
iptables iptables -t filter -L -n -v --line-numbers
```

這會執行失敗。

## 8. 目前 UI 的限制

目前 `/exec` 會把輸入用空白切成參數後直接傳給 `iptables`。因此含有複雜引號的規則可能不適合從「執行命令」直接輸入。

例如 comment 這類需要保留空白的內容：

```bash
-m comment --comment "allow web service" -j ACCEPT
```

可能被切成多個參數，導致結果不如預期。建議第一版先使用無空白的 comment，或改用匯入完整 `iptables-save` 格式。

## 9. 排錯流程

如果主管測試覺得沒有正常執行，建議照下面順序確認。

確認服務是否 root 執行：

```bash
ps -eo pid,user,cmd | grep -E 'kyklos|firewall-man'
```

確認後端 API 讀得到規則：

```bash
curl -u admin:admin -X POST http://127.0.0.1:10002/listRule \
  -d 'table=filter' \
  -d 'chain=' \
  -d 'protocol=ipv4'
```

確認系統指令看到同一份規則：

```bash
sudo iptables -t filter -nvL --line-numbers
sudo iptables-save -t filter
```

確認不是 IPv4 / IPv6 選錯：

```bash
sudo iptables -t filter -nvL --line-numbers
sudo ip6tables -t filter -nvL --line-numbers
```

確認 iptables backend：

```bash
sudo iptables --version
sudo update-alternatives --display iptables
```

若系統同時有 `iptables-nft` 與 `iptables-legacy`，請確認主管測試看的規則與 Firewall-Man 操作的是同一個 backend。

確認目前監聽的不是舊 process：

```bash
sudo ss -ltnp 'sport = :10002'
sudo readlink -f /proc/<PID>/exe
```

## 10. 安全提醒

以下按鈕會直接影響主機防火牆：

- 清空所有表規則
- 清空當前表規則
- 匯入規則
- 執行命令

正式操作前建議先匯出目前規則，保留可回復版本：

```bash
sudo iptables-save > /tmp/iptables-backup.rules
sudo ip6tables-save > /tmp/ip6tables-backup.rules
```

