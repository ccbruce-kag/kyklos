#!/usr/bin/env bash
#
# pack_app.sh - 將 kyklos 打包為可攜式應用目錄
#
# 用法:
#   ./pack_app.sh [選項]
#
# 選項:
#   -o <dir>    輸出目錄 (預設: ./bin)
#   -b          從原始碼建置 (安裝依賴 + 前端 build + 後端 build)
#   -m          最小化打包 (strip 二進位 + 跳過 web/logs)
#   -a          同時打包共用函式庫 (打造免安裝環境)
#   -c          清除舊的 bin 目錄後重新打包
#   -d          同時下載 Debian/Ubuntu 離線運行時 .deb 套件
#   -U <ver>    鎖定 Ubuntu 離線套件版本，例如 24.04；需在相同版本主機執行
#   -h          顯示說明
#
set -euo pipefail

# ─── 預設值 ───────────────────────────────────────────────
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
BIN_NAME="kyklos"
OUTPUT_DIR="${PROJECT_ROOT}/bin"
BUNDLE_LIBS=false
CLEAN_FIRST=false
DO_BUILD=false
MINIMAL=false
OFFLINE_DEBS=false
OFFLINE_TARGET_VERSION=""
VERSION="$(date +%Y%m%d%H%M%S)"
ARCH="$(uname -m)"
APT_RUNTIME_PACKAGES=(
    iptables
    openssh-client
    sshpass
    ca-certificates
    msmtp-mta
    curl
    openssl
)

is_essential_or_required_package() {
    local pkg="$1"
    apt-cache show "$pkg" 2>/dev/null \
        | awk -F': ' '
            $1 == "Essential" && $2 == "yes" { found = 1 }
            $1 == "Priority" && $2 == "required" { found = 1 }
            END { exit found ? 0 : 1 }
        '
}

is_core_runtime_lib() {
    local name
    name="$(basename "$1")"
    case "$name" in
        ld-linux*|libc.so*|libm.so*|libpthread.so*|librt.so*|libdl.so*|libresolv.so*|libnsl.so*|libutil.so*)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

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
用法: ./pack_app.sh [選項]

選項:
  -o <dir>    輸出目錄 (預設: ./bin)
  -b          從原始碼建置 (安裝依賴 + 前端 build + 後端 build)
  -m          最小化打包 (strip 二進位 + 跳過 web/logs)
  -a          同時打包共用函式庫 (打造免安裝環境)
  -c          清除舊的 bin 目錄後重新打包
  -d          同時下載 Debian/Ubuntu 離線運行時 .deb 套件
  -U <ver>    鎖定 Ubuntu 離線套件版本，例如 24.04；需在相同版本主機執行
  -h          顯示說明

範例:
  ./pack_app.sh                    # 基本打包 → bin/ + pack-kyklos-*.tgz
  ./pack_app.sh -b                 # 從原始碼建置 + 打包
  ./pack_app.sh -b -m -a           # 建置 + 最小化 + 函式庫
  ./pack_app.sh -m                 # 最小化打包
  ./pack_app.sh -m -a -d           # 離線部署包：程式 + 函式庫 + 目前主機版本 .deb 依賴
  ./pack_app.sh -m -a -d -U 24.04  # Ubuntu 24.04 離線部署包；必須在 Ubuntu 24.04 執行
  ./pack_app.sh -o /tmp/kyklos -a  # 自訂輸出 + 函式庫
EOF
    exit 0
}

# ─── 發行版偵測 ───────────────────────────────────────────
DISTRO_FAMILY=""
DISTRO_ID=""

detect_distro() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        DISTRO_ID="${ID:-unknown}"
    else
        DISTRO_ID="unknown"
    fi

    case "$DISTRO_ID" in
        ubuntu|debian|linuxmint|pop|elementary|zorin|kali|raspbian)
            DISTRO_FAMILY="apt"
            ;;
        fedora)
            DISTRO_FAMILY="dnf"
            ;;
        rhel|centos|rocky|alma|ol|amzn)
            DISTRO_FAMILY="yum"
            ;;
        alpine)
            DISTRO_FAMILY="apk"
            ;;
        *)
            # 嘗試用命令偵測
            if command -v apt-get &>/dev/null; then
                DISTRO_FAMILY="apt"
            elif command -v dnf &>/dev/null; then
                DISTRO_FAMILY="dnf"
            elif command -v yum &>/dev/null; then
                DISTRO_FAMILY="yum"
            elif command -v apk &>/dev/null; then
                DISTRO_FAMILY="apk"
            else
                error "無法偵測發行版 (ID: ${DISTRO_ID})，請手動安裝依賴"
                exit 1
            fi
            ;;
    esac
    info "偵測發行版: ${DISTRO_ID} (${DISTRO_FAMILY})"
}

# ─── 安裝建置依賴 ─────────────────────────────────────────
install_build_deps() {
    info "安裝建置依賴..."

    case "$DISTRO_FAMILY" in
        apt)
            sudo apt-get update -qq
            sudo apt-get install -y --no-install-recommends \
                build-essential \
                git \
                file \
                nodejs \
                npm \
                pkg-config \
                libpcap-dev \
                libssl-dev \
                zlib1g-dev \
                libdbus-1-dev \
                libsystemd-dev \
                liblzma-dev \
                libzstd-dev \
                liblz4-dev \
                libcap-dev \
                libgcrypt20-dev \
                clang \
                libclang-dev
            ;;
        dnf)
            sudo dnf install -y \
                gcc \
                make \
                git \
                file \
                nodejs \
                npm \
                pkgconf \
                libpcap-devel \
                openssl-devel \
                zlib-devel \
                dbus-devel \
                systemd-devel \
                xz-devel \
                libzstd-devel \
                lz4-devel \
                libcap-devel \
                libgcrypt-devel \
                clang \
                llvm-devel
            ;;
        yum)
            sudo yum install -y \
                gcc \
                make \
                git \
                file \
                nodejs \
                npm \
                pkgconf \
                libpcap-devel \
                openssl-devel \
                zlib-devel \
                dbus-devel \
                systemd-devel \
                xz-devel \
                libzstd-devel \
                lz4-devel \
                libcap-devel \
                libgcrypt-devel \
                clang \
                llvm-devel
            ;;
        apk)
            apk add --no-cache \
                build-base \
                git \
                file \
                nodejs \
                npm \
                pkgconf \
                libpcap-dev \
                openssl-dev \
                zlib-dev \
                dbus-dev \
                liblzma-dev \
                zstd-dev \
                lz4-dev \
                libcap-dev \
                libgcrypt-dev \
                clang-dev \
                llvm-dev \
                linux-headers
            warn "Alpine 不提供 libsystemd-dev，systemd 功能可能受限"
            ;;
    esac
    info "建置依賴安裝完成"
}

# ─── 安裝運行時依賴 ───────────────────────────────────────
install_runtime_deps() {
    info "安裝運行時依賴..."

    case "$DISTRO_FAMILY" in
        apt)
            sudo apt-get install -y --no-install-recommends \
                iptables \
                openssh-client \
                sshpass \
                ca-certificates \
                curl \
                openssl
            ;;
        dnf)
            sudo dnf install -y \
                iptables \
                openssh-clients \
                sshpass \
                ca-certificates
            ;;
        yum)
            sudo yum install -y \
                iptables \
                openssh-clients \
                sshpass \
                ca-certificates
            ;;
        apk)
            apk add --no-cache \
                iptables \
                openssh-client \
                sshpass \
                ca-certificates
            ;;
    esac

    info "安裝 E-mail 通知寄信工具..."
    case "$DISTRO_FAMILY" in
        apt)
            sudo apt-get install -y --no-install-recommends msmtp-mta || warn "msmtp-mta 安裝失敗，E-mail 通知需另行安裝 sendmail/msmtp"
            ;;
        dnf)
            sudo dnf install -y msmtp || warn "msmtp 安裝失敗，E-mail 通知需另行安裝 sendmail/msmtp"
            ;;
        yum)
            sudo yum install -y msmtp || warn "msmtp 安裝失敗，E-mail 通知需另行安裝 sendmail/msmtp"
            ;;
        apk)
            apk add --no-cache msmtp || warn "msmtp 安裝失敗，E-mail 通知需另行安裝 sendmail/msmtp"
            ;;
    esac
    info "運行時依賴安裝完成"
}

# ─── 建置前端 ─────────────────────────────────────────────
build_frontend() {
    info "建置前端..."
    local frontend_dir="${PROJECT_ROOT}/frontend"

    if [[ ! -d "$frontend_dir" ]]; then
        warn "找不到 frontend/ 目錄，跳過前端建置"
        return 0
    fi

    cd "$frontend_dir"

    # 檢查 node/npm
    if ! command -v node &>/dev/null; then
        error "找不到 node.js，請先安裝 Node.js"
        exit 1
    fi
    if ! command -v npm &>/dev/null; then
        error "找不到 npm，請先安裝 npm"
        exit 1
    fi

    info "  node: $(node --version), npm: $(npm --version)"

    local node20_bin="${KYKLOS_NODE20:-}"
    if [[ -z "$node20_bin" ]] || ! "$node20_bin" -e 'const v=process.versions.node.split(".").map(Number); process.exit(v[0] > 20 || (v[0] === 20 && (v[1] > 19 || (v[1] === 19 && v[2] >= 0))) ? 0 : 1)' >/dev/null 2>&1; then
        if node -e 'const v=process.versions.node.split(".").map(Number); process.exit(v[0] > 20 || (v[0] === 20 && (v[1] > 19 || (v[1] === 19 && v[2] >= 0))) ? 0 : 1)' >/dev/null 2>&1; then
            node20_bin="$(command -v node)"
        else
            warn "  目前 node 版本不足，Vite 需要 Node.js 20.19.0+"
            info "  使用 npm 下載臨時 Node.js 20.19.0 給前端建置使用..."
            node20_bin="$(npm exec --yes --package=node@20.19.0 -- node -p 'process.execPath')" || {
                error "無法取得 Node.js 20.19.0。請先安裝 Node 20，或設定 KYKLOS_NODE20=/path/to/node20"
                exit 1
            }
        fi
    fi
    export KYKLOS_NODE20="$node20_bin"
    info "  frontend build node: $("$KYKLOS_NODE20" --version) (${KYKLOS_NODE20})"

    if [[ -d "node_modules/rolldown" \
        && "$(uname -s)" == "Linux" \
        && "$(uname -m)" == "x86_64" \
        && ! -d "node_modules/@rolldown/binding-linux-x64-gnu" ]]; then
        warn "  偵測到 rolldown native binding 缺失，重建 node_modules..."
        rm -rf node_modules
    fi

    if [[ ! -d "node_modules" ]]; then
        if [[ -f "package-lock.json" ]]; then
            info "  npm ci --include=optional..."
            npm ci --include=optional
        else
            info "  npm install --include=optional..."
            npm install --include=optional
        fi
    else
        info "  node_modules 已存在，略過 npm install"
    fi

    if [[ "$(uname -s)" == "Linux" \
        && "$(uname -m)" == "x86_64" \
        && -d "node_modules/rolldown" \
        && ! -d "node_modules/@rolldown/binding-linux-x64-gnu" ]]; then
        warn "  rolldown Linux x64 native binding 仍缺失，明確安裝 binding 套件..."
        binding_version="$(node -e "const p=require('./package-lock.json'); console.log(p.packages?.['node_modules/rolldown']?.optionalDependencies?.['@rolldown/binding-linux-x64-gnu'] || '')" 2>/dev/null || true)"
        if [[ -z "$binding_version" ]]; then
            binding_version="1.0.3"
        fi
        npm install --no-save --include=optional "@rolldown/binding-linux-x64-gnu@${binding_version}"
    fi

    # 清除舊的 dist cache
    if [[ -d "dist" ]]; then
        info "  清除 dist/ cache..."
        rm -rf dist
    fi

    info "  npm run build..."
    npm run build

    # 複製 dist 到 run/web（供 rust-embed 嵌入）
    rm -rf "${PROJECT_ROOT}/run/web"
    mkdir -p "${PROJECT_ROOT}/run/web"
    cp -R dist/. "${PROJECT_ROOT}/run/web/"

    info "前端建置完成 → run/web/"
}

# ─── 建置後端 ─────────────────────────────────────────────
build_backend() {
    info "建置後端 (cargo build --release)..."
    local backend_dir="${PROJECT_ROOT}/backend"

    if [[ ! -d "$backend_dir" ]]; then
        error "找不到 backend/ 目錄"
        exit 1
    fi

    # 檢查 cargo
    if ! command -v cargo &>/dev/null; then
        error "找不到 cargo，請先安裝 Rust (https://rustup.rs)"
        exit 1
    fi

    info "  cargo: $(cargo --version)"

    cd "$backend_dir"
    cargo build --release

    local built_bin="${backend_dir}/target/release/${BIN_NAME}"
    if [[ ! -x "$built_bin" ]]; then
        error "建置失敗: 找不到 ${built_bin}"
        exit 1
    fi

    info "後端建置完成: $(du -h "$built_bin" | cut -f1)"
}

# ─── strip 二進位 ─────────────────────────────────────────
strip_binary() {
    local bin="$1"
    if [[ ! -f "$bin" ]]; then
        warn "找不到執行檔: ${bin}"
        return 0
    fi

    if ! command -v strip &>/dev/null; then
        warn "找不到 strip 命令，跳過 strip"
        return 0
    fi

    local before
    before=$(stat -c%s "$bin" 2>/dev/null || stat -f%z "$bin" 2>/dev/null || echo 0)

    info "strip 除錯符號: ${bin}"
    strip --strip-all "$bin" 2>/dev/null || strip "$bin" 2>/dev/null || {
        warn "strip 失敗，保留原始執行檔"
        return 0
    }

    local after
    after=$(stat -c%s "$bin" 2>/dev/null || stat -f%z "$bin" 2>/dev/null || echo 0)
    local saved_bytes=$(( before - after ))
    local saved_mb=$(( saved_bytes / 1024 / 1024 ))
    info "  大小: $(( before / 1024 / 1024 )) MB → $(( after / 1024 / 1024 )) MB (釋出 ${saved_mb} MB)"
}

download_offline_debs() {
    if ! command -v apt-cache &>/dev/null || ! command -v apt-get &>/dev/null; then
        error "-d 目前只支援 Debian/Ubuntu apt 環境"
        exit 1
    fi

    local deb_dir="${OUTPUT_DIR}/offline-debs"
    mkdir -p "$deb_dir"
    info "下載 Debian/Ubuntu 離線運行時套件至: ${deb_dir}"
    info "套件: ${APT_RUNTIME_PACKAGES[*]}"

    local os_id os_version os_codename deb_arch
    os_id="unknown"
    os_version="unknown"
    os_codename="unknown"
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        os_id="${ID:-unknown}"
        os_version="${VERSION_ID:-unknown}"
        os_codename="${VERSION_CODENAME:-${UBUNTU_CODENAME:-unknown}}"
    fi
    deb_arch="$(dpkg --print-architecture)"

    if [[ -n "$OFFLINE_TARGET_VERSION" ]]; then
        if [[ "$os_id" != "ubuntu" || "$os_version" != "$OFFLINE_TARGET_VERSION" ]]; then
            error "不能在 ${os_id} ${os_version} 產生 Ubuntu ${OFFLINE_TARGET_VERSION} 離線套件。"
            echo "請改到 Ubuntu ${OFFLINE_TARGET_VERSION} amd64 可連外主機/VM 上執行："
            echo "  ./pack_app.sh -m -a -d -U ${OFFLINE_TARGET_VERSION}"
            echo "這是為了避免把不同 Ubuntu 版本的 .deb 帶到廠區主機造成降級。"
            exit 1
        fi
    fi

    cat > "${deb_dir}/MANIFEST.env" << EOF
OFFLINE_OS_ID="${os_id}"
OFFLINE_VERSION_ID="${os_version}"
OFFLINE_VERSION_CODENAME="${os_codename}"
OFFLINE_ARCH="${deb_arch}"
OFFLINE_TARGET_VERSION="${OFFLINE_TARGET_VERSION}"
OFFLINE_CREATED_AT="${VERSION}"
EOF

    (
        cd "$deb_dir"
        local package_list
        package_list=$(
            apt-cache depends --recurse \
                --no-recommends --no-suggests --no-conflicts \
                --no-breaks --no-replaces --no-enhances \
                "${APT_RUNTIME_PACKAGES[@]}" \
                | awk '/^[A-Za-z0-9]/ { print $1 }' \
                | sed 's/<//; s/>//' \
                | sort -u
        )

        if [[ -z "$package_list" ]]; then
            error "無法解析 apt 套件依賴"
            exit 1
        fi

        while IFS= read -r pkg; do
            [[ -z "$pkg" ]] && continue
            if is_essential_or_required_package "$pkg"; then
                warn "略過系統核心套件，避免離線安裝時降級破壞系統: ${pkg}"
                continue
            fi
            apt-get download "$pkg" >/dev/null 2>&1 || warn "下載套件失敗或為虛擬套件，略過: ${pkg}"
        done <<< "$package_list"
    )

    local count
    count=$(find "$deb_dir" -maxdepth 1 -type f -name '*.deb' | wc -l | tr -d ' ')
    if [[ "$count" == "0" ]]; then
        error "沒有成功下載任何 .deb 套件"
        exit 1
    fi
    info "已下載 ${count} 個 .deb 套件 ($(du -sh "$deb_dir" | cut -f1))"
}

# ─── 參數解析 ─────────────────────────────────────────────
while getopts "o:bmacdU:h" opt; do
    case $opt in
        o) OUTPUT_DIR="$OPTARG" ;;
        b) DO_BUILD=true ;;
        m) MINIMAL=true ;;
        a) BUNDLE_LIBS=true ;;
        c) CLEAN_FIRST=true ;;
        d) OFFLINE_DEBS=true ;;
        U) OFFLINE_TARGET_VERSION="$OPTARG" ;;
        h) usage ;;
        *) usage ;;
    esac
done

# ─── 如果啟用 -b，先執行建置流程 ─────────────────────────
if [[ "$DO_BUILD" == true ]]; then
    info "========================================="
    info "  階段一: 從原始碼建置"
    info "========================================="

    detect_distro
    install_build_deps
    install_runtime_deps
    build_frontend
    build_backend

    info "========================================="
    info "  建置完成，開始打包"
    info "========================================="
fi

# ─── 前置檢查 ─────────────────────────────────────────────
check_binary() {
    local candidates=(
        "${PROJECT_ROOT}/backend/target/release/${BIN_NAME}"
        "${PROJECT_ROOT}/${BIN_NAME}"
    )
    for bin in "${candidates[@]}"; do
        if [[ -x "$bin" ]]; then
            echo "$bin"
            return 0
        fi
    done
    return 1
}

info "專案根目錄: ${PROJECT_ROOT}"
info "輸出目錄:   ${OUTPUT_DIR}"

# 確認執行檔存在
BINARY_PATH="$(check_binary)" || {
    error "找不到執行檔 ${BIN_NAME}，請先執行 ./pack_app.sh -b 或 make release"
    exit 1
}
info "執行檔來源: ${BINARY_PATH}"
info "執行檔大小: $(du -h "$BINARY_PATH" | cut -f1)"

# ─── 清除舊目錄 ───────────────────────────────────────────
if [[ "$CLEAN_FIRST" == true ]] && [[ -d "$OUTPUT_DIR" ]]; then
    warn "清除舊的輸出目錄: ${OUTPUT_DIR}"
    rm -rf "$OUTPUT_DIR"
fi

# ─── 建立目錄結構 ─────────────────────────────────────────
info "建立目錄結構..."
mkdir -p "${OUTPUT_DIR}"
mkdir -p "${OUTPUT_DIR}/data"
mkdir -p "${OUTPUT_DIR}/config"
if [[ "$MINIMAL" == false ]]; then
    mkdir -p "${OUTPUT_DIR}/logs"
fi
if [[ "$BUNDLE_LIBS" == true ]]; then
    mkdir -p "${OUTPUT_DIR}/libs"
fi
if [[ "$OFFLINE_DEBS" == true ]]; then
    mkdir -p "${OUTPUT_DIR}/offline-debs"
fi

# ─── 複製執行檔 ───────────────────────────────────────────
info "複製執行檔..."
cp "$BINARY_PATH" "${OUTPUT_DIR}/${BIN_NAME}"
chmod +x "${OUTPUT_DIR}/${BIN_NAME}"

# ─── strip 二進位 (最小化模式) ───────────────────────────
if [[ "$MINIMAL" == true ]]; then
    strip_binary "${OUTPUT_DIR}/${BIN_NAME}"
fi

# ─── 複製資料庫 ───────────────────────────────────────────
DB_CANDIDATES=(
    "${PROJECT_ROOT}/kyklos.sqlite3"
    "${PROJECT_ROOT}/firewall-man.sqlite3"
    "${PROJECT_ROOT}/oauth2.db"
)
DB_FOUND=false
for db in "${DB_CANDIDATES[@]}"; do
    if [[ -f "$db" ]]; then
        info "複製資料庫: $(basename "$db") ($(du -h "$db" | cut -f1))"
        cp "$db" "${OUTPUT_DIR}/data/"
        DB_FOUND=true
    fi
done
if [[ "$DB_FOUND" == false ]]; then
    warn "找不到現有資料庫，將在首次啟動時自動建立"
fi

# ─── 複製 web 資源 (非最小化模式才複製) ──────────────────
if [[ "$MINIMAL" == false ]] && [[ -d "${PROJECT_ROOT}/run/web" ]]; then
    info "複製 web 資源 (備用，執行檔已內嵌)..."
    mkdir -p "${OUTPUT_DIR}/web"
    cp -R "${PROJECT_ROOT}/run/web/." "${OUTPUT_DIR}/web/"
fi

# ─── 複製環境設定 ─────────────────────────────────────────
if [[ -f "${PROJECT_ROOT}/run/.env" ]]; then
    cp "${PROJECT_ROOT}/run/.env" "${OUTPUT_DIR}/.env"
    info "複製環境設定: .env → bin/"
fi

# ─── 複製系統服務腳本 ─────────────────────────────────────
if [[ -f "${PROJECT_ROOT}/create-system-service.sh" ]]; then
    cp "${PROJECT_ROOT}/create-system-service.sh" "${OUTPUT_DIR}/"
    chmod +x "${OUTPUT_DIR}/create-system-service.sh"
    info "複製系統服務腳本: create-system-service.sh → bin/"
fi

# ─── 打包共用函式庫 (可選) ────────────────────────────────
if [[ "$BUNDLE_LIBS" == true ]]; then
    info "收集共用函式庫..."

    # 從 ldd 提取動態連結的用戶端函式庫 (排除 linux-vdso 與 ld-linux)
    LIBS=$(ldd "$BINARY_PATH" 2>/dev/null \
        | grep -oP '(/[^\s]+)\s' \
        | awk '{print $1}' \
        | grep -v 'linux-vdso' \
        | grep -v 'ld-linux' || true)

    LIB_COUNT=0
    for lib in $LIBS; do
        if [[ -f "$lib" ]]; then
            # 保留符號連結結構
            lib_real=$(readlink -f "$lib")
            lib_name=$(basename "$lib_real")

            if is_core_runtime_lib "$lib_name"; then
                warn "略過 OS 核心函式庫，改用目標主機系統版本: ${lib_name}"
                continue
            fi

            # 複製實體檔案
            cp "$lib_real" "${OUTPUT_DIR}/libs/${lib_name}"

            # 如果是符號連結，也建立連結
            if [[ -L "$lib" ]]; then
                ln -sf "$lib_name" "${OUTPUT_DIR}/libs/$(basename "$lib")"
            fi

            LIB_COUNT=$((LIB_COUNT + 1))
        fi
    done
    info "已複製 ${LIB_COUNT} 個函式庫"

    info "OS 核心函式庫與動態連結器不打包，避免跨 Ubuntu 版本混用 libc/ld-linux"
fi

if [[ "$OFFLINE_DEBS" == true ]]; then
    download_offline_debs
fi

# ─── 建立啟動腳本 ─────────────────────────────────────────
info "建立啟動腳本..."

cat > "${OUTPUT_DIR}/start.sh" << 'START_SCRIPT'
#!/usr/bin/env bash
#
# kyklos 啟動腳本
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
BIN_NAME="kyklos"

# 預設參數 (可透過環境變數覆寫)
# 載入 .env (如果存在)
if [[ -f "${SCRIPT_DIR}/.env" ]]; then
    set -a
    source "${SCRIPT_DIR}/.env"
    set +a
fi

export IPT_WEB_USERNAME="${IPT_WEB_USERNAME:-admin}"
export IPT_WEB_PASSWORD="${IPT_WEB_PASSWORD:-admin}"
export IPT_WEB_ADDRESS="${IPT_WEB_ADDRESS:-:10002}"
export FWM_DB_PATH="${FWM_DB_PATH:-${SCRIPT_DIR}/data/kyklos.sqlite3}"
export KYKLOS_TLS_CERT="${KYKLOS_TLS_CERT:-}"
export KYKLOS_TLS_KEY="${KYKLOS_TLS_KEY:-}"

# E-mail 通知寄信工具。優先使用 sendmail 相容介面，否則退回 msmtp。
if [[ -z "${KYKLOS_SENDMAIL_PATH:-}" ]]; then
    if [[ -x /usr/sbin/sendmail ]]; then
        export KYKLOS_SENDMAIL_PATH="/usr/sbin/sendmail"
    elif command -v sendmail &>/dev/null; then
        export KYKLOS_SENDMAIL_PATH="$(command -v sendmail)"
    elif command -v msmtp &>/dev/null; then
        export KYKLOS_SENDMAIL_PATH="$(command -v msmtp)"
    fi
fi
export KYKLOS_MAIL_FROM="${KYKLOS_MAIL_FROM:-kyklos@localhost}"

# 如果 libs/ 目錄存在，設定 LD_LIBRARY_PATH
if [[ -d "${SCRIPT_DIR}/libs" ]]; then
    export LD_LIBRARY_PATH="${SCRIPT_DIR}/libs${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
fi

# 確認 iptables 可用
if command -v iptables &>/dev/null; then
    echo "[INFO] iptables: $(iptables --version 2>/dev/null || echo 'unknown')"
elif [[ "$(uname)" == "Darwin" ]]; then
    echo "[INFO] 平台: macOS (pfctl)"
else
    echo "[WARN] iptables 不可用，防火牆功能受限"
fi

if [[ -n "${KYKLOS_SENDMAIL_PATH:-}" ]]; then
    echo "[INFO] mailer: ${KYKLOS_SENDMAIL_PATH}"
else
    echo "[WARN] sendmail/msmtp 不可用，E-mail 通知無法寄出"
fi

echo "========================================="
echo "  kyklos - Firewall Web Manager"
echo "  Listen: ${IPT_WEB_ADDRESS}"
echo "  User:   ${IPT_WEB_USERNAME}"
echo "  DB:     ${FWM_DB_PATH}"
if [[ -n "${KYKLOS_TLS_CERT}" && -n "${KYKLOS_TLS_KEY}" ]]; then
    echo "  Scheme: HTTPS"
    echo "  TLS:    ${KYKLOS_TLS_CERT}"
else
    echo "  Scheme: HTTP"
fi
echo "========================================="

exec "./${BIN_NAME}" \
    -u "$IPT_WEB_USERNAME" \
    -p "$IPT_WEB_PASSWORD" \
    -a "$IPT_WEB_ADDRESS"
START_SCRIPT
chmod +x "${OUTPUT_DIR}/start.sh"

# ─── 建立 Windows 啟動腳本 ────────────────────────────────
cat > "${OUTPUT_DIR}/start.bat" << 'START_BAT'
@echo off
setlocal

set IPT_WEB_USERNAME=%IPT_WEB_USERNAME%
set IPT_WEB_PASSWORD=%IPT_WEB_PASSWORD%
set IPT_WEB_ADDRESS=%IPT_WEB_ADDRESS%
set FWM_DB_PATH=%FWM_DB_PATH%

if "%IPT_WEB_USERNAME%"=="" set IPT_WEB_USERNAME=admin
if "%IPT_WEB_PASSWORD%"=="" set IPT_WEB_PASSWORD=admin
if "%IPT_WEB_ADDRESS%"=="" set IPT_WEB_ADDRESS=:10002
if "%FWM_DB_PATH%"=="" set FWM_DB_PATH=%~dp0data\kyklos.sqlite3

echo =========================================
echo   kyklos - Firewall Web Manager
echo   Listen: %IPT_WEB_ADDRESS%
echo   User:   %IPT_WEB_USERNAME%
echo =========================================

"%~dp0kyklos.exe" -u "%IPT_WEB_USERNAME%" -p "%IPT_WEB_PASSWORD%" -a "%IPT_WEB_ADDRESS%"
pause
START_BAT

# ─── 建立環境變數範本 ─────────────────────────────────────
cat > "${OUTPUT_DIR}/config/env.template" << 'ENVEOF'
# kyklos 環境變數設定
# 複製此檔案為 .env 並修改

# 監聽位址 (預設 :10002)
# IPT_WEB_ADDRESS=:10002

# 管理帳號
# IPT_WEB_USERNAME=admin
# IPT_WEB_PASSWORD=admin

# 資料庫路徑 (預設: data/kyklos.sqlite3)
# FWM_DB_PATH=data/kyklos.sqlite3

# 管理介面 HTTPS/TLS
# 兩者都設定時，管理介面會改用 https://<host>:<port>
# 可使用正式憑證，或先用自簽憑證測試。
# KYKLOS_TLS_CERT=/etc/kyklos/tls/kyklos.crt
# KYKLOS_TLS_KEY=/etc/kyklos/tls/kyklos.key

# Memcache 設定
# MEMCACHE_PORT=11211
# MEMCACHE_CAPACITY=67108864

# OAuth2 設定
# OAUTH2_DATABASE_URL=sqlite:oauth2.db?mode=rwc
# OAUTH2_PORT=10003
# OAUTH2_ISSUER=http://localhost:10003

# Reverse Proxy
# REVERSE_PROXY_PORT=10080

# E-mail 通知寄信設定
# 建議先執行 ./install-runtime-deps.sh 安裝 msmtp-mta 或 sendmail 相容工具。
# Debian/Ubuntu 安裝 msmtp-mta 後通常會提供 /usr/sbin/sendmail。
# 若使用 msmtp，請另行設定 /etc/msmtprc 或 ~/.msmtprc 內的 SMTP 帳號。
# KYKLOS_SENDMAIL_PATH=/usr/sbin/sendmail
# KYKLOS_MAIL_FROM=kyklos@your-domain.com
ENVEOF

# ─── 建立運行時依賴安裝腳本 ───────────────────────────────
cat > "${OUTPUT_DIR}/install-runtime-deps.sh" << 'INSTALL_RUNTIME'
#!/usr/bin/env bash
#
# kyklos 運行時依賴安裝腳本
#
set -euo pipefail

info()  { echo "[INFO]  $*"; }
warn()  { echo "[WARN]  $*"; }
error() { echo "[ERROR] $*" >&2; }

DISTRO_FAMILY=""
if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    case "${ID:-unknown}" in
        ubuntu|debian|linuxmint|pop|elementary|zorin|kali|raspbian) DISTRO_FAMILY="apt" ;;
        fedora) DISTRO_FAMILY="dnf" ;;
        rhel|centos|rocky|alma|ol|amzn) DISTRO_FAMILY="yum" ;;
        alpine) DISTRO_FAMILY="apk" ;;
    esac
fi
if [[ -z "$DISTRO_FAMILY" ]]; then
    if command -v apt-get >/dev/null 2>&1; then DISTRO_FAMILY="apt"
    elif command -v dnf >/dev/null 2>&1; then DISTRO_FAMILY="dnf"
    elif command -v yum >/dev/null 2>&1; then DISTRO_FAMILY="yum"
    elif command -v apk >/dev/null 2>&1; then DISTRO_FAMILY="apk"
    else error "無法偵測套件管理工具，請手動安裝 iptables、openssh-client、sshpass、ca-certificates、sendmail/msmtp"; exit 1
    fi
fi

info "安裝 kyklos 運行時依賴 (${DISTRO_FAMILY})"
case "$DISTRO_FAMILY" in
    apt)
        sudo apt-get update
        sudo apt-get install -y --no-install-recommends iptables openssh-client sshpass ca-certificates msmtp-mta
        ;;
    dnf)
        sudo dnf install -y iptables openssh-clients sshpass ca-certificates msmtp || warn "msmtp 安裝失敗，請手動安裝 sendmail/msmtp"
        ;;
    yum)
        sudo yum install -y iptables openssh-clients sshpass ca-certificates msmtp || warn "msmtp 安裝失敗，請手動安裝 sendmail/msmtp"
        ;;
    apk)
        apk add --no-cache iptables openssh-client sshpass ca-certificates msmtp
        ;;
esac

if command -v sendmail >/dev/null 2>&1 || [[ -x /usr/sbin/sendmail ]] || command -v msmtp >/dev/null 2>&1; then
    info "寄信工具已可用。若使用 msmtp，請設定 /etc/msmtprc 或 ~/.msmtprc。"
else
    warn "尚未找到 sendmail/msmtp，E-mail 通知仍無法寄出。"
fi
INSTALL_RUNTIME
chmod +x "${OUTPUT_DIR}/install-runtime-deps.sh"

# ─── 建立離線依賴安裝腳本 ─────────────────────────────────
cat > "${OUTPUT_DIR}/install-offline-deps.sh" << 'INSTALL_OFFLINE_RUNTIME'
#!/usr/bin/env bash
#
# kyklos 離線運行時依賴安裝腳本
# 使用前需用 ./pack_app.sh -d 在可連外主機預先下載 offline-debs/*.deb
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEB_DIR="${SCRIPT_DIR}/offline-debs"
MANIFEST="${DEB_DIR}/MANIFEST.env"

info()  { echo "[INFO]  $*"; }
warn()  { echo "[WARN]  $*"; }
error() { echo "[ERROR] $*" >&2; }

if [[ ! -d "$DEB_DIR" ]]; then
    error "找不到 offline-debs 目錄。請先在可連外主機用 ./pack_app.sh -m -a -d 產生離線包。"
    exit 1
fi

if [[ ! -f "$MANIFEST" ]]; then
    error "找不到 offline-debs/MANIFEST.env，已拒絕安裝。"
    echo "此離線包可能是舊版危險包，不能確認 OS 版本，請重新打包。"
    exit 1
fi

# shellcheck disable=SC1090
source "$MANIFEST"
target_id="unknown"
target_version="unknown"
target_codename="unknown"
if [[ -f /etc/os-release ]]; then
    # shellcheck disable=SC1091
    . /etc/os-release
    target_id="${ID:-unknown}"
    target_version="${VERSION_ID:-unknown}"
    target_codename="${VERSION_CODENAME:-${UBUNTU_CODENAME:-unknown}}"
fi
target_arch="$(dpkg --print-architecture)"
info "離線包: ${OFFLINE_OS_ID:-unknown} ${OFFLINE_VERSION_ID:-unknown} ${OFFLINE_VERSION_CODENAME:-unknown} ${OFFLINE_ARCH:-unknown}"
info "本機:   ${target_id} ${target_version} ${target_codename} ${target_arch}"
if [[ "${OFFLINE_OS_ID:-unknown}" != "$target_id" \
    || "${OFFLINE_VERSION_ID:-unknown}" != "$target_version" \
    || "${OFFLINE_ARCH:-unknown}" != "$target_arch" ]]; then
    error "離線套件版本與本機不一致，已拒絕安裝以避免破壞系統。"
    echo "請在相同 Ubuntu 版本/架構的可連外主機重新執行 ./pack_app.sh -m -a -d。"
    exit 1
fi

shopt -s nullglob
debs=("${DEB_DIR}"/*.deb)
if [[ "${#debs[@]}" -eq 0 ]]; then
    error "offline-debs 內沒有 .deb 套件。"
    exit 1
fi

if ! command -v apt-get >/dev/null 2>&1; then
    error "找不到 apt-get。離線安裝只支援 Debian/Ubuntu，且不使用 dpkg 盲裝。"
    exit 1
fi

install_debs=()
for deb in "${debs[@]}"; do
    pkg="$(dpkg-deb -f "$deb" Package 2>/dev/null || true)"
    debver="$(dpkg-deb -f "$deb" Version 2>/dev/null || true)"
    essential="$(dpkg-deb -f "$deb" Essential 2>/dev/null || true)"
    priority="$(dpkg-deb -f "$deb" Priority 2>/dev/null || true)"
    [[ -z "$pkg" || -z "$debver" ]] && continue
    if [[ "$essential" == "yes" || "$priority" == "required" ]]; then
        warn "略過系統核心套件，避免破壞 OS: ${pkg}"
        continue
    fi
    instver="$(dpkg-query -W -f='${Version}' "$pkg" 2>/dev/null || true)"
    if [[ -n "$instver" ]] && dpkg --compare-versions "$debver" lt "$instver"; then
        warn "略過較舊套件，避免降級: ${pkg} ${debver} < 已安裝 ${instver}"
        continue
    fi
    install_debs+=("$deb")
done

if [[ "${#install_debs[@]}" -eq 0 ]]; then
    info "沒有需要安裝或更新的離線套件。"
    exit 0
fi

info "安裝 ${#install_debs[@]} 個本地 .deb 套件，不會連外、不允許降級。"
sudo apt-get install -s --no-download --no-install-recommends "${install_debs[@]}" >/dev/null
sudo apt-get install -y --no-download --no-install-recommends -o Dpkg::Options::=--refuse-downgrade "${install_debs[@]}"

info "離線依賴安裝完成。"
INSTALL_OFFLINE_RUNTIME
chmod +x "${OUTPUT_DIR}/install-offline-deps.sh"

# ─── 建立卸載腳本 ─────────────────────────────────────────
cat > "${OUTPUT_DIR}/uninstall.sh" << 'UNINSTALL'
#!/usr/bin/env bash
#
# kyklos 卸載腳本
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "將刪除以下目錄: ${SCRIPT_DIR}"
read -p "確定要刪除嗎? (y/N): " confirm
if [[ "$confirm" =~ ^[Yy]$ ]]; then
    rm -rf "$SCRIPT_DIR"
    echo "[INFO] 已刪除"
else
    echo "[INFO] 取消"
fi
UNINSTALL
chmod +x "${OUTPUT_DIR}/uninstall.sh"

# ─── 建立 README ──────────────────────────────────────────
cat > "${OUTPUT_DIR}/README.md" << 'READMEEOF'
# kyklos - Firewall Web Manager

## 快速開始

```bash
# Linux / macOS
./start.sh

# Windows
start.bat
```

預設帳號: `admin` / `admin`，監聽位址: `:10002`

瀏覽器開啟: http://localhost:10002

## 環境變數

| 變數 | 預設值 | 說明 |
|------|--------|------|
| `IPT_WEB_ADDRESS` | `:10002` | 監聽位址 |
| `IPT_WEB_USERNAME` | `admin` | 管理帳號 |
| `IPT_WEB_PASSWORD` | `admin` | 管理密碼 |
| `FWM_DB_PATH` | `data/kyklos.sqlite3` | 資料庫路徑 |
| `KYKLOS_TLS_CERT` | 空 | HTTPS 憑證 PEM 路徑 |
| `KYKLOS_TLS_KEY` | 空 | HTTPS 私鑰 PEM 路徑 |

## 啟用 HTTPS

```bash
sudo mkdir -p /etc/kyklos/tls
sudo openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout /etc/kyklos/tls/kyklos.key \
  -out /etc/kyklos/tls/kyklos.crt \
  -days 365 \
  -subj "/CN=kyklos"

cat >> .env <<'EOF'
KYKLOS_TLS_CERT=/etc/kyklos/tls/kyklos.crt
KYKLOS_TLS_KEY=/etc/kyklos/tls/kyklos.key
EOF

sudo ./start.sh
```

啟用後瀏覽器請開啟 `https://<host-ip>:10002`。自簽憑證第一次連線會出現瀏覽器警告，正式環境建議改用受信任 CA 簽發的憑證。

## 目錄結構

```
bin/
├── kyklos                      # 主程式 (已 strip)
├── .env                        # 環境變數設定
├── start.sh                    # 啟動腳本 (Linux/macOS)
├── start.bat                   # 啟動腳本 (Windows)
├── install-runtime-deps.sh      # 安裝運行時依賴與 E-mail 寄信工具
├── install-offline-deps.sh      # 離線安裝 offline-debs/*.deb
├── create-system-service.sh    # 建立 systemd 系統服務
├── uninstall.sh                # 卸載腳本
├── data/                       # 資料庫目錄
│   ├── kyklos.sqlite3
│   └── oauth2.db
├── config/                     # 設定檔
├── web/                        # 前端資源 (備用，已內嵌於執行檔)
├── libs/                       # 共用函式庫 (選用)
├── offline-debs/                # Debian/Ubuntu 離線依賴套件 (-d 時產生)
└── README.md                   # 本檔案
```

## 系統需求

### Linux (運行時)

| 發行版 | 安裝命令 |
|--------|----------|
| Debian/Ubuntu | `apt-get install -y iptables openssh-client sshpass ca-certificates msmtp-mta` |
| RHEL/CentOS/Fedora | `dnf install -y iptables openssh-clients sshpass ca-certificates msmtp` |
| Alpine | `apk add --no-cache iptables openssh-client sshpass ca-certificates msmtp` |

解壓後也可直接執行：

```bash
sudo ./install-runtime-deps.sh
```

### 離線廠區部署

如果目標主機不能連外，請在可連外且相同發行版/版本/架構的打包主機上產生離線包：

```bash
./pack_app.sh -m -a -d
```

若廠區目標是 Ubuntu Desktop 24.04 amd64，請在 Ubuntu 24.04 amd64 可連外主機/VM 上產生：

```bash
./pack_app.sh -m -a -d -U 24.04
```

`-d` 會把 Debian/Ubuntu 運行時 `.deb` 套件下載到 `offline-debs/`，並一起放入壓縮包。廠區主機解壓後執行：

```bash
sudo ./install-offline-deps.sh
sudo ./start.sh
```

注意：

- 離線 `.deb` 包只能用在相同 OS 版本與 CPU 架構，例如 Ubuntu 24.04 amd64 → Ubuntu 24.04 amd64。
- `install-offline-deps.sh` 會讀取 `offline-debs/MANIFEST.env`，版本或架構不一致會直接拒絕安裝。
- 安裝時會略過 Essential/required 系統核心套件，並拒絕降級，避免破壞 `/bin/bash`、`libc6`、`dpkg` 等 OS 元件。
- 若廠區主機已經有 `iptables`、`ssh`、`curl`、`openssl` 等命令，也可以不執行依賴安裝腳本，直接 `sudo ./start.sh`。

### E-mail 通知

Kyklos 使用 `sendmail -t` 相容介面寄出告警通知。Debian/Ubuntu 建議安裝 `msmtp-mta`，並設定 `/etc/msmtprc` 或 `~/.msmtprc` 的 SMTP 帳號。

可在 `.env` 設定：

```bash
KYKLOS_SENDMAIL_PATH=/usr/sbin/sendmail
KYKLOS_MAIL_FROM=kyklos@your-domain.com
```

### macOS
- pfctl (內建)

### Windows
- PowerShell NetSecurity 模組 (內建)

## 命令列參數

```bash
./kyklos -u <帳號> -p <密碼> -a <位址>
```

## 系統服務 (Ubuntu/Debian)

建立 systemd 系統服務，開機自動啟動:

```bash
sudo ./create-system-service.sh

# 操作命令
sudo systemctl start kyklos
sudo systemctl stop kyklos
sudo systemctl status kyklos
journalctl -u kyklos -f

# 移除服務
sudo ./create-system-service.sh -r
```
READMEEOF

# ─── 顯示打包結果 ─────────────────────────────────────────
echo ""
echo -e "${CYAN}=========================================${NC}"
echo -e "${GREEN}  打包完成!${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""
echo -e "  輸出目錄: ${OUTPUT_DIR}"
echo ""

# 顯示目錄結構
echo -e "  ${CYAN}目錄結構:${NC}"
if command -v tree &>/dev/null; then
    tree -L 2 --dirsfirst "$OUTPUT_DIR" 2>/dev/null | sed 's/^/    /'
else
    find "$OUTPUT_DIR" -maxdepth 2 -print0 | sort -z | while IFS= read -r -d '' line; do
        rel="${line#${OUTPUT_DIR}}"
        [[ -z "$rel" ]] && rel="/"
        if [[ -d "$line" ]]; then
            echo -e "    \033[0;36m${rel}/\033[0m"
        else
            size=$(du -h "$line" 2>/dev/null | cut -f1)
            echo -e "    ${rel}  (${size})"
        fi
    done
fi

echo ""
TOTAL_SIZE=$(du -sh "$OUTPUT_DIR" | cut -f1)
echo -e "  ${CYAN}總大小: ${TOTAL_SIZE}${NC}"

# ─── 建立壓縮檔 ──────────────────────────────────────────
ARCHIVE_NAME="pack-kyklos-$(date +%Y%m%d%H%M%S).tgz"
ARCHIVE_PATH="${PROJECT_ROOT}/${ARCHIVE_NAME}"
info "建立壓縮檔: ${ARCHIVE_NAME}"
tar czf "$ARCHIVE_PATH" -C "$(dirname "$OUTPUT_DIR")" "$(basename "$OUTPUT_DIR")"
ARCHIVE_SIZE=$(du -h "$ARCHIVE_PATH" | cut -f1)

echo ""
echo -e "  ${CYAN}=========================================${NC}"
echo -e "  ${GREEN}壓縮檔:${NC} ${ARCHIVE_PATH}"
echo -e "  ${GREEN}大小:  ${NC} ${ARCHIVE_SIZE}"
echo -e "  ${CYAN}=========================================${NC}"

echo ""
echo -e "  ${GREEN}使用方式:${NC}"
echo -e "    1. 解壓: tar xzf ${ARCHIVE_NAME}"
echo -e "    2. 進入目錄: cd bin"
if [[ "$BUNDLE_LIBS" == true ]]; then
    echo -e "    3. 執行 ./start.sh 即可 (無需安裝其他套件)"
else
    echo -e "    3. 確認已安裝 iptables"
    echo -e "    4. 執行 ./start.sh"
fi
echo ""
