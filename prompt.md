## 2026/06/09

請協助我在目前 firewall-man 專案中新增「HAProxy 管理」功能。

目前專案已有：
1. iptables 防火牆管理頁
2. Juniper 設定頁
3. 左側選單
4. Web UI 可正常執行在 10.20.100.241:10002

這次需求：
希望不要只使用底層 iptables，需新增 HAProxy 管理功能，並分成 Web 與 SQL Server 兩種類型。

請新增左側選單：

HAProxy 管理

並在其中至少包含三個分頁：

1. HAProxy 狀態
2. Web 負載平衡
3. SQL Server 負載平衡

一、HAProxy 狀態頁

功能：
- 顯示 HAProxy 是否已安裝
- 顯示 HAProxy service 狀態
- 顯示 HAProxy 設定檔路徑
- 提供重新載入 HAProxy 按鈕
- 提供重啟 HAProxy 按鈕

可使用指令：
systemctl status haproxy
systemctl reload haproxy
systemctl restart haproxy
haproxy -c -f /etc/haproxy/haproxy.cfg

二、Web 負載平衡頁

功能：
- 新增 Web frontend
- 設定對外 listen port，例如 80、8080、443
- 新增 backend web server
- 支援多台 Web Server
- 支援 balance 策略：
  - roundrobin
  - leastconn
  - source
- 支援 health check

產生 HAProxy 設定範例：

frontend web_frontend
    bind *:8080
    mode http
    default_backend web_backend

backend web_backend
    mode http
    balance roundrobin
    option httpchk GET /
    server web1 10.20.50.101:80 check
    server web2 10.20.50.102:80 check

三、SQL Server 負載平衡頁

功能：
- 新增 SQL frontend
- 預設對外 port 可為 1433
- 新增 backend SQL Server
- SQL Server 使用 TCP mode
- balance 預設建議使用 source 或 leastconn
- 支援 health check

產生 HAProxy 設定範例：

frontend sql_frontend
    bind *:1433
    mode tcp
    default_backend sql_backend

backend sql_backend
    mode tcp
    balance source
    option tcp-check
    server sql1 10.20.50.201:1433 check
    server sql2 10.20.50.202:1433 check

四、後端 API 建議

請新增 API：

GET    /api/haproxy/status
POST   /api/haproxy/reload
POST   /api/haproxy/restart
GET    /api/haproxy/config
POST   /api/haproxy/config/validate
POST   /api/haproxy/web
POST   /api/haproxy/sql

五、功能要求

1. 不要直接覆蓋 /etc/haproxy/haproxy.cfg，請先產生預覽。
2. 使用者確認後才寫入設定檔。
3. 寫入前先備份原本設定：
   /etc/haproxy/haproxy.cfg.bak-YYYYMMDDHHmmss
4. 寫入後先執行：
   haproxy -c -f /etc/haproxy/haproxy.cfg
5. 驗證成功才 reload HAProxy。
6. 驗證失敗要顯示錯誤訊息，不可 reload。
7. 所有 shell command 執行都要有錯誤處理。
8. UI 風格請沿用目前 Firewall-Man 既有設計。

六、資料結構建議

Web Load Balance：
- name
- bind_port
- mode = http
- balance_method
- backend_servers:
  - name
  - ip
  - port
  - health_check_path

SQL Load Balance：
- name
- bind_port
- mode = tcp
- balance_method
- backend_servers:
  - name
  - ip
  - port

七、請先做的事

請先掃描目前專案結構，找出：
- 前端頁面在哪裡
- API route 在哪裡
- shell command helper 在哪裡
- 左側選單在哪裡定義

八、重要補充

請將 HAProxy 管理頁面區分為：

1. Web Load Balance
2. SQL Server Load Balance

兩者使用不同預設設定。

提供的 SQL Server HAProxy 範例中包含 option httpchk，
請評估是否應改為 option tcp-check，
並將健康檢查方式設計為可設定。

--------------------------------------------------
Web Load Balance
--------------------------------------------------

預設產生：

defaults
    mode http

frontend
    bind *:80

backend
    balance roundrobin

後端 Server 欄位：

- Server Name
- IP Address
- Port
- Health Check

產生範例：

frontend my_front
    bind *:80
    default_backend my_back

backend my_back
    balance roundrobin
    server web1 192.168.1.10:80 check
    server web2 192.168.1.11:80 check

--------------------------------------------------
SQL Server Load Balance
--------------------------------------------------

預設產生：

defaults
    mode tcp

frontend
    bind *:1433

backend
    balance source

後端 Server 欄位：

- Server Name
- IP Address
- Port

產生範例：

frontend msql_front
    bind *:1433
    default_backend msql_back

backend msql_back
    mode tcp
    balance source
    server sql_node1 10.0.0.10:1433 check
    server sql_node2 10.0.0.11:1433 check

--------------------------------------------------
UI需求
--------------------------------------------------

Web Load Balance 頁面：

欄位：

- Frontend Name
- Listen Port
- Balance Method

Backend Table：

- Name
- IP
- Port
- Status

--------------------------------------------------

SQL Server Load Balance 頁面：

欄位：

- Frontend Name
- Listen Port
- Balance Method

Backend Table：

- Name
- IP
- Port
- Status

--------------------------------------------------
設定檔預覽
--------------------------------------------------

使用者按下產生設定後，

畫面需顯示完整 HAProxy Config Preview：

frontend ...
backend ...

讓使用者確認後再寫入。

--------------------------------------------------
未來擴充
--------------------------------------------------

請將 Web 與 SQL Load Balance 模組化設計，

未來可再增加：

- PostgreSQL
- MySQL
- Redis
- LDAP
- TCP Generic

等類型。

然後先提出修改計畫，再開始實作。
第一版先以「可產生設定檔、可預覽、可驗證、可 reload」為主，不需要先做資料庫永久儲存。