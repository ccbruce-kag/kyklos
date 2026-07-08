import { useEffect, useMemo, useRef, useState } from 'react'
import { getApiBase } from '../../../../utils/api'
import WireframeEditorModal, { type WireframeRecord } from './WireframeEditorModal'

async function wireframeApi<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
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

function countElements(sceneJson: string): number {
  try {
    const obj = JSON.parse(sceneJson || '{}')
    if (Array.isArray(obj)) return obj.length
    if (obj && typeof obj === 'object' && Array.isArray(obj.elements)) return obj.elements.length
    return 0
  } catch {
    return 0
  }
}

function parseScene(sceneJson: string): { elements: Array<Record<string, unknown>>; appState: Record<string, unknown> } {
  try {
    const obj = JSON.parse(sceneJson || '{}')
    if (Array.isArray(obj)) return { elements: obj as Array<Record<string, unknown>>, appState: {} }
    if (obj && typeof obj === 'object') {
      const record = obj as Record<string, unknown>
      return {
        elements: Array.isArray(record.elements) ? (record.elements as Array<Record<string, unknown>>) : [],
        appState: record.appState && typeof record.appState === 'object' ? (record.appState as Record<string, unknown>) : {},
      }
    }
  } catch { /* ignore */ }
  return { elements: [], appState: {} }
}

function activeElements(sceneJson: string): Array<Record<string, unknown>> {
  return parseScene(sceneJson).elements.filter((item) => !item.isDeleted)
}

function sceneTypeCounts(sceneJson: string): Record<string, number> {
  return activeElements(sceneJson).reduce<Record<string, number>>((acc, item) => {
    const type = typeof item.type === 'string' ? item.type : 'unknown'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {})
}

function downloadText(filename: string, content: string, type = 'application/json') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function safeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, '_')
}

function formatSize(sceneJson: string): string {
  const bytes = new Blob([sceneJson || '']).size
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function WireframeView() {
  const [records, setRecords] = useState<WireframeRecord[]>([])
  const [editing, setEditing] = useState<WireframeRecord | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgKind, setMsgKind] = useState<'success' | 'danger'>('danger')
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState<{ title: string; detail?: string; kind: 'success' | 'danger' | 'warning' } | null>(null)
  const importInputRef = useRef<HTMLInputElement | null>(null)

  const notify = (title: string, detail?: string, kind: 'success' | 'danger' | 'warning' = 'success') => {
    setToast({ title, detail, kind })
    window.setTimeout(() => setToast(null), 3400)
  }

  const load = async () => {
    setBusy(true)
    setMsg('')
    try {
      const data = await wireframeApi<{ wireframes: WireframeRecord[] }>('/api/apiman/wireframes')
      setRecords(data.wireframes || [])
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err))
      setMsgKind('danger')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      setBusy(true)
      setMsg('')
      try {
        const data = await wireframeApi<{ wireframes: WireframeRecord[] }>('/api/apiman/wireframes')
        if (!isMounted) return
        setRecords(data.wireframes || [])
      } catch (err) {
        if (isMounted) {
          setMsg(err instanceof Error ? err.message : String(err))
          setMsgKind('danger')
        }
      } finally {
        if (isMounted) setBusy(false)
      }
    })()
    return () => { isMounted = false }
  }, [])

  const filtered = records.filter((r) => {
    if (!search) return true
    const q = search.toLowerCase()
    return r.name.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q)
  })

  const openNew = () => { setEditing(null); setShowModal(true); notify('Wireframe 新增模式', '請輸入名稱後開始設計。') }
  const openEdit = (r: WireframeRecord) => { setSelectedId(r.id); setEditing(r); setShowModal(true); notify('Wireframe 編輯模式', r.name) }
  const closeModal = () => { setShowModal(false); setEditing(null) }

  const handleSaved = async (message?: string) => {
    setShowModal(false)
    setEditing(null)
    await load()
    setMsg('已儲存')
    setMsgKind('success')
    notify(message || 'Wireframe 已儲存', '資料已同步至資料庫。')
  }

  const remove = async (r: WireframeRecord) => {
    if (!window.confirm(`確認刪除 Wireframe「${r.name}」？`)) return
    setBusy(true)
    try {
      await wireframeApi(`/api/apiman/wireframes/${r.id}`, { method: 'DELETE' })
      await load()
      setMsg('已刪除')
      setMsgKind('success')
      notify('Wireframe 已刪除', r.name)
      if (selectedId === r.id) setSelectedId(null)
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err))
      setMsgKind('danger')
      notify('Wireframe 刪除失敗', err instanceof Error ? err.message : String(err), 'danger')
    } finally {
      setBusy(false)
    }
  }

  const selected = useMemo(() => records.find((item) => item.id === selectedId) || filtered[0] || null, [filtered, records, selectedId])
  const selectedCounts = selected ? sceneTypeCounts(selected.scene_json) : {}
  const totalElements = records.reduce((sum, record) => sum + countElements(record.scene_json), 0)
  const latestRecord = records[0]

  const exportRecord = (r: WireframeRecord) => {
    const payload = {
      name: r.name,
      description: r.description || '',
      scene_json: r.scene_json,
      viewport_json: r.viewport_json,
      exported_at: new Date().toISOString(),
    }
    downloadText(`${safeFileName(r.name)}.wireframe.json`, JSON.stringify(payload, null, 2))
    setMsg('已匯出 JSON')
    setMsgKind('success')
    notify('Wireframe 已匯出', r.name)
  }

  const duplicateRecord = async (r: WireframeRecord) => {
    setBusy(true)
    setMsg('')
    try {
      const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')
      await wireframeApi('/api/apiman/wireframes', {
        method: 'POST',
        body: JSON.stringify({
          name: `${r.name} Copy ${stamp}`,
          description: r.description || '',
          scene_json: r.scene_json,
          viewport_json: r.viewport_json,
        }),
      })
      await load()
      setMsg('已建立副本')
      setMsgKind('success')
      notify('Wireframe 已複製', `${r.name} 已建立副本。`)
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err))
      setMsgKind('danger')
      notify('Wireframe 複製失敗', err instanceof Error ? err.message : String(err), 'danger')
    } finally {
      setBusy(false)
    }
  }

  const importJson = async (file: File) => {
    setBusy(true)
    setMsg('')
    try {
      const raw = await file.text()
      const parsed = JSON.parse(raw)
      const sceneJson = typeof parsed.scene_json === 'string'
        ? parsed.scene_json
        : JSON.stringify(Array.isArray(parsed.elements) || parsed.appState ? parsed : (parsed.scene || parsed))
      const name = typeof parsed.name === 'string' && parsed.name.trim()
        ? parsed.name.trim()
        : file.name.replace(/\.json$/i, '')
      await wireframeApi('/api/apiman/wireframes', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description: typeof parsed.description === 'string' ? parsed.description : `Imported from ${file.name}`,
          scene_json: sceneJson,
          viewport_json: typeof parsed.viewport_json === 'string' ? parsed.viewport_json : JSON.stringify(parsed.viewport || {}),
        }),
      })
      await load()
      setMsg(`已匯入 ${file.name}`)
      setMsgKind('success')
      notify('Wireframe 已匯入', file.name)
    } catch (err) {
      setMsg(`匯入失敗：${err instanceof Error ? err.message : String(err)}`)
      setMsgKind('danger')
      notify('Wireframe 匯入失敗', err instanceof Error ? err.message : String(err), 'danger')
    } finally {
      setBusy(false)
      if (importInputRef.current) importInputRef.current.value = ''
    }
  }

  const renderPreview = (r: WireframeRecord | null) => {
    if (!r) return <div className="text-center text-muted py-5">選取一筆 Wireframe 查看摘要</div>
    const elements = activeElements(r.scene_json)
    const drawable = elements
      .filter((item) => ['rectangle', 'text', 'line', 'arrow'].includes(String(item.type)))
      .slice(0, 80)
    const bounds = drawable.reduce<{ minX: number; minY: number; maxX: number; maxY: number }>((acc, item) => {
      const x = Number(item.x || 0)
      const y = Number(item.y || 0)
      const width = Math.max(1, Number(item.width || 1))
      const height = Math.max(1, Number(item.height || 1))
      return {
        minX: Math.min(acc.minX, x),
        minY: Math.min(acc.minY, y),
        maxX: Math.max(acc.maxX, x + width),
        maxY: Math.max(acc.maxY, y + height),
      }
    }, { minX: 0, minY: 0, maxX: 1100, maxY: 700 })
    const viewWidth = Math.max(1, bounds.maxX - bounds.minX)
    const viewHeight = Math.max(1, bounds.maxY - bounds.minY)
    const scale = Math.min(360 / viewWidth, 220 / viewHeight)
    return (
      <div>
        <div className="border rounded bg-white position-relative mb-2" style={{ height: 240, overflow: 'hidden' }}>
          {drawable.map((item, index) => {
            const type = String(item.type)
            const left = (Number(item.x || 0) - bounds.minX) * scale + 8
            const top = (Number(item.y || 0) - bounds.minY) * scale + 8
            const width = Math.max(2, Number(item.width || 1) * scale)
            const height = Math.max(2, Number(item.height || 1) * scale)
            if (type === 'text') {
              return <span key={`${r.id}-${index}`} className="position-absolute text-truncate" style={{ left, top, width, fontSize: 10, color: String(item.strokeColor || '#333') }}>{String(item.text || '')}</span>
            }
            if (type === 'line' || type === 'arrow') {
              return <span key={`${r.id}-${index}`} className="position-absolute" style={{ left, top, width, height: 1, background: String(item.strokeColor || '#64748b'), transformOrigin: 'left center' }}></span>
            }
            return <span key={`${r.id}-${index}`} className="position-absolute rounded-1" style={{ left, top, width, height, border: `1px solid ${String(item.strokeColor || '#334155')}`, background: String(item.backgroundColor || '#fff') }}></span>
          })}
          {!drawable.length && <div className="text-center text-muted py-5 small">此 Wireframe 尚無可預覽元素</div>}
        </div>
        <div className="d-flex flex-wrap gap-1">
          {Object.entries(sceneTypeCounts(r.scene_json)).map(([type, count]) => <span key={type} className="badge bg-label-secondary">{type}: {count}</span>)}
        </div>
      </div>
    )
  }

  return (
    <>
      <div id="wireframeView" style={{ display: 'none' }}>
        {toast && (
          <div
            className={`position-fixed end-0 bottom-0 m-4 p-3 text-white shadow-lg border-start border-4 ${toast.kind === 'danger' ? 'border-danger' : toast.kind === 'warning' ? 'border-warning' : 'border-success'}`}
            style={{ zIndex: 2147483000, minWidth: 280, maxWidth: 380, borderRadius: 8, background: '#111827' }}
          >
            <div className="fw-semibold">{toast.title}</div>
            {toast.detail && <div className="small mt-1">{toast.detail}</div>}
          </div>
        )}
        {showModal ? (
          <WireframeEditorModal
            record={editing}
            onSaved={handleSaved}
            onClose={closeModal}
            visible={showModal}
          />
        ) : (
          <>
        <div className="row mb-3">
          <div className="col-12">
            <div className="card">
              <div className="card-header d-flex align-items-center py-2">
                <i className="bx bx-pen me-2"></i>
                <strong style={{ fontSize: '.8125rem' }}>Wireframe 設計</strong>
                <div className="ms-auto d-flex align-items-center gap-2">
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => importInputRef.current?.click()} disabled={busy} type="button">
                    <i className="bx bx-import me-1"></i>匯入 JSON
                  </button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={load} disabled={busy} type="button">
                    <i className="bx bx-refresh me-1"></i>重新整理
                  </button>
                  <button className="btn btn-sm btn-primary" onClick={openNew} disabled={busy} type="button">
                    <i className="bx bx-plus me-1"></i>新增 Wireframe
                  </button>
                </div>
              </div>
              <div className="card-body p-2">
                <div className="alert alert-primary py-2 mb-2" style={{ fontSize: '.8125rem' }}>
                  <div className="fw-semibold mb-1"><i className="bx bx-info-circle me-1"></i>操作提示</div>
                  <div className="d-flex flex-wrap gap-2">
                    <span>1. 先按「新增 Wireframe」選模板或空白畫布。</span>
                    <span>2. 點清單列可查看右側預覽，雙擊可直接編輯。</span>
                    <span>3. 匯入 / 匯出 JSON 可用來備份或搬移設計稿。</span>
                  </div>
                </div>
                <div className="row g-2 mb-2">
                  <div className="col-md-3">
                    <div className="border rounded p-2 h-100">
                      <div className="text-muted small">Wireframe 總數</div>
                      <div className="fw-semibold">{records.length}</div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="border rounded p-2 h-100">
                      <div className="text-muted small">元素總數</div>
                      <div className="fw-semibold">{totalElements}</div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="border rounded p-2 h-100">
                      <div className="text-muted small">目前選取</div>
                      <div className="fw-semibold text-truncate">{selected?.name || '—'}</div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="border rounded p-2 h-100">
                      <div className="text-muted small">最後更新</div>
                      <div className="fw-semibold text-truncate">{latestRecord?.updated_at || '—'}</div>
                    </div>
                  </div>
                </div>
                <div className="row g-2 mb-2">
                  <div className="col-md-4">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="搜尋名稱 / 描述"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="col-md-8 d-flex align-items-center">
                    {msg && <span className={`text-${msgKind} small`}>{msg}</span>}
                  </div>
                </div>
                <div className="row g-2">
                  <div className="col-lg-8">
                    <div className="table-responsive">
                      <table className="table table-sm table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: '20%' }}>名稱</th>
                            <th style={{ width: '26%' }}>描述</th>
                            <th style={{ width: '10%' }}>元素數</th>
                            <th style={{ width: '10%' }}>大小</th>
                            <th style={{ width: '14%' }}>最後更新</th>
                            <th style={{ width: '20%' }} className="text-end">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center text-muted py-4">
                                {records.length === 0 ? '尚無 Wireframe，點擊「新增 Wireframe」開始設計。' : '目前篩選條件下沒有資料。'}
                              </td>
                            </tr>
                          ) : filtered.map((r) => (
                            <tr key={r.id} className={selected?.id === r.id ? 'table-primary' : ''} onClick={() => setSelectedId(r.id)} onDoubleClick={() => openEdit(r)} style={{ cursor: 'pointer' }}>
                              <td className="fw-semibold">{r.name}</td>
                              <td className="text-muted">{r.description || '—'}</td>
                              <td><span className="badge bg-label-info">{countElements(r.scene_json)}</span></td>
                              <td className="text-muted" style={{ fontSize: '.75rem' }}>{formatSize(r.scene_json)}</td>
                              <td className="text-nowrap" style={{ fontSize: '.75rem' }}>{r.updated_at}</td>
                              <td className="text-end" onClick={(event) => event.stopPropagation()}>
                                <div className="btn-group btn-group-sm">
                                  <button className="btn btn-outline-primary" onClick={() => openEdit(r)} title="編輯" type="button">
                                    <i className="bx bx-edit"></i>
                                  </button>
                                  <button className="btn btn-outline-secondary" onClick={() => duplicateRecord(r)} title="複製" type="button" disabled={busy}>
                                    <i className="bx bx-copy"></i>
                                  </button>
                                  <button className="btn btn-outline-info" onClick={() => exportRecord(r)} title="匯出 JSON" type="button">
                                    <i className="bx bx-download"></i>
                                  </button>
                                  <button className="btn btn-outline-danger" onClick={() => remove(r)} title="刪除" type="button">
                                    <i className="bx bx-trash"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="border rounded p-2 h-100">
                      <div className="d-flex align-items-center mb-2">
                        <strong style={{ fontSize: '.8125rem' }}>Wireframe 預覽</strong>
                        {selected && <button className="btn btn-sm btn-outline-primary ms-auto" type="button" onClick={() => openEdit(selected)}><i className="bx bx-edit me-1"></i>編輯</button>}
                      </div>
                      {renderPreview(selected)}
                      {selected && (
                        <div className="small text-muted mt-2">
                          <div className="d-flex justify-content-between"><span>Rectangle</span><strong>{selectedCounts.rectangle || 0}</strong></div>
                          <div className="d-flex justify-content-between"><span>Text</span><strong>{selectedCounts.text || 0}</strong></div>
                          <div className="d-flex justify-content-between"><span>Line / Arrow</span><strong>{(selectedCounts.line || 0) + (selectedCounts.arrow || 0)}</strong></div>
                        </div>
                      )}
                      <div className="alert alert-secondary py-2 mt-2 mb-0" style={{ fontSize: '.75rem' }}>
                        選取一筆後可用右上「編輯」回到畫布；若預覽空白，代表該設計稿尚未放入可繪製元素。
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="row mb-3">
          <div className="col-12">
            <div className="card">
              <div className="card-header py-2">
                <strong style={{ fontSize: '.8125rem' }}>關於 Wireframe</strong>
              </div>
              <div className="card-body p-2" style={{ fontSize: '.75rem' }}>
                <p className="mb-2">Wireframe 模組基於 <a href="https://excalidraw.com/" target="_blank" rel="noreferrer">Excalidraw</a> 開源工具，提供手繪風格的介面草圖設計能力，適合用於：</p>
                <ul className="mb-0 ps-3">
                  <li>API 文件視覺化草稿</li>
                  <li>UI 介面流程規劃</li>
                  <li>系統架構示意圖</li>
                  <li>團隊協作溝通用圖</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <input
          ref={importInputRef}
          type="file"
          accept=".json,application/json"
          className="d-none"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void importJson(file)
          }}
        />
          </>
        )}
      </div>
    </>
  )
}
