import { useEffect, useMemo, useRef, useState } from 'react'
import { getApiBase } from '../../../../utils/api'
import FormEditorModal, { type FormRecord } from './FormEditorModal'

type NoticeKind = 'success' | 'danger' | 'warning'

async function formApi<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const base = getApiBase()
  const url = base.includes('localhost:10002') || base.includes('127.0.0.1:10002')
    ? path
    : `${base}${path}`
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  const json = await res.json()
  if (!res.ok || json.code !== 0) throw new Error(json.msg || `HTTP ${res.status}`)
  return json.data as T
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatSize(json: string): string {
  return formatBytes(new Blob([json || '']).size)
}

function safeFileName(name: string, ext: string): string {
  const cleaned = (name || 'form').trim().replace(/[\\/:*?"<>|]+/g, '_')
  return `${cleaned || 'form'}.${ext}`
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

function parseFormMeta(json: string): { count: number; required: number; types: Record<string, number>; preview: string } {
  try {
    const parsed = JSON.parse(json || '{}')
    const fields: Array<[string, Record<string, unknown>]> = parsed?.properties && typeof parsed.properties === 'object'
      ? Object.entries<Record<string, unknown>>(parsed.properties)
      : Array.isArray(parsed?.fields)
        ? parsed.fields.map((f: Record<string, unknown>, index: number): [string, Record<string, unknown>] => [`field_${index}`, f])
        : Array.isArray(parsed?.components)
          ? parsed.components.map((f: Record<string, unknown>, index: number): [string, Record<string, unknown>] => [`component_${index}`, f])
          : Array.isArray(parsed)
            ? parsed.map((f: Record<string, unknown>, index: number): [string, Record<string, unknown>] => [`item_${index}`, f])
            : []
    const types: Record<string, number> = {}
    let required = 0
    fields.forEach(([, field]) => {
      const fieldType = typeof field?.type === 'string' ? field.type : 'unknown'
      types[fieldType] = (types[fieldType] || 0) + 1
      if (field?.required) required += 1
    })
    return { count: fields.length, required, types, preview: JSON.stringify(parsed, null, 2) }
  } catch {
    return { count: 0, required: 0, types: {}, preview: json || '' }
  }
}

function uniqueName(base: string, records: FormRecord[]): string {
  const names = new Set(records.map((r) => r.name))
  if (!names.has(base)) return base
  let index = 2
  while (names.has(`${base} ${index}`)) index += 1
  return `${base} ${index}`
}

export default function FormEditorView() {
  const [records, setRecords] = useState<FormRecord[]>([])
  const [editing, setEditing] = useState<FormRecord | null>(null)
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
      const data = await formApi<{ forms: FormRecord[] }>('/api/apiman/forms')
      const next = data.forms || []
      setRecords(next)
      setSelectedId((current) => current && next.some((r) => r.id === current) ? current : next[0]?.id ?? null)
      if (!silent) notify('Form 清單已更新', `${next.length} 筆表單`, 'success')
    } catch (err) {
      notify('Form 載入失敗', err instanceof Error ? err.message : String(err), 'danger')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      setBusy(true)
      try {
        const data = await formApi<{ forms: FormRecord[] }>('/api/apiman/forms')
        if (!isMounted) return
        const next = data.forms || []
        setRecords(next)
        setSelectedId(next[0]?.id ?? null)
      } catch (err) {
        if (isMounted) notify('Form 載入失敗', err instanceof Error ? err.message : String(err), 'danger')
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
  const selectedMeta = useMemo(() => parseFormMeta(selected?.form_schema_json || ''), [selected])
  const totalFields = useMemo(() => records.reduce((sum, r) => sum + parseFormMeta(r.form_schema_json).count, 0), [records])
  const totalBytes = useMemo(() => records.reduce((sum, r) => sum + new Blob([r.form_schema_json || '']).size, 0), [records])
  const latest = records[0]?.updated_at || '—'

  const openNew = () => { setEditing(null); setShowEditor(true); notify('建立 Form', '已開啟表單設計工作台。', 'success') }
  const openEdit = (r: FormRecord) => { setEditing(r); setSelectedId(r.id); setShowEditor(true); notify('編輯 Form', r.name, 'success') }
  const closeEditor = () => { setShowEditor(false); setEditing(null) }
  const handleSaved = async () => { setShowEditor(false); setEditing(null); await load(true); notify('Form 已儲存', '清單與預覽已更新。', 'success') }

  const remove = async (r: FormRecord) => {
    if (!window.confirm(`確認刪除 Form「${r.name}」？`)) return
    setBusy(true)
    try {
      await formApi(`/api/apiman/forms/${r.id}`, { method: 'DELETE' })
      await load(true)
      notify('Form 已刪除', r.name, 'success')
    } catch (err) {
      notify('Form 刪除失敗', err instanceof Error ? err.message : String(err), 'danger')
    } finally {
      setBusy(false)
    }
  }

  const duplicate = async (r: FormRecord) => {
    setBusy(true)
    try {
      const name = uniqueName(`${r.name} copy`, records)
      await formApi('/api/apiman/forms', {
        method: 'POST',
        body: JSON.stringify({ name, description: r.description || '', form_schema_json: r.form_schema_json || '{}' }),
      })
      await load(true)
      notify('Form 已複製', name, 'success')
    } catch (err) {
      notify('Form 複製失敗', err instanceof Error ? err.message : String(err), 'danger')
    } finally {
      setBusy(false)
    }
  }

  const importJson = async (file: File | null) => {
    if (!file) return
    try {
      const content = await file.text()
      JSON.parse(content || '{}')
      const name = uniqueName(file.name.replace(/\.json$/i, '') || 'Imported Form', records)
      await formApi('/api/apiman/forms', {
        method: 'POST',
        body: JSON.stringify({ name, description: `Imported from ${file.name}`, form_schema_json: content }),
      })
      await load(true)
      notify('Form 已匯入', name, 'success')
    } catch (err) {
      notify('Form 匯入失敗', err instanceof Error ? err.message : String(err), 'danger')
    } finally {
      if (importRef.current) importRef.current.value = ''
    }
  }

  const renderList = () => (
    <>
      <div className="row g-2 mb-3">
        <div className="col-md-3"><div className="card h-100"><div className="card-body p-3"><div className="text-muted small">表單數</div><div className="fs-4 fw-semibold">{records.length}</div></div></div></div>
        <div className="col-md-3"><div className="card h-100"><div className="card-body p-3"><div className="text-muted small">欄位總數</div><div className="fs-4 fw-semibold">{totalFields}</div></div></div></div>
        <div className="col-md-3"><div className="card h-100"><div className="card-body p-3"><div className="text-muted small">Schema 容量</div><div className="fs-5 fw-semibold">{formatBytes(totalBytes)}</div></div></div></div>
        <div className="col-md-3"><div className="card h-100"><div className="card-body p-3"><div className="text-muted small">最後更新</div><div className="fw-semibold text-truncate" style={{ fontSize: '.8rem' }}>{latest}</div></div></div></div>
      </div>

      <div className="row g-3">
        <div className="col-lg-7">
          <div className="card h-100">
            <div className="card-header py-2 d-flex align-items-center flex-wrap gap-2">
              <i className="bx bx-list-check me-1"></i>
              <strong style={{ fontSize: '.875rem' }}>Form 表單清單</strong>
              <div className="ms-auto d-flex align-items-center gap-2 flex-wrap">
                <input
                  ref={importRef}
                  type="file"
                  accept=".json,application/json"
                  className="d-none"
                  onChange={(e) => importJson(e.target.files?.[0] || null)}
                />
                <button className="btn btn-sm btn-outline-secondary" onClick={() => load()} disabled={busy} type="button"><i className="bx bx-refresh me-1"></i>重新整理</button>
                <button className="btn btn-sm btn-outline-info" onClick={() => importRef.current?.click()} disabled={busy} type="button"><i className="bx bx-upload me-1"></i>匯入 JSON</button>
                <button className="btn btn-sm btn-primary" onClick={openNew} disabled={busy} type="button"><i className="bx bx-plus me-1"></i>新增 Form</button>
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
                      <th className="text-nowrap">欄位數</th>
                      <th className="text-nowrap">必要</th>
                      <th className="text-nowrap">大小</th>
                      <th className="text-end">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={6} className="text-center text-muted py-4">{records.length === 0 ? '尚無 Form，點擊「新增 Form」開始設計。' : '目前篩選條件下沒有資料。'}</td></tr>
                    ) : filtered.map((r) => {
                      const meta = parseFormMeta(r.form_schema_json)
                      return (
                        <tr
                          key={r.id}
                          className={selected?.id === r.id ? 'table-active' : ''}
                          onClick={() => setSelectedId(r.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td className="fw-semibold text-nowrap">{r.name}</td>
                          <td className="text-muted">{r.description || '—'}</td>
                          <td><span className="badge bg-label-info">{meta.count}</span></td>
                          <td><span className="badge bg-label-warning">{meta.required}</span></td>
                          <td className="text-muted text-nowrap" style={{ fontSize: '.75rem' }}>{formatSize(r.form_schema_json)}</td>
                          <td className="text-end" onClick={(e) => e.stopPropagation()}>
                            <div className="btn-group btn-group-sm">
                              <button className="btn btn-outline-primary" onClick={() => openEdit(r)} title="編輯" type="button"><i className="bx bx-edit"></i></button>
                              <button className="btn btn-outline-secondary" onClick={() => duplicate(r)} title="複製" type="button"><i className="bx bx-copy"></i></button>
                              <button className="btn btn-outline-info" onClick={() => { downloadText(safeFileName(r.name, 'json'), r.form_schema_json, 'application/json'); notify('Form JSON 已下載', r.name, 'success') }} title="下載 JSON" type="button"><i className="bx bx-download"></i></button>
                              <button className="btn btn-outline-danger" onClick={() => remove(r)} title="刪除" type="button"><i className="bx bx-trash"></i></button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
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
              <strong style={{ fontSize: '.875rem' }}>Schema 預覽 / 動作</strong>
            </div>
            <div className="card-body p-3">
              {!selected ? (
                <div className="text-center text-muted py-5">請選擇一個 Form 或建立新的表單。</div>
              ) : (
                <>
                  <div className="d-flex align-items-start gap-2 mb-3">
                    <div className="rounded bg-label-primary d-flex align-items-center justify-content-center" style={{ width: 42, height: 42 }}>
                      <i className="bx bx-list-check fs-4"></i>
                    </div>
                    <div className="min-w-0">
                      <div className="fw-semibold text-truncate">{selected.name}</div>
                      <div className="text-muted small">{selected.description || '無描述'}</div>
                      <div className="text-muted" style={{ fontSize: '.72rem' }}>更新時間：{selected.updated_at}</div>
                    </div>
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-4"><div className="border rounded p-2"><div className="text-muted small">欄位</div><strong>{selectedMeta.count}</strong></div></div>
                    <div className="col-4"><div className="border rounded p-2"><div className="text-muted small">必填</div><strong>{selectedMeta.required}</strong></div></div>
                    <div className="col-4"><div className="border rounded p-2"><div className="text-muted small">大小</div><strong>{formatSize(selected.form_schema_json)}</strong></div></div>
                  </div>
                  <div className="mb-3 d-flex flex-wrap gap-1">
                    {Object.keys(selectedMeta.types).length === 0 ? (
                      <span className="badge bg-label-secondary">無欄位類型</span>
                    ) : Object.entries(selectedMeta.types).map(([type, count]) => (
                      <span key={type} className="badge bg-label-secondary">{type}: {count}</span>
                    ))}
                  </div>
                  <div className="d-flex gap-2 flex-wrap mb-3">
                    <button className="btn btn-sm btn-primary" type="button" onClick={() => openEdit(selected)}><i className="bx bx-edit me-1"></i>開啟設計器</button>
                    <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => duplicate(selected)}><i className="bx bx-copy me-1"></i>複製</button>
                    <button className="btn btn-sm btn-outline-info" type="button" onClick={() => { downloadText(safeFileName(selected.name, 'json'), selected.form_schema_json, 'application/json'); notify('Form JSON 已下載', selected.name, 'success') }}><i className="bx bx-download me-1"></i>下載</button>
                    <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => remove(selected)}><i className="bx bx-trash me-1"></i>刪除</button>
                  </div>
                  <label className="form-label small text-muted">JSON Schema 摘要</label>
                  <pre className="border rounded bg-light p-2 mb-0" style={{ minHeight: 260, maxHeight: 360, overflow: 'auto', fontSize: '.72rem', whiteSpace: 'pre-wrap' }}>
                    {(selectedMeta.preview || '尚無 JSON 內容').slice(0, 2200)}
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
      <div id="formEditorView" style={{ display: 'none' }}>
        {showEditor ? (
          <FormEditorModal
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
