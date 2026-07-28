import { useEffect, useMemo, useState } from 'react'

type ApiResponse<T> = {
  code: number
  msg: string
  data: T
}

type OperationLog = {
  id: number
  username: string
  action: string
  target: string
  method: string
  status: string
  start_time: string
  end_time: string
  duration_ms: number
  detail: string
}

type BackupRecord = {
  id: number
  backup_type: string
  file_name: string
  file_path: string
  size_bytes: number
  status: string
  note: string
  created_at: string
}

type NotificationSetting = {
  id: number
  category: string
  label: string
  enabled: boolean
  persistent: boolean
  interval_minutes: number
  email: string
  send_email: boolean
  updated_at: string
  email_template: {
    subject: string
    body: string
  }
}

type NotificationItem = {
  id: number
  category: string
  title: string
  message: string
  severity: string
  acknowledged: boolean
  created_at: string
  target_view?: string
}

declare global {
  interface Window {
    loadOperationLogs?: () => void
    loadBackups?: (tab?: 'export' | 'import') => void
    loadNotificationSettings?: () => void
    showKToast?: (opts: Record<string, unknown>) => void
  }
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: 'same-origin', cache: 'no-store' })
  const json = (await res.json()) as ApiResponse<T>
  if (!res.ok || json.code !== 0) throw new Error(json.msg || `HTTP ${res.status}`)
  return json.data
}

async function apiPost<T>(path: string, body?: FormData | Blob | URLSearchParams): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'same-origin',
    body,
  })
  const text = await res.text()
  let json: ApiResponse<T>
  try {
    json = JSON.parse(text) as ApiResponse<T>
  } catch {
    throw new Error(text || `HTTP ${res.status}`)
  }
  if (!res.ok || json.code !== 0) throw new Error(json.msg || `HTTP ${res.status}`)
  return json.data
}

function toast(title: string, message?: string, danger = false) {
  if (window.showKToast) {
    window.showKToast({
      title,
      message: message || '',
      icon: danger ? 'bx-error-circle' : 'bx-check-circle',
      danger,
    })
    return
  }
  alert(message ? `${title}\n${message}` : title)
}

function navigateNotificationTarget(item: Pick<NotificationItem, 'category' | 'target_view'>) {
  const target = item.target_view || (item.category === 'blocked_ip' ? 'securityWhitelist' : item.category === 'backup_overdue' ? 'backup' : 'notificationSettings')
  const linkId = target === 'securityWhitelist'
    ? 'menuSecurityWhitelistLink'
    : target === 'backup'
      ? 'menuBackupDataLink'
      : 'menuNotificationSettingsLink'
  document.getElementById(linkId)?.click()
}

function fmtTime(value?: string | null): string {
  if (!value) return '-'
  return value.replace('T', ' ').replace('Z', '')
}

function fmtBytes(value: number): string {
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${value} B`
}

function buildQuery(params: Record<string, string | undefined>): string {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value)
  })
  const text = query.toString()
  return text ? `?${text}` : ''
}

const intervalUnits = [
  { value: 1, label: '分' },
  { value: 60, label: '小時' },
  { value: 1440, label: '日' },
  { value: 10080, label: '週' },
  { value: 43200, label: '月' },
]

function splitIntervalMinutes(minutes: number) {
  const safeMinutes = Math.max(1, Number(minutes || 1))
  const unit = [...intervalUnits].reverse().find((item) => safeMinutes % item.value === 0) || intervalUnits[0]
  return { amount: Math.max(1, safeMinutes / unit.value), unit: unit.value }
}

function intervalLabel(minutes: number): string {
  const split = splitIntervalMinutes(minutes)
  const unit = intervalUnits.find((item) => item.value === split.unit)
  return `每 ${split.amount} ${unit?.label || '分'}`
}

async function downloadFile(path: string, fallbackName: string) {
  const res = await fetch(path, { credentials: 'same-origin', cache: 'no-store' })
  if (!res.ok) throw new Error(await res.text())
  const blob = await res.blob()
  const disposition = res.headers.get('content-disposition') || ''
  const match = disposition.match(/filename="([^"]+)"/)
  const filename = match?.[1] || fallbackName
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function StatusBadge({ status }: { status: string }) {
  const ok = status === 'ok' || status === 'success'
  return <span className={`badge ${ok ? 'bg-label-success' : 'bg-label-danger'}`}>{ok ? '成功' : '失敗'}</span>
}

function OperationLogPanel() {
  const [logs, setLogs] = useState<OperationLog[]>([])
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [loading, setLoading] = useState(false)
  const [monitoring, setMonitoring] = useState<any>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await apiGet<OperationLog[]>(`/operation-logs${buildQuery({ limit: '200', start, end })}`)
      setLogs(data || [])
    } catch (error) {
      toast('操作記錄載入失敗', error instanceof Error ? error.message : String(error), true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    window.loadOperationLogs = load
    load()
    return () => {
      if (window.loadOperationLogs === load) delete window.loadOperationLogs
    }
  }, [start, end])

  const exportLog = async (format: 'csv' | 'pdf') => {
    try {
      await downloadFile(`/operation-logs/export${buildQuery({ format, start, end })}`, `operation-logs.${format}`)
      toast('操作記錄匯出已開始', format.toUpperCase())
    } catch (error) {
      toast('操作記錄匯出失敗', error instanceof Error ? error.message : String(error), true)
    }
  }

  const runMonitoring = async (kind: 'status' | 'audit') => {
    try {
      const data = await apiGet<any>(`/firewall-monitoring/${kind}`)
      setMonitoring(data)
      toast(kind === 'status' ? '防火牆日誌監測已檢查' : '防火牆規則稽核完成')
    } catch (error) {
      toast('防火牆監測失敗', error instanceof Error ? error.message : String(error), true)
    }
  }

  return (
    <div id="operationLogView" style={{ display: 'none' }} className="governance-view">
      <section className="gov-section">
        <div className="gov-section-head">
          <div>
            <h5>操作記錄</h5>
            <p>記錄登入、API 呼叫、設定變更與操作起迄時間。</p>
          </div>
          <div className="gov-actions">
            <button className="btn btn-outline-secondary" type="button" onClick={load} disabled={loading}>
              <i className="bx bx-refresh"></i>重新整理
            </button>
            <button className="btn btn-primary" type="button" onClick={() => exportLog('csv')}>
              <i className="bx bx-table"></i>匯出 CSV
            </button>
            <button className="btn btn-dark" type="button" onClick={() => exportLog('pdf')}>
              <i className="bx bx-file"></i>匯出 PDF
            </button>
          </div>
        </div>
        <div className="gov-filter-row">
          <label>
            <span>開始時間</span>
            <input className="form-control" type="datetime-local" value={start} onChange={(event) => setStart(event.target.value)} />
          </label>
          <label>
            <span>結束時間</span>
            <input className="form-control" type="datetime-local" value={end} onChange={(event) => setEnd(event.target.value)} />
          </label>
        </div>
        <div className="table-responsive">
          <table className="table table-sm gov-table">
            <thead>
              <tr>
                <th>時間</th>
                <th>使用者</th>
                <th>動作</th>
                <th>目標</th>
                <th>方法</th>
                <th>狀態</th>
                <th>持續時間</th>
                <th>詳細</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={8} className="text-muted text-center py-4">尚無操作記錄</td></tr>
              ) : logs.map((item) => (
                <tr key={item.id}>
                  <td>{fmtTime(item.start_time)}<small>{fmtTime(item.end_time)}</small></td>
                  <td><strong>{item.username}</strong></td>
                  <td>{item.action}</td>
                  <td><code>{item.target}</code></td>
                  <td>{item.method}</td>
                  <td><StatusBadge status={item.status} /></td>
                  <td>{item.duration_ms} ms</td>
                  <td>{item.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="gov-section mt-3">
        <div className="gov-section-head">
          <div>
            <h5>定期防火牆監測與規則稽核</h5>
            <p>檢查目前 filter 表 LOG 規則、開放風險與日誌平台導入狀態；後續可接 Crontab 做週期任務。</p>
          </div>
          <div className="gov-actions">
            <button className="btn btn-outline-primary" type="button" onClick={() => runMonitoring('status')}>
              <i className="bx bx-radar"></i>檢查日誌監測
            </button>
            <button className="btn btn-dark" type="button" onClick={() => runMonitoring('audit')}>
              <i className="bx bx-check-shield"></i>執行規則稽核
            </button>
          </div>
        </div>
        {!monitoring ? (
          <div className="text-muted">尚未執行檢查。</div>
        ) : (
          <div className="gov-monitoring-grid">
            <div className="gov-monitoring-card">
              <span>日誌規則</span>
              <strong>{monitoring.log_rules ?? monitoring.audit?.log_rules ?? 0}</strong>
              <small>{monitoring.logging_enabled ?? monitoring.audit?.logging_enabled ? '已偵測到 LOG 規則' : '尚未偵測到 LOG 規則'}</small>
            </div>
            <div className="gov-monitoring-card">
              <span>總規則數</span>
              <strong>{monitoring.total_rules ?? monitoring.audit?.total_rules ?? 0}</strong>
              <small>filter 表 IPv4 規則</small>
            </div>
            <div className="gov-monitoring-card">
              <span>高風險開放</span>
              <strong>{(monitoring.broad_accepts || monitoring.audit?.broad_accepts || []).length}</strong>
              <small>Any 到 Any 且指定目的埠 ACCEPT</small>
            </div>
            <div className="gov-monitoring-card">
              <span>導入平台</span>
              <strong>{monitoring.monitoring_platform || '未設定'}</strong>
              <small>{monitoring.ingest_status || '可後續串接 SIEM / syslog'}</small>
            </div>
            <div className="gov-monitoring-detail">
              <h6>稽核建議</h6>
              {(monitoring.recommendations || monitoring.audit?.recommendations || []).map((item: string) => <p key={item}>{item}</p>)}
              {(monitoring.broad_accepts || monitoring.audit?.broad_accepts || []).slice(0, 5).map((item: any, index: number) => (
                <code key={`${item.chain}-${index}`}>{item.chain}: {item.source} -&gt; {item.destination} {item.action}</code>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function BackupPanel() {
  const [records, setRecords] = useState<BackupRecord[]>([])
  const [latest, setLatest] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)

  const load = async () => {
    try {
      const data = await apiGet<{ latest_backup_at: string | null; items: BackupRecord[] }>('/backups')
      setLatest(data.latest_backup_at)
      setRecords(data.items || [])
    } catch (error) {
      toast('備份紀錄載入失敗', error instanceof Error ? error.message : String(error), true)
    }
  }

  useEffect(() => {
    window.loadBackups = load
    load()
    return () => {
      if (window.loadBackups === load) delete window.loadBackups
    }
  }, [])

  const exportBackup = async () => {
    try {
      await downloadFile('/backups/export', 'kyklos-backup.sqlite3')
      toast('匯出備份已完成', '近期備份時間已更新')
      await load()
    } catch (error) {
      toast('匯出備份失敗', error instanceof Error ? error.message : String(error), true)
    }
  }

  const importBackup = async () => {
    if (!file) {
      toast('請選擇備份檔', '請選擇 SQLite 備份檔後再匯入。', true)
      return
    }
    try {
      await apiPost('/backups/import', file)
      toast('匯入備份已保存', '已驗證並暫存備份檔。')
      setFile(null)
      await load()
    } catch (error) {
      toast('匯入備份失敗', error instanceof Error ? error.message : String(error), true)
    }
  }

  return (
    <div id="backupView" style={{ display: 'none' }} className="governance-view">
      <section className="gov-section">
        <div className="gov-section-head">
          <div>
            <h5>資料備份</h5>
            <p>匯出目前 SQLite 設定、歷史紀錄與工具資料；匯入檔案會先驗證並建立備份紀錄。</p>
          </div>
          <div className="gov-latest">
            <span>近期備份時間</span>
            <strong>{fmtTime(latest)}</strong>
          </div>
        </div>
        <div className="gov-backup-stack">
          <div className="gov-backup-action">
            <i className="bx bx-archive"></i>
            <div>
              <h6>建立完整備份</h6>
              <p>下載目前資料庫快照，包含設定、歷史紀錄、白名單紀錄與管理資料。</p>
            </div>
            <button className="btn btn-primary" type="button" onClick={exportBackup}>
              <i className="bx bx-download"></i>匯出備份
            </button>
          </div>
          <div className="gov-backup-action">
            <i className="bx bx-upload"></i>
            <div>
              <h6>匯入備份檔</h6>
              <p>第一版先保存並驗證 SQLite 備份檔，避免服務運行中直接覆蓋目前資料庫。</p>
              <input className="form-control" type="file" accept=".sqlite,.sqlite3,.db" onChange={(event) => setFile(event.target.files?.[0] || null)} />
            </div>
            <button className="btn btn-dark" type="button" onClick={importBackup}>
              <i className="bx bx-import"></i>匯入備份
            </button>
          </div>
        </div>
        <div className="table-responsive mt-3">
          <table className="table table-sm gov-table">
            <thead>
              <tr>
                <th>時間</th>
                <th>類型</th>
                <th>檔名</th>
                <th>大小</th>
                <th>狀態</th>
                <th>備註</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan={6} className="text-muted text-center py-4">尚無備份紀錄</td></tr>
              ) : records.map((item) => (
                <tr key={item.id}>
                  <td>{fmtTime(item.created_at)}</td>
                  <td>{item.backup_type === 'export' ? '匯出' : '匯入'}</td>
                  <td><code>{item.file_name}</code></td>
                  <td>{fmtBytes(item.size_bytes)}</td>
                  <td><StatusBadge status={item.status} /></td>
                  <td>{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function NotificationSettingsPanel() {
  const [settings, setSettings] = useState<NotificationSetting[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const load = async () => {
    try {
      const [settingsData, notificationsData] = await Promise.all([
        apiGet<NotificationSetting[]>('/notification-settings'),
        apiGet<NotificationItem[]>('/notifications?limit=20'),
      ])
      setSettings(settingsData || [])
      setNotifications(notificationsData || [])
    } catch (error) {
      toast('通知設定載入失敗', error instanceof Error ? error.message : String(error), true)
    }
  }

  useEffect(() => {
    window.loadNotificationSettings = load
    load()
    return () => {
      if (window.loadNotificationSettings === load) delete window.loadNotificationSettings
    }
  }, [])

  const updateSetting = async (item: NotificationSetting, patch: Partial<NotificationSetting>) => {
    const next = { ...item, ...patch }
    if (patch.send_email === true && !String(next.email || '').trim()) {
      toast('請先填寫 E-mail', '啟用寄送信件前，需要先填寫通知收件 E-mail。', true)
      return
    }
    const form = new URLSearchParams()
    form.set('category', next.category)
    form.set('enabled', next.enabled ? '1' : '0')
    form.set('persistent', next.persistent ? '1' : '0')
    form.set('interval_minutes', String(next.interval_minutes))
    form.set('email', next.email || '')
    form.set('send_email', next.send_email ? '1' : '0')
    try {
      await apiPost('/notification-settings', form)
      toast('通知設定已儲存', next.label)
      await load()
    } catch (error) {
      toast('通知設定儲存失敗', error instanceof Error ? error.message : String(error), true)
    }
  }

  const unreadCount = useMemo(() => notifications.filter((item) => !item.acknowledged).length, [notifications])

  return (
    <div id="notificationSettingsView" style={{ display: 'none' }} className="governance-view">
      <section className="gov-section">
        <div className="gov-section-head">
          <div>
            <h5>告警通知設定</h5>
            <p>設定阻擋 IP、定期備份等通知類別，以及是否持續提醒與 E-mail 寄送。</p>
          </div>
          <div className="gov-latest">
            <span>未讀通知</span>
            <strong>{unreadCount}</strong>
          </div>
        </div>
        <div className="gov-settings-grid">
          {settings.map((item) => {
            const interval = splitIntervalMinutes(item.interval_minutes)
            return (
            <div className="gov-setting-card" key={item.category}>
              <div className="gov-setting-title">
                <h6>{item.label}</h6>
                <label className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" checked={item.enabled} onChange={(event) => updateSetting(item, { enabled: event.target.checked })} />
                  <span className="form-check-label">{item.enabled ? '啟用' : '停用'}</span>
                </label>
              </div>
              <div className="gov-setting-fields">
                <label className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" checked={item.persistent} onChange={(event) => updateSetting(item, { persistent: event.target.checked })} />
                  <span className="form-check-label">持續通知</span>
                </label>
                <label>
                  <span>通知間隔</span>
                  <div className="gov-interval-control">
                    <input className="form-control" type="number" min={1} max={31} value={interval.amount} onChange={(event) => updateSetting(item, { interval_minutes: Math.max(1, Number(event.target.value || 1)) * interval.unit })} />
                    <select className="form-select" value={interval.unit} onChange={(event) => updateSetting(item, { interval_minutes: interval.amount * Number(event.target.value) })}>
                      {intervalUnits.map((unit) => <option value={unit.value} key={unit.value}>{unit.label}</option>)}
                    </select>
                  </div>
                  <small className="text-muted">{intervalLabel(item.interval_minutes)}提醒一次</small>
                </label>
                <label>
                  <span>E-mail</span>
                  <input className="form-control" type="email" value={item.email} onChange={(event) => updateSetting(item, { email: event.target.value })} />
                </label>
                <label className="form-check form-switch gov-email-toggle">
                  <input className="form-check-input" type="checkbox" checked={item.send_email} onChange={(event) => updateSetting(item, { send_email: event.target.checked })} />
                  <span className="form-check-label">寄送信件</span>
                </label>
              </div>
              <div className="gov-email-template">
                <strong>{item.email_template.subject}</strong>
                <p>{item.email_template.body}</p>
              </div>
            </div>
          )})}
        </div>
        <h6 className="mt-4 mb-2">近期通知</h6>
        <div className="gov-notification-list">
          {notifications.length === 0 ? <div className="text-muted">尚無通知</div> : notifications.map((item) => (
            <button type="button" className={`gov-notification-item is-${item.severity} ${item.acknowledged ? 'is-read' : 'is-unread'}`} key={item.id} onClick={() => navigateNotificationTarget(item)}>
              <i className="bx bx-bell"></i>
              <div>
                <strong>{item.title}</strong>
                <p>{item.message}</p>
                <small>{fmtTime(item.created_at)}</small>
              </div>
              <span className={`badge ${item.acknowledged ? 'bg-label-secondary' : 'bg-label-warning'}`}>
                {item.acknowledged ? '已讀' : '未讀'}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

export default function GovernanceView() {
  return (
    <>
      <OperationLogPanel />
      <BackupPanel />
      <NotificationSettingsPanel />
    </>
  )
}
