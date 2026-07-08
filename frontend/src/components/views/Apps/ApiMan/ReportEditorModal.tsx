import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import 'reportbro-designer/dist/reportbro.css'
import { ReportBro } from 'reportbro-designer'
import { getApiBase } from '../../../../utils/api'

export type ReportRecord = {
  id: number
  name: string
  description: string
  report_xml: string
  created_at: string
  updated_at: string
}

type Props = {
  record: ReportRecord | null
  visible: boolean
  onSaved: () => void
  onClose: () => void
}

type ReportBroInstance = {
  getReport: () => Record<string, unknown>
  load: (report: Record<string, unknown>) => void
  save: () => void
  destroy?: () => void
}

async function reportApi<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const base = getApiBase()
  const url = base.includes('localhost:10002') || base.includes('127.0.0.1:10002')
    ? path
    : `${base}${path}`
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  const json = await res.json()
  if (!res.ok || json.code !== 0) {
    throw new Error(json.msg || `HTTP ${res.status}`)
  }
  return json.data as T
}

function parseStoredReport(raw: string | null | undefined): Record<string, unknown> | null {
  if (!raw?.trim()) return null
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null
  } catch {
    return null
  }
}

export default function ReportEditorModal({ record, visible, onSaved, onClose }: Props) {
  const wrapperId = useMemo(() => `rbro-wrapper-${Date.now()}-${Math.random().toString(36).slice(2)}`, [])
  const reportRef = useRef<ReportBroInstance | null>(null)
  const [name, setName] = useState(record?.name || '')
  const [description, setDescription] = useState(record?.description || '')
  const [busy, setBusy] = useState(false)
  const [errMsg, setErrMsg] = useState('')
  const [ready, setReady] = useState(false)
  const [legacyNotice, setLegacyNotice] = useState('')

  useEffect(() => {
    if (!visible) return
    setName(record?.name || '')
    setDescription(record?.description || '')
    setErrMsg('')
    setLegacyNotice('')
    setReady(false)
  }, [visible, record?.id, record?.name, record?.description])

  useEffect(() => {
    if (!visible) return
    let isMounted = true
    let instance: ReportBroInstance | null = null
    let containerEl: HTMLDivElement | null = null
    const timeout = setTimeout(async () => {
      const wrapper = document.getElementById(wrapperId)
      if (!wrapper || !isMounted) return
      containerEl = document.createElement('div')
      containerEl.style.cssText = 'width:100%;height:100%;overflow:auto;'
      wrapper.appendChild(containerEl)
      try {
        if (!isMounted) return
        instance = new ReportBro(containerEl, {
          menuShowButtonLabels: true,
          saveCallback: () => undefined,
          reportServerUrl: '',
        }) as ReportBroInstance
        reportRef.current = instance
        if (record?.report_xml) {
          const report = parseStoredReport(record.report_xml)
          if (report) {
            try { instance.load(report) } catch (err) {
              setLegacyNotice(`既有 Report 資料無法載入設計器：${err instanceof Error ? err.message : String(err)}`)
            }
          } else {
            setLegacyNotice('既有資料不是 ReportBro JSON 格式，已開啟空白設計器；儲存後會轉為新版格式。')
          }
        }
        setReady(true)
      } catch (err) {
        if (isMounted) setErrMsg(err instanceof Error ? err.message : String(err))
      }
    }, 50)
    return () => {
      isMounted = false; clearTimeout(timeout)
      if (instance && typeof instance.destroy === 'function') try { instance.destroy() } catch { /* ignore */ }
      if (containerEl && containerEl.parentNode) containerEl.parentNode.removeChild(containerEl)
      reportRef.current = null
      setReady(false)
    }
  }, [visible, record?.id, record?.report_xml, wrapperId])

  const handleSave = async () => {
    if (!name.trim()) {
      setErrMsg('請輸入名稱')
      return
      }
      setBusy(true)
      setErrMsg('')
      try {
      const instance = reportRef.current
      const xml = instance ? JSON.stringify(instance.getReport()) : ''
      const body = {
        name: name.trim(),
        description: description.trim(),
        report_xml: xml,
      }
      if (record) {
        await reportApi(`/api/apiman/reports/${record.id}`, { method: 'PUT', body: JSON.stringify(body) })
      } else {
        await reportApi('/api/apiman/reports', { method: 'POST', body: JSON.stringify(body) })
      }
      onSaved()
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const handleExportXml = useCallback(() => {
    const instance = reportRef.current
    if (!instance) return
    const xml = JSON.stringify(instance.getReport(), null, 2)
    const blob = new Blob([xml], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name.trim() || 'report'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [name])

  if (!visible) return null

  return (
        <div className="card mb-3">
          <div className="card-header py-2 d-flex align-items-center">
            <h6 className="modal-title d-flex align-items-center gap-2">
              <i className="bx bx-file"></i>
              {record ? `編輯 Report #${record.id}` : '新增 Report'}
            </h6>
            <button type="button" className="btn btn-sm btn-outline-secondary ms-auto" onClick={onClose}>
              <i className="bx bx-arrow-back me-1"></i>返回清單
            </button>
          </div>
          <div className="card-body p-2 d-flex flex-column" style={{ height: 'calc(100vh - 220px)', minHeight: 620, overflow: 'hidden' }}>
            <div className="row g-2 mb-2">
              <div className="col-md-5">
                <label className="form-label mb-1" style={{ fontSize: '.7rem' }}>名稱 *</label>
                <input className="form-control form-control-sm" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="col-md-5">
                <label className="form-label mb-1" style={{ fontSize: '.7rem' }}>描述</label>
                <input className="form-control form-control-sm" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                {ready ? (
                  <span className="badge bg-label-success">已載入</span>
                ) : (
                  <span className="badge bg-label-secondary">載入中…</span>
                )}
              </div>
            </div>
            {errMsg && (
              <div className="alert alert-danger py-1 mb-2" style={{ fontSize: '.75rem' }}>{errMsg}</div>
            )}
            {legacyNotice && (
              <div className="alert alert-warning py-1 mb-2" style={{ fontSize: '.75rem' }}>{legacyNotice}</div>
            )}
            <div
              id={wrapperId}
              style={{
                flexGrow: 1,
                minHeight: 480,
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 4,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {!ready && !errMsg && (
                <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                  <i className="bx bx-loader-alt bx-spin me-2"></i>ReportBro Designer 載入中…
                </div>
              )}
            </div>
          </div>
          <div className="card-footer py-2 d-flex align-items-center gap-2 flex-wrap">
            <span className="text-muted me-auto" style={{ fontSize: '.7rem' }}>
                <i className="bx bx-info-circle me-1"></i>ReportBro Designer · 支援 PDF / Excel 報表模板設計，模板以 ReportBro JSON 儲存
            </span>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleExportXml} disabled={!ready}>
              <i className="bx bx-download me-1"></i>匯出 JSON
            </button>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose} disabled={busy}>取消</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleSave} disabled={busy || !ready}>
              <i className="bx bx-save me-1"></i>{busy ? '儲存中…' : '儲存'}
            </button>
          </div>
        </div>
  )
}
