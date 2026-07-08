import { useEffect, useMemo, useRef, useState } from 'react'
import { getApiBase } from '../../../../utils/api'
import ReportEditorModal, { type ReportRecord } from './ReportEditorModal'

type NoticeKind = 'success' | 'danger' | 'warning'

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

function formatSize(text: string): string {
  return formatBytes(new Blob([text || '']).size)
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function safeFileName(name: string, ext: string): string {
  const cleaned = (name || 'report').trim().replace(/[\\/:*?"<>|]+/g, '_')
  return `${cleaned || 'report'}.${ext}`
}

function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content || ''], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function countReportElements(content: string): number {
  if (!content?.trim()) return 0
  try {
    const parsed = JSON.parse(content)
    const docElements = Array.isArray(parsed?.docElements) ? parsed.docElements.length : 0
    const parameters = Array.isArray(parsed?.parameters) ? parsed.parameters.length : 0
    const styles = Array.isArray(parsed?.styles) ? parsed.styles.length : 0
    return docElements + parameters + styles
  } catch {
    return (content.match(/<(section|band|text|image|line|table|barcode|frame)\b/gi) || []).length
  }
}

function uniqueName(base: string, records: ReportRecord[]): string {
  const names = new Set(records.map((r) => r.name))
  if (!names.has(base)) return base
  let index = 2
  while (names.has(`${base} ${index}`)) index += 1
  return `${base} ${index}`
}

export default function ReportView() {
  const [records, setRecords] = useState<ReportRecord[]>([])
  const [editing, setEditing] = useState<ReportRecord | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ title: string; detail?: string; kind: NoticeKind } | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const importRef = useRef<HTMLInputElement | null>(null)

  const notify = (title: string, detail?: string, kind: NoticeKind = 'success') => {
    setNotice({ title, detail, kind })
    window.setTimeout(() => setNotice(null), 3600)
  }

  const load = async (silent = false) => {
    setBusy(true)
    try {
      const data = await reportApi<{ reports: ReportRecord[] }>('/api/apiman/reports')
      const next = data.reports || []
      setRecords(next)
      setSelectedId((current) => current && next.some((r) => r.id === current) ? current : next[0]?.id ?? null)
      if (!silent) notify('Report 清單已更新', `${next.length} 筆報表模板`, 'success')
    } catch (err) {
      notify('Report 載入失敗', err instanceof Error ? err.message : String(err), 'danger')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      setBusy(true)
      try {
        const data = await reportApi<{ reports: ReportRecord[] }>('/api/apiman/reports')
        if (!isMounted) return
        const next = data.reports || []
        setRecords(next)
        setSelectedId(next[0]?.id ?? null)
      } catch (err) {
        if (isMounted) notify('Report 載入失敗', err instanceof Error ? err.message : String(err), 'danger')
      } finally {
        if (isMounted) setBusy(false)
      }
    })()
    return () => { isMounted = false }
  }, [])

  const filtered = useMemo(() => records.filter((r) => {
    if (!search) return true
    const q = search.toLowerCase()
    return r.name.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q)
  }), [records, search])

  const selected = useMemo(
    () => records.find((r) => r.id === selectedId) || filtered[0] || null,
    [filtered, records, selectedId],
  )

  const totalBytes = useMemo(() => records.reduce((sum, r) => sum + new Blob([r.report_xml || '']).size, 0), [records])
  const latest = records[0]?.updated_at || '—'

  const openNew = () => { setEditing(null); setShowEditor(true); notify('建立 Report', '已開啟報表設計工作台。', 'success') }
  const openEdit = (r: ReportRecord) => { setEditing(r); setSelectedId(r.id); setShowEditor(true); notify('編輯 Report', r.name, 'success') }
  const closeEditor = () => { setShowEditor(false); setEditing(null) }

  const handleSaved = async () => {
    setShowEditor(false)
    setEditing(null)
    await load(true)
    notify('Report 已儲存', '清單與預覽已更新。', 'success')
  }

  const remove = async (r: ReportRecord) => {
    if (!window.confirm(`確認刪除 Report「${r.name}」？`)) return
    setBusy(true)
    try {
      await reportApi(`/api/apiman/reports/${r.id}`, { method: 'DELETE' })
      await load(true)
      notify('Report 已刪除', r.name, 'success')
    } catch (err) {
      notify('Report 刪除失敗', err instanceof Error ? err.message : String(err), 'danger')
    } finally {
      setBusy(false)
    }
  }

  const duplicate = async (r: ReportRecord) => {
    setBusy(true)
    try {
      const name = uniqueName(`${r.name} copy`, records)
      await reportApi('/api/apiman/reports', {
        method: 'POST',
        body: JSON.stringify({ name, description: r.description || '', report_xml: r.report_xml || '' }),
      })
      await load(true)
      notify('Report 已複製', name, 'success')
    } catch (err) {
      notify('Report 複製失敗', err instanceof Error ? err.message : String(err), 'danger')
    } finally {
      setBusy(false)
    }
  }

  const importTemplate = async (file: File | null) => {
    if (!file) return
    try {
      const content = await file.text()
      if (!content.trim()) throw new Error('模板內容不可為空')
      if (/\.json$/i.test(file.name)) JSON.parse(content)
      const name = uniqueName(file.name.replace(/\.(xml|json)$/i, '') || 'Imported Report', records)
      await reportApi('/api/apiman/reports', {
        method: 'POST',
        body: JSON.stringify({ name, description: `Imported from ${file.name}`, report_xml: content }),
      })
      await load(true)
      notify('Report 已匯入', name, 'success')
    } catch (err) {
      notify('Report 匯入失敗', err instanceof Error ? err.message : String(err), 'danger')
    } finally {
      if (importRef.current) importRef.current.value = ''
    }
  }

  const renderList = () => (
    <>
      <div className="row g-2 mb-3">
        <div className="col-md-3">
          <div className="card h-100"><div className="card-body p-3">
            <div className="text-muted small">報表模板</div>
            <div className="fs-4 fw-semibold">{records.length}</div>
          </div></div>
        </div>
        <div className="col-md-3">
          <div className="card h-100"><div className="card-body p-3">
            <div className="text-muted small">模板總容量</div>
            <div className="fs-5 fw-semibold">{formatBytes(totalBytes)}</div>
          </div></div>
        </div>
        <div className="col-md-3">
          <div className="card h-100"><div className="card-body p-3">
            <div className="text-muted small">目前選取</div>
            <div className="fw-semibold text-truncate">{selected?.name || '尚未選取'}</div>
          </div></div>
        </div>
        <div className="col-md-3">
          <div className="card h-100"><div className="card-body p-3">
            <div className="text-muted small">最後更新</div>
            <div className="fw-semibold text-truncate" style={{ fontSize: '.8rem' }}>{latest}</div>
          </div></div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-7">
          <div className="card h-100">
            <div className="card-header py-2 d-flex align-items-center flex-wrap gap-2">
              <i className="bx bx-file me-1"></i>
              <strong style={{ fontSize: '.875rem' }}>Report 報表清單</strong>
              <div className="ms-auto d-flex align-items-center gap-2 flex-wrap">
                <input
                  ref={importRef}
                  type="file"
                  accept=".json,.xml,application/json,application/xml,text/xml"
                  className="d-none"
                  onChange={(e) => importTemplate(e.target.files?.[0] || null)}
                />
                <button className="btn btn-sm btn-outline-secondary" onClick={() => load()} disabled={busy} type="button">
                  <i className="bx bx-refresh me-1"></i>重新整理
                </button>
                <button className="btn btn-sm btn-outline-info" onClick={() => importRef.current?.click()} disabled={busy} type="button">
                  <i className="bx bx-upload me-1"></i>匯入模板
                </button>
                <button className="btn btn-sm btn-primary" onClick={openNew} disabled={busy} type="button">
                  <i className="bx bx-plus me-1"></i>新增 Report
                </button>
              </div>
            </div>
            <div className="card-body p-2">
              <input
                type="text"
                className="form-control form-control-sm mb-2"
                placeholder="搜尋名稱 / 描述"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="table-responsive" style={{ maxHeight: 520 }}>
                <table className="table table-sm table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>名稱</th>
                      <th>描述</th>
                      <th className="text-nowrap">元素</th>
                      <th className="text-nowrap">大小</th>
                      <th className="text-end">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={5} className="text-center text-muted py-4">{records.length === 0 ? '尚無 Report，點擊「新增 Report」開始設計。' : '目前篩選條件下沒有資料。'}</td></tr>
                    ) : filtered.map((r) => (
                      <tr
                        key={r.id}
                        className={selected?.id === r.id ? 'table-active' : ''}
                        onClick={() => setSelectedId(r.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="fw-semibold text-nowrap">{r.name}</td>
                        <td className="text-muted">{r.description || '—'}</td>
                        <td><span className="badge bg-label-info">{countReportElements(r.report_xml)}</span></td>
                        <td className="text-muted text-nowrap" style={{ fontSize: '.75rem' }}>{formatSize(r.report_xml)}</td>
                        <td className="text-end" onClick={(e) => e.stopPropagation()}>
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-outline-primary" onClick={() => openEdit(r)} title="編輯" type="button"><i className="bx bx-edit"></i></button>
                            <button className="btn btn-outline-secondary" onClick={() => duplicate(r)} title="複製" type="button"><i className="bx bx-copy"></i></button>
                            <button className="btn btn-outline-info" onClick={() => { downloadText(safeFileName(r.name, 'json'), r.report_xml, 'application/json'); notify('Report 模板已下載', r.name, 'success') }} title="下載模板" type="button"><i className="bx bx-download"></i></button>
                            <button className="btn btn-outline-danger" onClick={() => remove(r)} title="刪除" type="button"><i className="bx bx-trash"></i></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card h-100">
            <div className="card-header py-2 d-flex align-items-center">
              <i className="bx bx-show me-2"></i>
              <strong style={{ fontSize: '.875rem' }}>模板預覽 / 動作</strong>
            </div>
            <div className="card-body p-3">
              {!selected ? (
                <div className="text-center text-muted py-5">請選擇一個 Report 或建立新的模板。</div>
              ) : (
                <>
                  <div className="d-flex align-items-start gap-2 mb-3">
                    <div className="rounded bg-label-primary d-flex align-items-center justify-content-center" style={{ width: 42, height: 42 }}>
                      <i className="bx bx-file fs-4"></i>
                    </div>
                    <div className="min-w-0">
                      <div className="fw-semibold text-truncate">{selected.name}</div>
                      <div className="text-muted small">{selected.description || '無描述'}</div>
                      <div className="text-muted" style={{ fontSize: '.72rem' }}>更新時間：{selected.updated_at}</div>
                    </div>
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6"><div className="border rounded p-2"><div className="text-muted small">元素數</div><strong>{countReportElements(selected.report_xml)}</strong></div></div>
                    <div className="col-6"><div className="border rounded p-2"><div className="text-muted small">模板大小</div><strong>{formatSize(selected.report_xml)}</strong></div></div>
                  </div>
                  <div className="d-flex gap-2 flex-wrap mb-3">
                    <button className="btn btn-sm btn-primary" type="button" onClick={() => openEdit(selected)}><i className="bx bx-edit me-1"></i>開啟設計器</button>
                    <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => duplicate(selected)}><i className="bx bx-copy me-1"></i>複製</button>
                    <button className="btn btn-sm btn-outline-info" type="button" onClick={() => { downloadText(safeFileName(selected.name, 'json'), selected.report_xml, 'application/json'); notify('Report 模板已下載', selected.name, 'success') }}><i className="bx bx-download me-1"></i>下載</button>
                    <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => remove(selected)}><i className="bx bx-trash me-1"></i>刪除</button>
                  </div>
                  <label className="form-label small text-muted">模板資料摘要</label>
                  <pre className="border rounded bg-light p-2 mb-0" style={{ minHeight: 260, maxHeight: 360, overflow: 'auto', fontSize: '.72rem', whiteSpace: 'pre-wrap' }}>
                    {(selected.report_xml || '尚無模板內容').slice(0, 1800)}
                  </pre>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      <div id="reportEditorView" style={{ display: 'none' }}>
        {showEditor ? (
          <ReportEditorModal
            record={editing}
            onSaved={handleSaved}
            onClose={closeEditor}
            visible={showEditor}
          />
        ) : renderList()}
      </div>
      {notice && (
        <div
          className={`alert alert-${notice.kind === 'danger' ? 'danger' : notice.kind === 'warning' ? 'warning' : 'success'} shadow-lg`}
          style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 3000, minWidth: 320, maxWidth: 460, borderWidth: 0 }}
        >
          <div className="fw-semibold">{notice.title}</div>
          {notice.detail && <div className="small mt-1">{notice.detail}</div>}
        </div>
      )}
    </>
  )
}
