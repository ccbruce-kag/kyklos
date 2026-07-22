import { useEffect, useMemo, useState } from 'react'
import { apiGet, apiPost } from '../../../utils/api'

type WhitelistSettings = {
  enabled: boolean
  updated_at: string
}

type WhitelistIp = {
  id: number
  ip_address: string
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

export default function SecurityView() {
  const [settings, setSettings] = useState<WhitelistSettings>({ enabled: false, updated_at: '' })
  const [ips, setIps] = useState<WhitelistIp[]>([])
  const [logs, setLogs] = useState<WhitelistLog[]>([])
  const [ipAddress, setIpAddress] = useState('')
  const [note, setNote] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingIp, setEditingIp] = useState<WhitelistIp | null>(null)
  const [modalError, setModalError] = useState('')

  const enabledIpCount = useMemo(() => ips.filter((item) => item.enabled).length, [ips])
  const blockedCount = useMemo(() => logs.filter((item) => item.decision === 'blocked').length, [logs])

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

  async function saveIp() {
    if (!ipAddress.trim()) {
      const message = '可輸入單一 IP 或 CIDR，例如 10.20.100.103 或 10.20.100.0/24'
      if (showAddModal) setModalError(message)
      else showSecurityToast('請輸入白名單 IP', message, undefined, true)
      return
    }
    setModalError('')
    setLoading(true)
    try {
      const res = await apiPost<WhitelistIp>('/security/whitelist/ips', {
        ip_address: ipAddress.trim(),
        enabled,
        note,
      })
      if (res.code !== 0) throw new Error(res.msg)
      setIpAddress('')
      setNote('')
      setEnabled(true)
      setShowAddModal(false)
      setEditingIp(null)
      setModalError('')
      await loadWhitelist(true)
      showSecurityToast(editingIp ? '白名單 IP 已更新' : '白名單 IP 已儲存', res.data.ip_address, res.data.note)
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
      showSecurityToast(next ? '白名單 IP 已啟用' : '白名單 IP 已停用', item.ip_address)
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

  async function refreshLogs() {
    setLoading(true)
    try {
      const res = await apiPost<{ refreshed: number; logs: WhitelistLog[] }>('/security/whitelist/logs/refresh', {})
      if (res.code !== 0) throw new Error(res.msg)
      setLogs(res.data.logs || [])
      showSecurityToast('連線紀錄已同步', `本次觀察到 ${res.data.refreshed} 筆目前連線`)
    } catch (err) {
      showSecurityToast('連線紀錄同步失敗', err instanceof Error ? err.message : String(err), undefined, true)
    } finally {
      setLoading(false)
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

  function openAddIpModal() {
    setIpAddress('')
    setNote('')
    setEnabled(true)
    setEditingIp(null)
    setModalError('')
    setShowAddModal(true)
  }

  function openEditIpModal(item: WhitelistIp) {
    setIpAddress(item.ip_address)
    setNote(item.note || '')
    setEnabled(item.enabled)
    setEditingIp(item)
    setModalError('')
    setShowAddModal(true)
  }

  return (
    <div id="securityView" className="security-view" style={{ display: 'none' }}>
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
                    <small>目前可通過的 IP / CIDR</small>
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
                      <span>手動允許的來源 IP / CIDR，可編輯、啟用停用或刪除。</span>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className="badge bg-label-primary">{ips.length} 筆</span>
                    <button className="btn btn-sm btn-primary" type="button" disabled={loading} onClick={openAddIpModal}>
                      <i className="bx bx-plus-circle me-1"></i>新增白名單 IP
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
                        <strong>尚未建立白名單 IP</strong>
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
                      <span>來源 IP 可直接改為允許或維持阻擋。</span>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <button className="btn btn-sm btn-outline-primary" type="button" disabled={loading} onClick={refreshLogs}>
                      <i className="bx bx-history me-1"></i>同步連線紀錄
                    </button>
                  </div>
                </div>
                <div className="card-body">
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
                        <span>請按右上方「同步連線紀錄」。</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {showAddModal && (
            <div className="security-whitelist-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowAddModal(false) }}>
              <div className="security-whitelist-modal" role="dialog" aria-modal="true" aria-labelledby="securityWhitelistAddTitle">
                <div className="security-whitelist-modal-header">
                  <div>
                    <strong id="securityWhitelistAddTitle">{editingIp ? '編輯白名單 IP' : '新增白名單 IP'}</strong>
                    <span>{editingIp ? '編輯時 IP / CIDR 固定，避免誤產生重複白名單。' : '可輸入單一 IP 或 CIDR 網段'}</span>
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
                  <input id="secWhitelistIp" className="form-control font-monospace" value={ipAddress} onChange={(event) => { setIpAddress(event.target.value); setModalError('') }} placeholder="10.20.100.103 或 10.20.100.0/24" disabled={!!editingIp} autoFocus={!editingIp} />
                  <label className="form-label mt-2" htmlFor="secWhitelistNote">備註</label>
                  <textarea id="secWhitelistNote" className="form-control" rows={3} value={note} onChange={(event) => { setNote(event.target.value); setModalError('') }} placeholder="例如：主管筆電、維運主機、測試網段" />
                  <div className="form-check form-switch mt-3">
                    <input className="form-check-input" type="checkbox" id="secWhitelistEnabled" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
                    <label className="form-check-label" htmlFor="secWhitelistEnabled">{editingIp ? '啟用此 IP' : '新增後啟用'}</label>
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
