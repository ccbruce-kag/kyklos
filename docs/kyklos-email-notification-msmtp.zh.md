# Kyklos 告警通知寄信設定

Kyklos 的告警通知寄信是透過系統的 `sendmail` 相容命令送出。若主機安裝的是 `msmtp-mta`，`/usr/sbin/sendmail` 只是 `msmtp` 的相容入口，仍需要設定 SMTP 帳號或公司內部 SMTP Relay。

## 目前錯誤原因

若日誌出現：

```text
sendmail: account default not found: no configuration file available
```

代表程式已找到 `/usr/sbin/sendmail`，但主機尚未設定 `msmtp` 的預設 SMTP 帳號。畫面中的 E-mail 欄位是「收件者」，不是 SMTP 登入帳密設定。

## 使用 Gmail SMTP 範例

Gmail 需啟用兩步驟驗證，並建立 App Password。不可使用一般登入密碼。

建立 `/etc/msmtprc`：

```conf
defaults
auth on
tls on
tls_starttls on
tls_trust_file /etc/ssl/certs/ca-certificates.crt
logfile /var/log/msmtp.log

account default
host smtp.gmail.com
port 587
from your-account@gmail.com
user your-account@gmail.com
password YOUR_GOOGLE_APP_PASSWORD
```

設定權限：

```bash
sudo chmod 600 /etc/msmtprc
sudo touch /var/log/msmtp.log
sudo chown root:adm /var/log/msmtp.log
sudo chmod 664 /var/log/msmtp.log
```

測試寄信：

```bash
printf 'Subject: Kyklos test\n\nKyklos mail test\n' | sendmail your-recipient@example.com
```

## 使用公司 SMTP Relay 範例

若公司提供內部 SMTP Relay，可改成：

```conf
defaults
auth off
tls off
logfile /var/log/msmtp.log

account default
host 10.20.100.10
port 25
from kyklos@your-domain.local
```

若 Relay 需要帳密，請將 `auth on`、`user`、`password` 補上，並依公司 SMTP 要求設定 `tls`。

## Kyklos 環境變數

啟動 Kyklos 時可指定：

```bash
KYKLOS_SENDMAIL_PATH=/usr/sbin/sendmail
KYKLOS_MAIL_FROM=kyklos@your-domain.local
```

若未設定 `KYKLOS_SENDMAIL_PATH`，程式會嘗試尋找 `/usr/sbin/sendmail` 或 PATH 中的 `sendmail`。
