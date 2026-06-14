# kyklos k8s CI/CD

本目錄提供 kyklos 防火牆管理工具的 Kubernetes 部署 manifest 與 CI/CD pipeline 設定。

## 重要：權限與節點需求

kyklos 為**防火牆管理工具**，必須具備 CAP_NET_ADMIN 等系統權限才能操作 iptables / pfctl。
因此部署**僅適用於 Linux 節點的邊緣 / 網路閘道節點**，並需綁定 host network + privileged 模式。

建議情境：
- 單節點 / 邊緣 / IoT gateway
- 私有雲中的網路基礎架構節點
- **不**適合多租戶 / 多應用共享叢集

> 警告：切勿將此 manifest 部署到多節點共享叢集。多副本會導致每個 pod 都嘗試修改節點上的 iptables，造成規則衝突與叢集不穩定。

## 目錄結構

```
k8s/
├── README.md                       # 本文件
├── base/                           # 基礎 manifest（適用所有環境）
│   ├── namespace.yaml
│   ├── serviceaccount.yaml
│   ├── configmap.yaml              # 環境設定
│   ├── secret.yaml                 # Basic Auth 密碼（需替換）
│   ├── pvc.yaml                    # SQLite 持久化
│   ├── rbac.yaml                   # 最小權限
│   ├── deployment.yaml             # 主程式
│   ├── service.yaml
│   ├── ingress.yaml                # HTTPS 入口
│   ├── pdb-networkpolicy.yaml      # 中斷預算 + 網路隔離
│   └── kustomization.yaml
├── overlays/
│   └── prod/                       # 正式環境覆寫
│       ├── kustomization.yaml
│       ├── patch-replicas.yaml
│       └── patch-service.yaml
├── ci/
│   └── gitlab-ci.yml               # GitLab CI 對等設定
├── argocd/
│   └── application.yaml            # ArgoCD GitOps 部署
└── ../.github/workflows/
    ├── ci.yml                      # Lint + Test
    ├── build-image.yml             # Docker Build & Push
    └── deploy.yml                  # Staging / Production 部署
```

## 快速部署

### 前置需求

- Kubernetes 1.27+
- kubectl v1.27+
- kustomize v5+
- 一個 Linux 邊緣節點（須能執行 iptables）

### 1. 設定密碼

`base/secret.yaml` 中是預設值，**部署前必須替換**：

```bash
# 產生 BCrypt 雜湊（cost=10）
htpasswd -nbBC 10 "" 'YOUR_STRONG_PASSWORD' | tr -d ':\n'
# 將輸出貼到 secret.yaml 的 IPT_WEB_PASSWORD_HASH
```

或者改用更安全的 Secret 管理方式：

```bash
# Sealed Secrets
kubectl create secret generic kyklos-secret \
  --from-literal=IPT_WEB_USERNAME=admin \
  --from-literal=IPT_WEB_PASSWORD_HASH='$2y$10$...' \
  --dry-run=client -o yaml | kubeseal -o yaml > k8s/base/sealed-secret.yaml
```

### 2. 設定 TLS

```bash
# 使用 cert-manager 或手動建立 TLS secret
kubectl create secret tls kyklos-tls \
  --cert=path/to/tls.crt \
  --key=path/to/tls.key \
  -n kyklos
```

### 3. 標記邊緣節點

```bash
kubectl label node <your-edge-node> kyklos=allowed
```

### 4. 部署 base

```bash
# 預覽將套用的 manifest
kustomize build k8s/base

# 實際部署
kustomize build k8s/base | kubectl apply -f -
```

### 5. 部署 prod overlay

```bash
# 設定 image tag（CI/CD 會自動覆寫）
cd k8s/overlays/prod
kustomize edit set image "Miitai/kyklos=ghcr.io/kingasiagroup/kyklos:0.1.0"

# 部署
kustomize build . | kubectl apply -f -

# 觀察
kubectl get pods -n kyklos -w
kubectl logs -n kyklos -l app.kubernetes.io/name=kyklos -f
```

## CI/CD 流程

### GitHub Actions（推薦）

三個 workflow：

| Workflow | 觸發 | 內容 |
|----------|------|------|
| `ci.yml` | push to main / develop, PR | 前後端 lint、test、build、k8s manifest 驗證 |
| `build-image.yml` | push to main, tag `v*.*.*` | Docker buildx 多架構映像（amd64/arm64），推送到 GHCR |
| `deploy.yml` | push to main, tag, manual | Staging 自動部署、Production 需手動核准（環境保護規則） |

#### 必要的 GitHub Secrets

在 repo `Settings > Secrets and variables > Actions` 設定：

| Secret | 說明 |
|--------|------|
| `STAGING_KUBECONFIG` | Staging 叢集的 kubeconfig（base64 編碼） |
| `PRODUCTION_KUBECONFIG` | Production 叢集的 kubeconfig（base64 編碼） |
| `STAGING_ADMIN_USER` | 部署後健康檢查用的 admin 帳號 |
| `STAGING_ADMIN_PASS` | 部署後健康檢查用的 admin 密碼 |
| `PROD_ADMIN_USER` | Production 健康檢查帳號 |
| `PROD_ADMIN_PASS` | Production 健康檢查密碼 |
| `SLACK_WEBHOOK` | Slack 通知 webhook（可選） |

#### 部署流程

```
push to main
   ↓
[build-image] → 推送映像到 ghcr.io
   ↓
[deploy-staging] → 自動部署到 staging（含健康檢查 + 自動回滾）
   ↓
手動觸發 / 推送 tag
   ↓
[deploy-production] → 部署到 prod（需 GitHub Environment 保護規則）
```

### GitLab CI

`k8s/ci/gitlab-ci.yml` 提供對等設定，適用於 GitLab 倉庫。

必要的 GitLab CI/CD Variables（Project > Settings > CI/CD > Variables）：

| Variable | 說明 |
|----------|------|
| `KUBECONFIG_STAGING` | Staging kubeconfig (base64) |
| `KUBECONFIG_PRODUCTION` | Production kubeconfig (base64) |
| `PROD_ADMIN_USER` / `PROD_ADMIN_PASS` | 健康檢查 |
| `CI_REGISTRY_USER` / `CI_REGISTRY_PASSWORD` | GitLab Container Registry 認證（自動） |

### ArgoCD（GitOps 模式）

```bash
# 安裝 ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 套用 Application
kubectl apply -f k8s/argocd/application.yaml

# 取得 admin 密碼
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

修改 `k8s/argocd/application.yaml` 中的 `spec.source.repoURL` 為實際的 git 倉庫 URL。

## 升級流程

1. 推送新 tag 或合併 PR 至 main
2. CI 自動建置映像並推送到 registry
3. 推送至 main 時自動部署到 staging
4. 推送 `v*.*.*` tag 時觸發 production 部署
5. Production 部署由 GitHub Environment 保護（需 reviewer 核准）

## 備份與還原

### 自動備份（建議排程加入 CronJob）

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: kyklos-backup
  namespace: kyklos
spec:
  schedule: "0 2 * * *"  # 每日 02:00
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: backup
              image: alpine:3.19
              command: ["/bin/sh", "-c"]
              args:
                - |
                  apk add --no-cache sqlite curl
                  TIMESTAMP=$(date +%Y%m%d-%H%M%S)
                  BACKUP=/tmp/kyklos-${TIMESTAMP}.sqlite3
                  sqlite3 /data/kyklos.sqlite3 ".backup ${BACKUP}"
                  curl -X POST -F "file=@${BACKUP}" https://backup.example.com/upload
              volumeMounts:
                - name: data
                  mountPath: /data
          restartPolicy: OnFailure
          volumes:
            - name: data
              persistentVolumeClaim:
                claimName: kyklos-data
```

### 手動備份

```bash
kubectl exec -n kyklos deploy/kyklos -- \
  sqlite3 /app/data/kyklos.sqlite3 ".backup /app/data/manual-backup-$(date +%Y%m%d).sqlite3"

kubectl cp kyklos/$(kubectl get pod -n kyklos -l app.kubernetes.io/name=kyklos -o jsonpath='{.items[0].metadata.name}'):/app/data/manual-backup-*.sqlite3 ./
```

### 還原

```bash
# 停止 deployment，避免 sqlite lock
kubectl scale deployment/kyklos -n kyklos --replicas=0

# 複製備份回 PVC
kubectl cp ./kyklos-backup.sqlite3 kyklos/<pod-name>:/tmp/

kubectl exec -n kyklos <pod-name> -- \
  cp /tmp/kyklos-backup.sqlite3 /app/data/kyklos.sqlite3

# 重新啟動
kubectl scale deployment/kyklos -n kyklos --replicas=1
```

## 故障排除

### Pod 卡在 CrashLoopBackOff

```bash
kubectl logs -n kyklos -l app.kubernetes.io/name=kyklos --previous
```

常見原因：
- **Privileged 模式被 RBAC 拒絕**：檢查 PodSecurityPolicy / PSA 設定
- **節點缺少 iptables**：使用 Linux 節點
- **PVC 已被其他 Pod 持有**：先確認沒有其他占用者

### 無法連到 Web UI

```bash
# 1. 確認 Service 端點
kubectl get svc,endpoints -n kyklos

# 2. 確認 hostPort 在節點上 listen
ssh <node> ss -tlnp | grep 10001

# 3. 確認 NetworkPolicy
kubectl get networkpolicy -n kyklos -o yaml

# 4. 確認 Ingress
kubectl describe ingress -n kyklos
```

### iptables 規則沒生效

`kubectl exec -n kyklos deploy/kyklos -- iptables -L -n`

若看到規則但節點上沒生效，檢查：
- Pod 是否有 NET_ADMIN capability（看 deployment.yaml）
- 是否為 hostNetwork: true
- 節點是否為 Linux

## 安全考量

1. **privileged 容器**：已標示警語。建議用 Pod Security Admission `privileged` namespace 或僅在隔離環境部署
2. **NetworkPolicy**：已限制僅 ingress-nginx 與同 namespace 可訪問
3. **Secret**：使用 BCrypt cost >= 10，且 Secret 應改用 SealedSecrets / External Secrets Operator
4. **Image 簽章**：啟用 GHCR + cosign 簽章驗證
5. **不變更基礎架構的 host firewall**：kyklos 只管理 Linux iptables，不要與 cilium / calico 同節點使用

## 移除部署

```bash
kustomize build k8s/overlays/prod | kubectl delete -f -
kubectl delete namespace kyklos
```
