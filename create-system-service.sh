#!/usr/bin/env bash
#
# create-system-service.sh - 建立 kyklos systemd 系統服務
#
# 用法: sudo ./create-system-service.sh [選項]
#
# 選項:
#   -n <name>    服務名稱 (預設: kyklos)
#   -u <user>    執行用戶 (預設: root)
#   -r           移除服務
#   -h           顯示說明
#
set -euo pipefail

# ─── 預設值 ───────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVICE_NAME="kyklos"
RUN_USER="root"
REMOVE=false

# ─── 顏色 ─────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# ─── 說明 ─────────────────────────────────────────────────
usage() {
    cat <<'EOF'
用法: sudo ./create-system-service.sh [選項]

選項:
  -n <name>    服務名稱 (預設: kyklos)
  -u <user>    執行用戶 (預設: root)
  -r           移除服務
  -h           顯示說明

範例:
  sudo ./create-system-service.sh              # 建立服務
  sudo ./create-system-service.sh -n my-fw     # 自訂服務名稱
  sudo ./create-system-service.sh -r           # 移除服務
EOF
    exit 0
}

# ─── 參數解析 ─────────────────────────────────────────────
while getopts "n:urh" opt; do
    case $opt in
        n) SERVICE_NAME="$OPTARG" ;;
        u) RUN_USER="$OPTARG" ;;
        r) REMOVE=true ;;
        h) usage ;;
        *) usage ;;
    esac
done

# ─── 權限檢查 ─────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
    error "請使用 sudo 執行此腳本"
    exit 1
fi

# ─── 檢查 systemd ─────────────────────────────────────────
if ! command -v systemctl &>/dev/null; then
    error "此系統未使用 systemd，無法建立系統服務"
    exit 1
fi

SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

# ─── 移除服務 ─────────────────────────────────────────────
if [[ "$REMOVE" == true ]]; then
    if [[ -f "$SERVICE_FILE" ]]; then
        info "停止服務..."
        systemctl stop "$SERVICE_NAME" 2>/dev/null || true
        info "停用服務..."
        systemctl disable "$SERVICE_NAME" 2>/dev/null || true
        rm -f "$SERVICE_FILE"
        systemctl daemon-reload
        info "已移除服務: ${SERVICE_NAME}"
    else
        warn "服務不存在: ${SERVICE_FILE}"
    fi
    exit 0
fi

# ─── 建立服務 ─────────────────────────────────────────────
info "建立 systemd 服務..."
info "  服務名稱: ${SERVICE_NAME}"
info "  執行目錄: ${SCRIPT_DIR}"
info "  執行用戶: ${RUN_USER}"

cat > "$SERVICE_FILE" << SERVICEEOF
[Unit]
Description=kyklos - Firewall Web Manager
Documentation=https://github.com/miitai/kyklos
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=${SCRIPT_DIR}
ExecStart=${SCRIPT_DIR}/start.sh
Restart=on-failure
RestartSec=5
StartLimitBurst=5
StartLimitIntervalSec=60

# 環境設定
EnvironmentFile=-${SCRIPT_DIR}/.env

# 日誌 (journalctl -u ${SERVICE_NAME})
StandardOutput=journal
StandardError=journal
SyslogIdentifier=${SERVICE_NAME}

# 安全性設定
NoNewPrivileges=no
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=${SCRIPT_DIR}/data ${SCRIPT_DIR}/logs
PrivateTmp=yes

# 資源限制
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
SERVICEEOF

# ─── 設定權限 ─────────────────────────────────────────────
chmod 644 "$SERVICE_FILE"

# 確保 data/logs 目錄存在且可寫
mkdir -p "${SCRIPT_DIR}/data" "${SCRIPT_DIR}/logs"
chmod 755 "${SCRIPT_DIR}/data" "${SCRIPT_DIR}/logs"

# ─── 啟用服務 ─────────────────────────────────────────────
info "重新載入 systemd..."
systemctl daemon-reload

info "啟用服務 (開機自動啟動)..."
systemctl enable "$SERVICE_NAME"

echo ""
echo -e "${CYAN}=========================================${NC}"
echo -e "${GREEN}  系統服務建立完成!${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""
echo -e "  服務檔: ${SERVICE_FILE}"
echo ""
echo -e "  ${CYAN}操作命令:${NC}"
echo -e "    啟動:  systemctl start ${SERVICE_NAME}"
echo -e "    停止:  systemctl stop ${SERVICE_NAME}"
echo -e "    重啟:  systemctl restart ${SERVICE_NAME}"
echo -e "    狀態:  systemctl status ${SERVICE_NAME}"
echo -e "    日誌:  journalctl -u ${SERVICE_NAME} -f"
echo -e "    移除:  sudo $0 -r"
echo ""
