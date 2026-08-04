# Kyklos Ubuntu Desktop 24.04 離線部署說明

本文適用於廠區主機為 **Ubuntu Desktop 24.04 amd64**，且廠區主機不能連外網路的情境。

## 重要原則

- Ubuntu 24.04 主機只能安裝由 Ubuntu 24.04 amd64 產生的 `offline-debs`。
- 不可把 Ubuntu 22.04 的 `.deb` 離線包拿到 Ubuntu 24.04 安裝。
- 不可使用舊式 `dpkg -i offline-debs/*.deb` 盲裝方式。
- 新版 `install-offline-deps.sh` 會檢查 `offline-debs/MANIFEST.env`，OS 版本或架構不同會拒絕安裝。
- 安裝時會略過 Essential/required 系統核心套件，並拒絕降級，避免破壞 `/bin/bash`、`libc6`、`dpkg` 等 OS 元件。

## 目前已產生的安全程式包

目前在此專案目錄已產生：

```bash
pack-kyklos-20260804080011.tgz
```

這份是安全的程式本體包：

- 不包含 `offline-debs/`
- 不包含 Ubuntu 22.04 的 `libc.so.6`
- 不包含 Ubuntu 22.04 的 `ld-linux`
- 可先拿到 Ubuntu 24.04 主機測試程式啟動

若目標主機已經具備 `iptables`、`ssh`、`curl`、`openssl` 等基本命令，通常可直接：

```bash
tar xzf pack-kyklos-20260804080011.tgz
cd bin
sudo ./start.sh
```

## 產生真正 Ubuntu 24.04 離線依賴包

請在一台 **可連外網路的 Ubuntu 24.04 amd64 主機或 VM** 上執行。

先確認版本：

```bash
cat /etc/os-release
dpkg --print-architecture
```

需看到：

```text
VERSION_ID="24.04"
amd64
```

再於 Kyklos 專案根目錄執行：

```bash
./pack_app.sh -m -a -d -U 24.04
```

如果不是 Ubuntu 24.04，腳本會拒絕產生 24.04 離線套件。

產生後確認壓縮包內有 manifest：

```bash
tar tzf pack-kyklos-*.tgz | grep offline-debs/MANIFEST.env
```

解開後可檢查：

```bash
cat bin/offline-debs/MANIFEST.env
```

應看到類似：

```bash
OFFLINE_OS_ID="ubuntu"
OFFLINE_VERSION_ID="24.04"
OFFLINE_VERSION_CODENAME="noble"
OFFLINE_ARCH="amd64"
```

## 廠區 Ubuntu 24.04 無網路安裝

將 24.04 產生的壓縮包複製到廠區主機後：

```bash
tar xzf pack-kyklos-*.tgz
cd bin
sudo ./install-offline-deps.sh
sudo ./start.sh
```

`install-offline-deps.sh` 使用：

```bash
apt-get install --no-download
```

因此不會嘗試從網路下載套件。

若版本不符，會顯示離線包版本與本機版本，並拒絕安裝。

## HTTPS 啟動

若要使用 HTTPS：

```bash
sudo mkdir -p /etc/kyklos/tls
sudo openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout /etc/kyklos/tls/kyklos.key \
  -out /etc/kyklos/tls/kyklos.crt \
  -days 365 \
  -subj "/CN=<主機IP>"
```

編輯 `bin/.env`：

```bash
KYKLOS_TLS_CERT=/etc/kyklos/tls/kyklos.crt
KYKLOS_TLS_KEY=/etc/kyklos/tls/kyklos.key
```

啟動：

```bash
cd bin
sudo ./start.sh
```

瀏覽器開啟：

```text
https://<主機IP>:10002
```

## 不可再使用的舊包

以下舊包包含 Ubuntu 22.04 離線 `.deb`，不可再拿到 Ubuntu 24.04 安裝：

```bash
pack-kyklos-20260803013111-DO_NOT_USE-ubuntu22-offline-debs.tgz
```

