import { useEffect, useMemo, useRef, useState } from 'react'
import { apiGet, apiPost } from '../../../utils/api'

type WhitelistSettings = {
  enabled: boolean
  updated_at: string
}

type WhitelistIp = {
  id: number
  ip_address: string
  protocol: string
  port_start?: number | null
  port_end?: number | null
  enabled: boolean
  note: string
  created_at: string
  updated_at: string
}

type WhitelistLog = {
  id: number
  source_ip: string
  destination_ip: string
  destination_port?: number | null
  protocol: string
  decision: string
  start_time: string
  end_time?: string | null
  duration_secs?: number | null
  note: string
  observed_count: number
  last_seen: string
}

function showSecurityToast(title: string, message?: string, detail?: string, danger = false) {
  const showKToast = (window as unknown as { showKToast?: (opts: Record<string, unknown>) => void }).showKToast
  if (showKToast) {
    showKToast({
      title,
      message,
      detail,
      icon: danger ? 'bx-error-circle' : 'bx-check-shield',
      className: danger ? 'is-disabled' : '',
      delay: danger ? 7000 : 4500,
    })
    return
  }
  const layer = (window as unknown as { layer?: { msg: (text: string, opts?: Record<string, unknown>) => void } }).layer
  if (layer) layer.msg(title, { icon: danger ? 2 : 1, important: true, message, detail })
}

function formatDuration(seconds?: number | null) {
  if (seconds == null) return '進行中'
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remain = seconds % 60
  if (minutes < 60) return `${minutes}m ${remain}s`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

function decisionLabel(decision: string) {
  if (decision === 'allowed') return '允許'
  if (decision === 'blocked') return '阻擋'
  return decision || '未知'
}

function whitelistPortLabel(item: Pick<WhitelistIp, 'port_start' | 'port_end'>) {
  if (!item.port_start && !item.port_end) return '全部 Port'
  if (item.port_start && item.port_end && item.port_start !== item.port_end) return `${item.port_start} - ${item.port_end}`
  return `${item.port_start || item.port_end}`
}

function whitelistScopeLabel(item: Pick<WhitelistIp, 'protocol' | 'port_start' | 'port_end'>) {
  const protocol = (item.protocol || 'all').toUpperCase()
  if (protocol === 'ALL') return 'ALL / 全部 Port'
  return `${protocol} / ${whitelistPortLabel(item)}`
}

function parseIpv4(value: string): number[] | null {
  const parts = value.trim().split('.')
  if (parts.length !== 4) return null
  const nums = parts.map((part) => {
    if (!/^\d{1,3}$/.test(part)) return Number.NaN
    return Number(part)
  })
  if (nums.some((num) => !Number.isInteger(num) || num < 0 || num > 255)) return null
  return nums
}

function validateIpRangeInput(value: string): string {
  const raw = value.trim()
  if (!raw || !raw.includes('-')) return ''
  const parts = raw.split('-')
  if (parts.length !== 2) return 'IP 範圍格式錯誤，請使用 172.23.23.10 - 172.23.23.110'
  const start = parseIpv4(parts[0])
  const end = parseIpv4(parts[1])
  if (!start || !end) return 'IP 範圍僅支援 IPv4，格式例如 172.23.23.10 - 172.23.23.110'
  if (start.slice(0, 3).join('.') !== end.slice(0, 3).join('.')) return 'IP 範圍前三碼必須相同，例如 172.23.23.15 - 172.23.23.30'
  if (start[3] > end[3]) return 'IP 範圍起始位址不可大於結束位址'
  if (end[3] - start[3] + 1 > 100) return '一次性設定 IP 範圍不可大於 100 個位址'
  return ''
}

type SecurityViewProps = {
  whitelistOnly?: boolean
}

export default function SecurityView({ whitelistOnly = false }: SecurityViewProps) {
  const [settings, setSettings] = useState<WhitelistSettings>({ enabled: false, updated_at: '' })
  const [ips, setIps] = useState<WhitelistIp[]>([])
  const [logs, setLogs] = useState<WhitelistLog[]>([])
  const [ipAddress, setIpAddress] = useState('')
  const [protocol, setProtocol] = useState('all')
  const [portStart, setPortStart] = useState('')
  const [portEnd, setPortEnd] = useState('')
  const [note, setNote] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showClearLogsModal, setShowClearLogsModal] = useState(false)
  const [editingIp, setEditingIp] = useState<WhitelistIp | null>(null)
  const [modalError, setModalError] = useState('')
  const [lastLogSyncAt, setLastLogSyncAt] = useState('')
  const [lastLogSyncCount, setLastLogSyncCount] = useState<number | null>(null)
  const [logSyncError, setLogSyncError] = useState('')
  const [logExportMode, setLogExportMode] = useState<'all' | 'range'>('all')
  const [logExportFormat, setLogExportFormat] = useState<'csv' | 'pdf'>('csv')
  const [logExportStart, setLogExportStart] = useState('')
  const [logExportEnd, setLogExportEnd] = useState('')
  const logRefreshInFlight = useRef(false)

  const enabledIpCount = useMemo(() => ips.filter((item) => item.enabled).length, [ips])
  const blockedCount = useMemo(() => logs.filter((item) => item.decision === 'blocked').length, [logs])
  const ipRangeError = useMemo(() => validateIpRangeInput(ipAddress), [ipAddress])

  async function loadWhitelist(silent = false) {
    try {
      const [settingsRes, ipsRes, logsRes] = await Promise.all([
        apiGet<WhitelistSettings>('/security/whitelist/settings'),
        apiGet<WhitelistIp[]>('/security/whitelist/ips'),
        apiGet<WhitelistLog[]>('/security/whitelist/logs'),
      ])
      if (settingsRes.code !== 0) throw new Error(settingsRes.msg)
      if (ipsRes.code !== 0) throw new Error(ipsRes.msg)
      if (logsRes.code !== 0) throw new Error(logsRes.msg)
      setSettings(settingsRes.data)
      setIps(ipsRes.data || [])
      setLogs(logsRes.data || [])
      if (!silent) showSecurityToast('白名單資料已刷新', `白名單 ${ipsRes.data?.length || 0} 筆，紀錄 ${logsRes.data?.length || 0} 筆`)
    } catch (err) {
      showSecurityToast('白名單載入失敗', err instanceof Error ? err.message : String(err), undefined, true)
    }
  }

  useEffect(() => {
    loadWhitelist(true)
  }, [])

  useEffect(() => {
    const isWhitelistVisible = () => {
      const view = document.getElementById('securityView')
      const pane = document.getElementById('securityWhitelistPane')
      if (!view || !pane) return false
      const viewVisible = window.getComputedStyle(view).display !== 'none'
      const whitelistStandalone = view.classList.contains('security-whitelist-standalone')
      const whitelistActive = pane.classList.contains('show') || pane.classList.contains('active')
      return viewVisible && (whitelistStandalone || whitelistActive)
    }
    const sync = () => {
      if (!settings.enabled) return
      if (!isWhitelistVisible()) return
      refreshLogs(true)
    }
    sync()
    const timer = window.setInterval(sync, 5000)
    return () => window.clearInterval(timer)
  }, [settings.enabled])

  async function saveIp() {
    if (!ipAddress.trim()) {
      const message = '可輸入單一 IP 或 CIDR，例如 10.20.100.103 或 10.20.100.0/24'
      if (showAddModal) setModalError(message)
      else showSecurityToast('請輸入白名單 IP', message, undefined, true)
      return
    }
    if (ipRangeError) {
      if (showAddModal) setModalError(ipRangeError)
      else showSecurityToast('白名單 IP 範圍錯誤', ipRangeError, undefined, true)
      return
    }
    setModalError('')
    setLoading(true)
    try {
      const res = await apiPost<WhitelistIp>('/security/whitelist/ips', {
        id: editingIp?.id,
        ip_address: ipAddress.trim(),
        protocol,
        port_start: portStart.trim(),
        port_end: portEnd.trim(),
        enabled,
        note,
      })
      if (res.code !== 0) throw new Error(res.msg)
      setIpAddress('')
      setProtocol('all')
      setPortStart('')
      setPortEnd('')
      setNote('')
      setEnabled(true)
      setShowAddModal(false)
      setEditingIp(null)
      setModalError('')
      await loadWhitelist(true)
      showSecurityToast(editingIp ? '白名單規則已更新' : '白名單規則已儲存', res.data.ip_address, whitelistScopeLabel(res.data))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (showAddModal) setModalError(message)
      else showSecurityToast('白名單 IP 儲存失敗', message, undefined, true)
    } finally {
      setLoading(false)
    }
  }

  async function toggleIp(item: WhitelistIp) {
    const next = !item.enabled
    try {
      const res = await apiPost(`/security/whitelist/ips/${item.id}/enabled`, { enabled: next })
      if (res.code !== 0) throw new Error(res.msg)
      await loadWhitelist(true)
      showSecurityToast(next ? '白名單規則已啟用' : '白名單規則已停用', item.ip_address, whitelistScopeLabel(item))
    } catch (err) {
      showSecurityToast('白名單狀態更新失敗', err instanceof Error ? err.message : String(err), undefined, true)
    }
  }

  async function deleteIp(item: WhitelistIp) {
    if (!confirm(`確定刪除白名單 IP：${item.ip_address}？`)) return
    try {
      const res = await apiPost(`/security/whitelist/ips/${item.id}/delete`, {})
      if (res.code !== 0) throw new Error(res.msg)
      await loadWhitelist(true)
      showSecurityToast('白名單 IP 已刪除', item.ip_address)
    } catch (err) {
      showSecurityToast('白名單 IP 刪除失敗', err instanceof Error ? err.message : String(err), undefined, true)
    }
  }

  async function saveSettings(sync: boolean) {
    if (settings.enabled && enabledIpCount === 0) {
      showSecurityToast('無法啟用防護', '請先新增至少一筆啟用中的白名單 IP，避免鎖住管理連線。', undefined, true)
      return
    }
    setLoading(true)
    try {
      const res = await apiPost('/security/whitelist/settings', {
        enabled: settings.enabled,
        sync,
      })
      if (res.code !== 0) throw new Error(res.msg)
      await loadWhitelist(true)
      if (sync) {
        showSecurityToast('iptables 設定已同步', settings.enabled ? '白名單防護規則已套用' : '白名單防護規則已停用')
      } else {
        showSecurityToast(settings.enabled ? '白名單防護已啟用' : '白名單防護已停用', '設定已儲存')
      }
    } catch (err) {
      showSecurityToast(sync ? 'iptables 設定同步失敗' : '白名單防護儲存失敗', err instanceof Error ? err.message : String(err), undefined, true)
    } finally {
      setLoading(false)
    }
  }

  async function refreshLogs(silent = false) {
    if (!settings.enabled) {
      if (!silent) showSecurityToast('連線紀錄同步暫停', '白名單防護未啟用，連線紀錄不會進行同步。', undefined, true)
      return
    }
    if (logRefreshInFlight.current) return
    logRefreshInFlight.current = true
    if (!silent) setLoading(true)
    try {
      const res = await apiPost<{ refreshed: number; logs: WhitelistLog[] }>('/security/whitelist/logs/refresh', {})
      if (res.code !== 0) throw new Error(res.msg)
      setLogs(res.data.logs || [])
      setLastLogSyncAt(new Date().toLocaleTimeString('zh-TW', { hour12: false }))
      setLastLogSyncCount(res.data.refreshed)
      setLogSyncError('')
      if (!silent) showSecurityToast('連線紀錄已同步', `本次觀察到 ${res.data.refreshed} 筆目前連線`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setLogSyncError(message)
      if (!silent) showSecurityToast('連線紀錄同步失敗', message, undefined, true)
    } finally {
      if (!silent) setLoading(false)
      logRefreshInFlight.current = false
    }
  }

  async function allowLogIp(item: WhitelistLog) {
    try {
      const res = await apiPost(`/security/whitelist/logs/${item.id}/allow`, {
        note: `由連線紀錄允許：${item.source_ip} -> ${item.destination_ip}`,
      })
      if (res.code !== 0) throw new Error(res.msg)
      await loadWhitelist(true)
      showSecurityToast('已加入白名單', item.source_ip, `來源 ${item.source_ip} 後續將被允許`)
    } catch (err) {
      showSecurityToast('允許 IP 失敗', err instanceof Error ? err.message : String(err), undefined, true)
    }
  }

  async function blockLogIp(item: WhitelistLog) {
    try {
      const res = await apiPost(`/security/whitelist/logs/${item.id}/block`, {
        note: `維持阻擋：${item.source_ip}`,
      })
      if (res.code !== 0) throw new Error(res.msg)
      await loadWhitelist(true)
      showSecurityToast('已維持阻擋', item.source_ip)
    } catch (err) {
      showSecurityToast('更新阻擋紀錄失敗', err instanceof Error ? err.message : String(err), undefined, true)
    }
  }

  function downloadLogs() {
    const params = new URLSearchParams()
    if (logExportMode === 'range') {
      if (!logExportStart || !logExportEnd) {
        showSecurityToast('請選擇匯出時段', '自訂時段需要同時選擇開始時間與結束時間。', undefined, true)
        return
      }
      if (logExportStart > logExportEnd) {
        showSecurityToast('匯出時段不正確', '開始時間不可晚於結束時間。', undefined, true)
        return
      }
      params.set('start', logExportStart)
      params.set('end', logExportEnd)
    }
    params.set('format', logExportFormat)
    const url = `/security/whitelist/logs/export${params.toString() ? `?${params.toString()}` : ''}`
    const link = document.createElement('a')
    link.href = url
    link.download = ''
    document.body.appendChild(link)
    link.click()
    link.remove()
    showSecurityToast('連線紀錄下載已開始', `${logExportFormat.toUpperCase()} · ${logExportMode === 'all' ? '全部時間紀錄' : `${logExportStart} ~ ${logExportEnd}`}`)
  }

  async function clearLogs() {
    setLoading(true)
    try {
      const res = await apiPost<{ cleared: number }>('/security/whitelist/logs/clear', {})
      if (res.code !== 0) throw new Error(res.msg)
      setLogs([])
      setLastLogSyncAt('')
      setLastLogSyncCount(0)
      setLogSyncError('')
      setShowClearLogsModal(false)
      showSecurityToast('連線紀錄已清除', `已清除 ${res.data.cleared} 筆連線紀錄`)
    } catch (err) {
      showSecurityToast('清除連線紀錄失敗', err instanceof Error ? err.message : String(err), undefined, true)
    } finally {
      setLoading(false)
    }
  }

  function openAddIpModal() {
    setIpAddress('')
    setProtocol('all')
    setPortStart('')
    setPortEnd('')
    setNote('')
    setEnabled(true)
    setEditingIp(null)
    setModalError('')
    setShowAddModal(true)
  }

  function openEditIpModal(item: WhitelistIp) {
    setIpAddress(item.ip_address)
    setProtocol(item.protocol || 'all')
    setPortStart(item.port_start ? String(item.port_start) : '')
    setPortEnd(item.port_end ? String(item.port_end) : '')
    setNote(item.note || '')
    setEnabled(item.enabled)
    setEditingIp(item)
    setModalError('')
    setShowAddModal(true)
  }

  return (
    <div id="securityView" className={`security-view ${whitelistOnly ? 'security-whitelist-standalone' : ''}`} style={{ display: 'none' }}>
      <ul className="nav nav-tabs nav-fill mb-3" id="securityTabs" role="tablist">
        <li className="nav-item"><button className="nav-link active" id="security-cvs-tab" data-bs-toggle="tab" data-bs-target="#securityCvsPane" type="button" role="tab"><i className="bx bx-cloud-download me-1"></i><span className="securityTabLabel">CVS 資料庫</span></button></li>
        <li className="nav-item"><button className="nav-link" id="security-scan-tab" data-bs-toggle="tab" data-bs-target="#securityScanPane" type="button" role="tab"><i className="bx bx-scan me-1"></i><span className="securityTabLabel">網路掃描</span></button></li>
      </ul>
      <div className="tab-content p-0">
        <div className="tab-pane fade show active" id="securityCvsPane" role="tabpanel">
          <div className="row g-3">
            <div className="col-lg-5">
              <div className="card">
                <div className="card-header py-2"><strong style={{ fontSize: '.8125rem' }}>CVS 來源</strong></div>
                <div className="card-body haproxy-form">
                  <div className="mb-2">
                    <label className="form-label" htmlFor="secCvsName">名稱</label>
                    <input type="text" className="form-control font-monospace" id="secCvsName" placeholder="Threat Intel Feed" />
                  </div>
                  <div className="mb-2">
                    <label className="form-label" htmlFor="secCvsUrl">URL</label>
                    <input type="text" className="form-control font-monospace" id="secCvsUrl" placeholder="https://example.com/data.csv" />
                  </div>
                  <div className="mb-2">
                    <label className="form-label" htmlFor="secCvsTable">資料表名稱</label>
                    <input type="text" className="form-control font-monospace" id="secCvsTable" defaultValue="cvs_import" />
                  </div>
                  <div className="row g-2 mb-2">
                    <div className="col-md-4"><label className="form-label" htmlFor="secCvsDelimiter">分隔符</label><select className="form-select" id="secCvsDelimiter"><option value=",">逗號 (,)</option><option value="tab">Tab</option><option value=";">分號 (;)</option></select></div>
                    <div className="col-md-4"><label><input type="checkbox" id="secCvsHeader" defaultChecked /> 有標題列</label></div>
                  </div>
                  <div className="d-flex gap-2 flex-wrap">
                    <button className="btn btn-outline-primary" id="secCvsPreviewBtn"><i className="bx bx-show me-1"></i>預覽</button>
                    <button className="btn btn-primary" id="secCvsImportBtn"><i className="bx bx-cloud-download me-1"></i>下載並匯入</button>
                    <button className="btn btn-outline-success" id="secCvsSaveSourceBtn"><i className="bx bx-save me-1"></i>儲存來源</button>
                  </div>
                  <div className="mt-2" id="secCvsResult"></div>
                </div>
              </div>
            </div>
            <div className="col-lg-7">
              <div className="card">
                <div className="card-header py-2 d-flex justify-content-between align-items-center">
                  <strong style={{ fontSize: '.8125rem' }}>已儲存來源</strong>
                  <button className="btn btn-sm btn-outline-secondary" id="secCvsRefreshSources"><i className="bx bx-refresh"></i></button>
                </div>
                <div className="card-body p-2" id="secCvsSourceList"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="tab-pane fade" id="securityScanPane" role="tabpanel">
          <div className="row g-3">
            <div className="col-lg-5">
              <div className="card">
                <div className="card-header py-2"><strong style={{ fontSize: '.8125rem' }}>新增掃描任務</strong></div>
                <div className="card-body haproxy-form">
                  <div className="mb-2"><label className="form-label" htmlFor="secScanName">任務名稱</label><input type="text" className="form-control font-monospace" id="secScanName" placeholder="Internal Scan" /></div>
                  <div className="mb-2"><label className="form-label" htmlFor="secScanTarget">目標</label><input type="text" className="form-control font-monospace" id="secScanTarget" placeholder="192.168.1.0/24 or 10.0.0.1-100" /></div>
                  <div className="mb-2"><label className="form-label" htmlFor="secScanPorts">埠號 (逗號分隔)</label><input type="text" className="form-control font-monospace" id="secScanPorts" defaultValue="22,80,443,3306,6379,8080,8443" /></div>
                  <div className="mb-2"><label className="form-label" htmlFor="secScanType">掃描類型</label><select className="form-select" id="secScanType"><option value="tcp">TCP Connect</option><option value="udp">UDP</option></select></div>
                  <button className="btn btn-primary w-100" id="secScanCreateBtn"><i className="bx bx-plus me-1"></i>建立並執行</button>
                  <div className="mt-2" id="secScanResult"></div>
                </div>
              </div>
            </div>
            <div className="col-lg-7">
              <div className="card">
                <div className="card-header py-2 d-flex justify-content-between align-items-center">
                  <strong style={{ fontSize: '.8125rem' }}>掃描紀錄</strong>
                  <button className="btn btn-sm btn-outline-secondary" id="secScanRefreshTasks"><i className="bx bx-refresh"></i></button>
                </div>
                <div className="card-body p-2" id="secScanTaskList"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="tab-pane fade" id="securityWhitelistPane" role="tabpanel">
          <div className="security-whitelist-page">
            <div className="col-12">
              <div className="security-whitelist-status">
                <section className={settings.enabled ? 'is-active' : 'is-paused'}>
                  <i className={settings.enabled ? 'bx bx-shield-quarter' : 'bx bx-pause-circle'}></i>
                  <div>
                    <span>防護狀態</span>
                    <strong>{settings.enabled ? '啟用中' : '尚未啟用'}</strong>
                    <small>{settings.updated_at || '尚未同步'}</small>
                  </div>
                </section>
                <section className="is-allow">
                  <i className="bx bx-list-check"></i>
                  <div>
                    <span>啟用白名單</span>
                    <strong>{enabledIpCount} 筆</strong>
                    <small>目前可通過的 IP / CIDR / Port 規則</small>
                  </div>
                </section>
                <section className="is-blocked">
                  <i className="bx bx-block"></i>
                  <div>
                    <span>阻擋紀錄</span>
                    <strong>{blockedCount} 筆</strong>
                    <small>最近 300 筆紀錄內</small>
                  </div>
                </section>
              </div>
            </div>
            <div className="col-12">
              <div className="card security-whitelist-panel security-whitelist-control-card">
                <div className="card-header security-whitelist-panel-header">
                  <div className="security-whitelist-card-title is-control">
                    <i className="bx bx-shield-quarter"></i>
                    <div>
                      <strong>白名單防護控制</strong>
                      <span>控制白名單防護開關，並同步下發 iptables 規則。</span>
                    </div>
                  </div>
                  <div className="d-flex gap-2 flex-wrap">
                    <button className="btn btn-sm btn-outline-secondary" type="button" disabled={loading} onClick={() => loadWhitelist()}>
                      <i className="bx bx-refresh me-1"></i>重新整理
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="security-whitelist-control-row">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" id="secWhitelistProtection" checked={settings.enabled} onChange={(event) => setSettings((current) => ({ ...current, enabled: event.target.checked }))} />
                      <label className="form-check-label fw-semibold" htmlFor="secWhitelistProtection">啟用白名單防護</label>
                    </div>
                    <div className="security-whitelist-actions">
                      <button className="btn btn-outline-success" type="button" disabled={loading} onClick={() => saveSettings(false)}>儲存設定</button>
                      <button className="btn btn-success" type="button" disabled={loading} onClick={() => saveSettings(true)}>同步 iptables 設定</button>
                    </div>
                  </div>
                  <div className="security-whitelist-warning mt-3">
                    <i className="bx bx-error-circle"></i>
                    <span>啟用防護後，不在白名單內的新進連線會被阻擋。請先加入目前管理端 IP。</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12">
              <div className="card security-whitelist-panel security-whitelist-list-card">
                <div className="card-header security-whitelist-panel-header">
                  <div className="security-whitelist-card-title is-list">
                    <i className="bx bx-list-check"></i>
                    <div>
                      <strong>白名單清單列表</strong>
                      <span>手動允許的來源 IP / CIDR / Port，可編輯、啟用停用或刪除。</span>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className="badge bg-label-primary">{ips.length} 筆</span>
                    <button className="btn btn-sm btn-primary" type="button" disabled={loading} onClick={openAddIpModal}>
                      <i className="bx bx-plus-circle me-1"></i>新增白名單規則
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="security-whitelist-list mt-3">
                    {ips.map((item) => (
                      <article key={item.id} className={`security-whitelist-item ${item.enabled ? 'is-enabled' : 'is-disabled'}`}>
                        <div className="security-whitelist-item-main">
                          <div className="security-whitelist-ip-line">
                            <code>{item.ip_address}</code>
                            <span className={`badge ${item.enabled ? 'bg-label-success' : 'bg-label-secondary'}`}>{item.enabled ? '啟用' : '停用'}</span>
                          </div>
                          <div className="security-whitelist-rule-badges">
                            <span><i className="bx bx-git-branch me-1"></i>{(item.protocol || 'all').toUpperCase()}</span>
                            <span><i className="bx bx-transfer-alt me-1"></i>{whitelistPortLabel(item)}</span>
                          </div>
                          <div className="security-whitelist-note">{item.note || '無備註'}</div>
                          <div className="security-whitelist-meta">
                            <span>建立：{item.created_at}</span>
                            <span>更新：{item.updated_at}</span>
                          </div>
                        </div>
                        <div className="security-whitelist-item-actions">
                          <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => openEditIpModal(item)}>編輯</button>
                          <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => toggleIp(item)}>{item.enabled ? '停用' : '啟用'}</button>
                          <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => deleteIp(item)}>刪除</button>
                        </div>
                      </article>
                    ))}
                    {!ips.length && (
                      <div className="security-whitelist-empty">
                        <i className="bx bx-list-plus"></i>
                        <strong>尚未建立白名單規則</strong>
                        <span>請先新增目前管理端 IP，再啟用白名單防護。</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12">
              <div className="card security-whitelist-panel security-whitelist-log-card">
                <div className="card-header security-whitelist-panel-header">
                  <div className="security-whitelist-card-title is-log">
                    <i className="bx bx-history"></i>
                    <div>
                      <strong>連線紀錄 Log</strong>
                      <span>即時同步目前連線，來源 IP 可直接改為允許或維持阻擋。</span>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <div className={`security-whitelist-live-status ${!settings.enabled ? 'is-paused' : logSyncError ? 'is-error' : 'is-live'}`}>
                      <i className={!settings.enabled ? 'bx bx-pause-circle' : logSyncError ? 'bx bx-error-circle' : 'bx bx-radio-circle-marked'}></i>
                      <span>{!settings.enabled ? '同步暫停' : logSyncError ? '同步異常' : '即時同步中'}</span>
                      <small>{!settings.enabled ? '白名單防護未啟用' : logSyncError || (lastLogSyncAt ? `${lastLogSyncAt} · ${lastLogSyncCount ?? 0} 筆` : '等待首次同步')}</small>
                    </div>
                    <button className="btn btn-sm btn-outline-primary" type="button" disabled={loading || !settings.enabled} onClick={() => refreshLogs(false)}>
                      <i className="bx bx-history me-1"></i>立即同步
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="security-whitelist-log-toolbar">
                    <div className="security-whitelist-log-export-mode" role="group" aria-label="連線紀錄匯出範圍">
                      <button className={`btn btn-sm ${logExportMode === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`} type="button" onClick={() => setLogExportMode('all')}>全部時間</button>
                      <button className={`btn btn-sm ${logExportMode === 'range' ? 'btn-primary' : 'btn-outline-secondary'}`} type="button" onClick={() => setLogExportMode('range')}>自訂時段</button>
                    </div>
                    <div className="security-whitelist-log-export-mode" role="group" aria-label="連線紀錄匯出格式">
                      <button className={`btn btn-sm ${logExportFormat === 'csv' ? 'btn-dark' : 'btn-outline-secondary'}`} type="button" onClick={() => setLogExportFormat('csv')}>CSV</button>
                      <button className={`btn btn-sm ${logExportFormat === 'pdf' ? 'btn-dark' : 'btn-outline-secondary'}`} type="button" onClick={() => setLogExportFormat('pdf')}>PDF</button>
                    </div>
                    <div className="security-whitelist-log-date-range">
                      <input className="form-control form-control-sm" type="datetime-local" value={logExportStart} onChange={(event) => setLogExportStart(event.target.value)} disabled={logExportMode === 'all'} aria-label="匯出開始時間" />
                      <span>至</span>
                      <input className="form-control form-control-sm" type="datetime-local" value={logExportEnd} onChange={(event) => setLogExportEnd(event.target.value)} disabled={logExportMode === 'all'} aria-label="匯出結束時間" />
                    </div>
                    <button className="btn btn-sm btn-success" type="button" onClick={downloadLogs}>
                      <i className="bx bx-download me-1"></i>下載紀錄
                    </button>
                    <button className="btn btn-sm btn-outline-danger" type="button" disabled={loading || logs.length === 0} onClick={() => setShowClearLogsModal(true)}>
                      <i className="bx bx-trash me-1"></i>清除紀錄
                    </button>
                  </div>
                  <div className="security-whitelist-log-list">
                    {logs.map((item) => (
                      <article key={item.id} className={`security-whitelist-log-item ${item.decision === 'blocked' ? 'is-blocked' : 'is-allowed'}`}>
                        <div className="security-whitelist-log-flow">
                          <section>
                            <span>來源 IP</span>
                            <code>{item.source_ip}</code>
                          </section>
                          <i className="bx bx-right-arrow-alt"></i>
                          <section>
                            <span>目的地 IP</span>
                            <code>{item.destination_ip}</code>
                          </section>
                        </div>
                        <div className="security-whitelist-log-detail">
                          <span><strong>目的埠</strong>{item.destination_port ?? '-'}</span>
                          <span><strong>協定</strong>{item.protocol.toUpperCase()}</span>
                          <span><strong>狀態</strong><em className={item.decision === 'allowed' ? 'is-allowed' : 'is-blocked'}>{decisionLabel(item.decision)}</em></span>
                          <span><strong>持續時間</strong>{formatDuration(item.duration_secs)}</span>
                        </div>
                        <div className="security-whitelist-log-time">
                          <span>開始：{item.start_time}</span>
                          <span>結束：{item.end_time || '尚在觀察'}</span>
                          <span>最後看見：{item.last_seen}</span>
                        </div>
                        <div className="security-whitelist-log-bottom">
                          <div className="security-whitelist-note">{item.note || '無備註'}</div>
                          <div className="security-whitelist-item-actions">
                            <button className="btn btn-sm btn-outline-success" type="button" onClick={() => allowLogIp(item)}>允許</button>
                            <button className="btn btn-sm btn-outline-warning" type="button" onClick={() => blockLogIp(item)}>維持阻擋</button>
                          </div>
                        </div>
                      </article>
                    ))}
                    {!logs.length && (
                      <div className="security-whitelist-empty">
                        <i className="bx bx-history"></i>
                        <strong>尚無連線紀錄</strong>
                        <span>頁面開啟時會自動同步，目前尚未觀察到連線。</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {showClearLogsModal && (
            <div className="security-whitelist-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowClearLogsModal(false) }}>
              <div className="security-whitelist-modal" role="dialog" aria-modal="true" aria-labelledby="securityWhitelistClearLogsTitle">
                <div className="security-whitelist-modal-header is-danger">
                  <div>
                    <strong id="securityWhitelistClearLogsTitle">清除連線紀錄 Log</strong>
                    <span>此動作只會清空連線紀錄，不會刪除白名單規則與防護設定。</span>
                  </div>
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowClearLogsModal(false)} aria-label="關閉"><i className="bx bx-x"></i></button>
                </div>
                <div className="security-whitelist-form">
                  <div className="security-whitelist-modal-alert" role="alert">
                    <i className="bx bx-error-circle"></i>
                    <span>清除後將無法從頁面復原這些歷史紀錄。若需要保留稽核資料，請先使用「下載紀錄」匯出 CSV 或 PDF。</span>
                  </div>
                  <p className="mb-0 text-muted">目前準備清除 <strong className="text-danger">{logs.length}</strong> 筆連線紀錄。</p>
                </div>
                <div className="security-whitelist-modal-actions">
                  <button type="button" className="btn btn-outline-secondary" disabled={loading} onClick={() => setShowClearLogsModal(false)}>取消</button>
                  <button type="button" className="btn btn-danger" disabled={loading} onClick={clearLogs}>
                    {loading ? '清除中...' : '執行清除'}
                  </button>
                </div>
              </div>
            </div>
          )}
          {showAddModal && (
            <div className="security-whitelist-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowAddModal(false) }}>
              <div className="security-whitelist-modal" role="dialog" aria-modal="true" aria-labelledby="securityWhitelistAddTitle">
                <div className="security-whitelist-modal-header">
                  <div>
                    <strong id="securityWhitelistAddTitle">{editingIp ? '編輯白名單規則' : '新增白名單規則'}</strong>
                    <span>可設定來源 IP / CIDR，也可限制 TCP 或 UDP 的目的 Port 範圍。</span>
                  </div>
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { setShowAddModal(false); setEditingIp(null); setModalError('') }} aria-label="關閉"><i className="bx bx-x"></i></button>
                </div>
                <div className="security-whitelist-form">
                  {modalError && (
                    <div className="security-whitelist-modal-alert" role="alert">
                      <i className="bx bx-error-circle"></i>
                      <span>{modalError}</span>
                    </div>
                  )}
                  <label className="form-label" htmlFor="secWhitelistIp">IP / CIDR</label>
                  <input id="secWhitelistIp" className={`form-control font-monospace ${ipRangeError ? 'is-invalid' : ''}`} value={ipAddress} onChange={(event) => { setIpAddress(event.target.value); setModalError('') }} placeholder="172.23.23.1、10.20.100.0/24 或 172.23.23.10 - 172.23.23.110" autoFocus={!editingIp} />
                  <div className={ipRangeError ? 'invalid-feedback d-block' : 'form-text'}>
                    {ipRangeError || '可輸入單一 IP、CIDR，或 IPv4 範圍。一次性設定範圍不可大於 100，且 IP 前三碼必須相同。'}
                  </div>
                  <div className="security-whitelist-port-grid">
                    <div>
                      <label className="form-label" htmlFor="secWhitelistProtocol">協定</label>
                      <select id="secWhitelistProtocol" className="form-select" value={protocol} onChange={(event) => { setProtocol(event.target.value); setModalError('') }}>
                        <option value="all">ALL - 不限制協定</option>
                        <option value="tcp">TCP</option>
                        <option value="udp">UDP</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label" htmlFor="secWhitelistPortStart">Port 起始</label>
                      <input id="secWhitelistPortStart" className="form-control font-monospace" inputMode="numeric" value={portStart} onChange={(event) => { setPortStart(event.target.value); setModalError('') }} placeholder="例如 10000" disabled={protocol === 'all'} />
                    </div>
                    <div>
                      <label className="form-label" htmlFor="secWhitelistPortEnd">Port 結束</label>
                      <input id="secWhitelistPortEnd" className="form-control font-monospace" inputMode="numeric" value={portEnd} onChange={(event) => { setPortEnd(event.target.value); setModalError('') }} placeholder="例如 20000" disabled={protocol === 'all'} />
                    </div>
                  </div>
                  <div className="form-text mt-1">
                    {protocol === 'all' ? 'ALL 會允許此來源 IP / CIDR 的全部協定與 Port。' : 'Port 可留空代表該協定全部 Port；只填一欄時會視為單一 Port。'}
                  </div>
                  <label className="form-label mt-2" htmlFor="secWhitelistNote">備註</label>
                  <textarea id="secWhitelistNote" className="form-control" rows={3} value={note} onChange={(event) => { setNote(event.target.value); setModalError('') }} placeholder="例如：主管筆電、維運主機、測試網段" />
                  <div className="form-check form-switch mt-3">
                    <input className="form-check-input" type="checkbox" id="secWhitelistEnabled" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
                    <label className="form-check-label" htmlFor="secWhitelistEnabled">{editingIp ? '啟用此規則' : '新增後啟用'}</label>
                  </div>
                </div>
                <div className="security-whitelist-modal-actions">
                  <button className="btn btn-outline-secondary" type="button" onClick={() => { setShowAddModal(false); setEditingIp(null); setModalError('') }}>取消</button>
                  <button className="btn btn-primary" type="button" disabled={loading} onClick={saveIp}>
                    <i className="bx bx-plus-circle me-1"></i>{editingIp ? '儲存修改' : '新增 / 更新'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
