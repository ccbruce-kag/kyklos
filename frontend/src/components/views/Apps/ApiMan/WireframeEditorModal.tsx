import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import { getApiBase } from '../../../../utils/api'

export type WireframeRecord = {
  id: number
  name: string
  description: string
  scene_json: string
  viewport_json: string | null
  created_at: string
  updated_at: string
}

type Props = {
  record: WireframeRecord | null
  visible: boolean
  onSaved: (message?: string) => void
  onClose: () => void
}

type ExcalidrawElement = Record<string, unknown>
type ExcalidrawAppState = Record<string, unknown>
type ExcalidrawApi = {
  getSceneElements: () => readonly ExcalidrawElement[]
  getAppState: () => ExcalidrawAppState
  updateScene: (data: { elements?: readonly ExcalidrawElement[]; appState?: ExcalidrawAppState }) => void
  scrollToContent?: (elements?: readonly ExcalidrawElement[], options?: Record<string, unknown>) => void
}

type ExcalidrawInitialData = {
  elements?: readonly ExcalidrawElement[]
  appState?: ExcalidrawAppState
  scrollToContent?: boolean
}

type WireframeTemplate = {
  key: string
  label: string
  icon: string
  description: string
  create: () => ExcalidrawInitialData
}

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

function parseInitialScene(sceneJson: string | null | undefined): ExcalidrawInitialData {
  if (!sceneJson) return { elements: [], appState: { viewBackgroundColor: '#ffffff', gridSize: 20 } }
  try {
    const parsed = JSON.parse(sceneJson)
    if (Array.isArray(parsed)) {
      return { elements: parsed as readonly ExcalidrawElement[], appState: { viewBackgroundColor: '#ffffff', gridSize: 20 } }
    }
    if (parsed && typeof parsed === 'object') {
      return {
        elements: Array.isArray(parsed.elements) ? (parsed.elements as readonly ExcalidrawElement[]) : [],
        appState: parsed.appState && typeof parsed.appState === 'object'
          ? { viewBackgroundColor: '#ffffff', gridSize: 20, ...parsed.appState }
          : { viewBackgroundColor: '#ffffff', gridSize: 20 },
        scrollToContent: true,
      }
    }
  } catch { /* fall through */ }
  return { elements: [], appState: { viewBackgroundColor: '#ffffff', gridSize: 20 } }
}

function activeElementCount(elements: readonly ExcalidrawElement[] = []): number {
  return elements.filter((item) => !item.isDeleted).length
}

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`
}

function baseElement(type: string, x: number, y: number, width: number, height: number, extra: ExcalidrawElement = {}): ExcalidrawElement {
  return {
    id: makeId(type),
    type,
    x,
    y,
    width,
    height,
    angle: 0,
    strokeColor: '#1e1e1e',
    backgroundColor: type === 'rectangle' ? '#ffffff' : 'transparent',
    fillStyle: 'solid',
    strokeWidth: 2,
    strokeStyle: 'solid',
    roughness: 1,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: { type: 3 },
    seed: Math.floor(Math.random() * 100000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 100000),
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
    ...extra,
  }
}

function rect(x: number, y: number, width: number, height: number, label?: string, fill = '#ffffff'): ExcalidrawElement[] {
  const box = baseElement('rectangle', x, y, width, height, { backgroundColor: fill })
  if (!label) return [box]
  return [
    box,
    text(x + 16, y + 14, label, Math.max(80, width - 32), 24, 18, '#1e1e1e'),
  ]
}

function text(x: number, y: number, value: string, width = 180, height = 24, fontSize = 18, color = '#1e1e1e'): ExcalidrawElement {
  return baseElement('text', x, y, width, height, {
    strokeColor: color,
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 1,
    roughness: 0,
    text: value,
    fontSize,
    fontFamily: 1,
    textAlign: 'left',
    verticalAlign: 'top',
    baseline: Math.round(fontSize * 1.15),
    containerId: null,
    originalText: value,
    lineHeight: 1.25,
  })
}

function line(x: number, y: number, width: number, height = 0): ExcalidrawElement {
  return baseElement('line', x, y, width, height, {
    points: [[0, 0], [width, height]],
    lastCommittedPoint: [width, height],
    startBinding: null,
    endBinding: null,
  })
}

function templateApiDetail(): ExcalidrawInitialData {
  const elements: ExcalidrawElement[] = [
    ...rect(60, 40, 1040, 640, undefined, '#f8fafc'),
    ...rect(90, 70, 980, 64, 'API 詳細頁 / Request Builder', '#eef2ff'),
    text(90, 154, 'Request', 160, 24, 20),
    ...rect(90, 188, 140, 44, 'GET', '#dbeafe'),
    ...rect(250, 188, 620, 44, 'https://api.example.local/users/{{id}}'),
    ...rect(890, 188, 180, 44, 'Send', '#dcfce7'),
    text(90, 260, 'Tabs', 140, 24, 18),
    ...rect(90, 292, 180, 42, 'Params', '#fef3c7'),
    ...rect(280, 292, 180, 42, 'Headers'),
    ...rect(470, 292, 180, 42, 'Body'),
    ...rect(660, 292, 180, 42, 'Auth'),
    ...rect(90, 356, 460, 260, 'Request Editor'),
    ...rect(590, 356, 480, 260, 'Response Preview'),
    line(575, 356, 0, 260),
  ]
  return { elements, appState: { viewBackgroundColor: '#ffffff', gridSize: 20 }, scrollToContent: true }
}

function templateDashboard(): ExcalidrawInitialData {
  const elements: ExcalidrawElement[] = [
    ...rect(40, 40, 1160, 680, undefined, '#f8fafc'),
    ...rect(70, 70, 240, 620, 'Sidebar', '#e0f2fe'),
    ...rect(340, 70, 830, 80, 'Header / Filter / Search', '#eef2ff'),
    ...rect(340, 180, 190, 120, 'KPI 1'),
    ...rect(552, 180, 190, 120, 'KPI 2'),
    ...rect(764, 180, 190, 120, 'KPI 3'),
    ...rect(976, 180, 190, 120, 'KPI 4'),
    ...rect(340, 330, 520, 300, 'Chart / Trend'),
    ...rect(890, 330, 280, 300, 'Activity List'),
  ]
  return { elements, appState: { viewBackgroundColor: '#ffffff', gridSize: 20 }, scrollToContent: true }
}

function templateMobile(): ExcalidrawInitialData {
  const elements: ExcalidrawElement[] = [
    ...rect(80, 40, 360, 700, undefined, '#f8fafc'),
    ...rect(110, 80, 300, 52, 'Mobile Header', '#eef2ff'),
    ...rect(110, 156, 300, 120, 'Hero / Status Card'),
    ...rect(110, 296, 136, 112, 'Action 1', '#dcfce7'),
    ...rect(274, 296, 136, 112, 'Action 2', '#fee2e2'),
    ...rect(110, 432, 300, 210, 'List Items'),
    ...rect(110, 664, 300, 48, 'Bottom Navigation', '#e0f2fe'),
    ...rect(520, 40, 360, 700, undefined, '#f8fafc'),
    ...rect(550, 80, 300, 52, 'Detail Header', '#eef2ff'),
    ...rect(550, 156, 300, 420, 'Detail Form'),
    ...rect(550, 604, 140, 52, 'Cancel'),
    ...rect(710, 604, 140, 52, 'Save', '#dcfce7'),
  ]
  return { elements, appState: { viewBackgroundColor: '#ffffff', gridSize: 20 }, scrollToContent: true }
}

function templateFlow(): ExcalidrawInitialData {
  const elements: ExcalidrawElement[] = [
    ...rect(80, 120, 220, 90, 'User / Client', '#e0f2fe'),
    ...rect(420, 120, 240, 90, 'ApiMan Request', '#eef2ff'),
    ...rect(780, 120, 240, 90, 'Backend API', '#dcfce7'),
    ...rect(420, 300, 240, 90, 'Validation / Auth', '#fef3c7'),
    ...rect(780, 300, 240, 90, 'Response / Error', '#fee2e2'),
    line(302, 165, 110, 0),
    line(662, 165, 110, 0),
    line(540, 214, 0, 78),
    line(662, 345, 110, 0),
  ]
  return { elements, appState: { viewBackgroundColor: '#ffffff', gridSize: 20 }, scrollToContent: true }
}

const wireframeTemplates: WireframeTemplate[] = [
  { key: 'api', label: 'API 詳細頁', icon: 'bx-code-curly', description: 'Request / Response 編輯畫面', create: templateApiDetail },
  { key: 'dashboard', label: 'Dashboard', icon: 'bx-grid-alt', description: 'KPI、圖表與活動列表', create: templateDashboard },
  { key: 'mobile', label: 'Mobile App', icon: 'bx-mobile-alt', description: '雙手機畫面流程', create: templateMobile },
  { key: 'flow', label: 'API 流程圖', icon: 'bx-git-branch', description: '系統互動與回應流程', create: templateFlow },
]

function downloadText(filename: string, content: string, type = 'application/json') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function WireframeEditorModal({ record, visible, onSaved, onClose }: Props) {
  const apiRef = useRef<ExcalidrawApi | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const skipInitialChangeRef = useRef(false)
  const [sessionKey, setSessionKey] = useState(0)
  const [name, setName] = useState(record?.name || '')
  const [description, setDescription] = useState(record?.description || '')
  const [busy, setBusy] = useState(false)
  const [errMsg, setErrMsg] = useState('')
  const [infoMsg, setInfoMsg] = useState('')
  const [elementCount, setElementCount] = useState(0)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const initialData = useMemo<ExcalidrawInitialData>(
    () => parseInitialScene(record?.scene_json),
    [record?.id, record?.scene_json, sessionKey],
  )

  useEffect(() => {
    if (!visible) return
    setName(record?.name || '')
    setDescription(record?.description || '')
    setErrMsg('')
    setInfoMsg('')
    setHasUnsavedChanges(false)
    setElementCount(activeElementCount(parseInitialScene(record?.scene_json).elements || []))
    skipInitialChangeRef.current = true
    setSessionKey((value) => value + 1)
  }, [record, visible])

  const setExcalidrawApi = useCallback((api: ExcalidrawApi | null) => {
    apiRef.current = api
  }, [])

  const onExcalidrawChange = useCallback((elements?: readonly ExcalidrawElement[]) => {
    if (elements) setElementCount(activeElementCount(elements))
    else setElementCount(activeElementCount(apiRef.current?.getSceneElements() || []))
    if (skipInitialChangeRef.current) {
      skipInitialChangeRef.current = false
      return
    }
    setHasUnsavedChanges(true)
  }, [])

  const currentPayload = useCallback(() => {
    const api = apiRef.current
    const elements = api ? api.getSceneElements() : []
    const appState = api ? api.getAppState() : {}
    const scenePayload = {
      elements: elements.map((el) => ({ ...el })),
      appState: {
        viewBackgroundColor: appState.viewBackgroundColor || '#ffffff',
        gridSize: appState.gridSize ?? 20,
        theme: appState.theme,
      },
    }
    return {
      scenePayload,
      viewportPayload: {
        scrollX: appState.scrollX,
        scrollY: appState.scrollY,
        zoom: appState.zoom,
      },
    }
  }, [])

  const saveWireframe = async (mode: 'save' | 'copy' = 'save') => {
    const targetName = name.trim()
    if (!targetName) {
      setErrMsg('請輸入名稱')
      return
    }
    setBusy(true)
    setErrMsg('')
    setInfoMsg('')
    try {
      const { scenePayload, viewportPayload } = currentPayload()
      const copyName = `${targetName} Copy`
      const body = {
        name: mode === 'copy' ? copyName : targetName,
        description: description.trim(),
        scene_json: JSON.stringify(scenePayload),
        viewport_json: JSON.stringify(viewportPayload),
      }
      if (record && mode === 'save') {
        await wireframeApi(`/api/apiman/wireframes/${record.id}`, { method: 'PUT', body: JSON.stringify(body) })
      } else {
        await wireframeApi('/api/apiman/wireframes', { method: 'POST', body: JSON.stringify(body) })
      }
      setHasUnsavedChanges(false)
      onSaved(mode === 'copy' ? 'Wireframe 副本已儲存' : 'Wireframe 已儲存')
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const handleClose = () => {
    if (hasUnsavedChanges && !window.confirm('尚有未儲存變更，確定關閉？')) return
    onClose()
  }

  const applyTemplate = (template: WireframeTemplate) => {
    const api = apiRef.current
    if (!api) return
    const currentElements = api.getSceneElements()
    if (activeElementCount(currentElements) > 0 && !window.confirm(`套用「${template.label}」會取代目前畫布，是否繼續？`)) return
    const data = template.create()
    api.updateScene({ elements: data.elements || [], appState: data.appState || {} })
    setElementCount(activeElementCount(data.elements || []))
    setHasUnsavedChanges(true)
    setInfoMsg(`已套用模板：${template.label}`)
    requestAnimationFrame(() => api.scrollToContent?.(data.elements, { fitToContent: true }))
  }

  const handleClear = () => {
    if (!window.confirm('確認清空畫布？')) return
    const api = apiRef.current
    if (api) {
      api.updateScene({ elements: [] })
      setElementCount(0)
      setHasUnsavedChanges(true)
      setInfoMsg('畫布已清空')
    }
  }

  const exportJson = () => {
    const { scenePayload, viewportPayload } = currentPayload()
    const payload = {
      name: name.trim() || 'Untitled Wireframe',
      description: description.trim(),
      scene_json: JSON.stringify(scenePayload),
      viewport_json: JSON.stringify(viewportPayload),
      exported_at: new Date().toISOString(),
    }
    downloadText(`${payload.name.replace(/[\\/:*?"<>|]+/g, '_')}.wireframe.json`, JSON.stringify(payload, null, 2))
    setInfoMsg('Wireframe JSON 已匯出')
  }

  const importJsonFile = async (file: File) => {
    setErrMsg('')
    setInfoMsg('')
    try {
      const raw = await file.text()
      const parsed = JSON.parse(raw)
      const scene = typeof parsed.scene_json === 'string'
        ? parseInitialScene(parsed.scene_json)
        : Array.isArray(parsed.elements) || parsed.appState
          ? parseInitialScene(JSON.stringify(parsed))
          : parseInitialScene(JSON.stringify(parsed.scene || parsed))
      apiRef.current?.updateScene({ elements: scene.elements || [], appState: scene.appState || {} })
      if (typeof parsed.name === 'string') setName(parsed.name)
      if (typeof parsed.description === 'string') setDescription(parsed.description)
      setElementCount(activeElementCount(scene.elements || []))
      setHasUnsavedChanges(true)
      setInfoMsg(`已匯入 ${file.name}`)
    } catch (err) {
      setErrMsg(`匯入失敗：${err instanceof Error ? err.message : String(err)}`)
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (!visible) return null

  return (
          <div className="card mb-3">
            <div className="card-header py-2 d-flex align-items-center">
              <h6 className="modal-title d-flex align-items-center gap-2">
                <i className="bx bx-pen"></i>
                {record ? `編輯 Wireframe #${record.id}` : '新增 Wireframe'}
                {hasUnsavedChanges && <span className="badge bg-label-warning">未儲存</span>}
              </h6>
              <button type="button" className="btn btn-sm btn-outline-secondary ms-auto" onClick={handleClose}>
                <i className="bx bx-arrow-back me-1"></i>返回清單
              </button>
            </div>
            <div className="card-body p-2 d-flex flex-column" style={{ height: 'calc(100vh - 220px)', minHeight: 620, overflow: 'hidden' }}>
              <div className="row g-2 mb-2">
                <div className="col-lg-3 col-md-5">
                  <label className="form-label mb-1" style={{ fontSize: '.7rem' }}>名稱 *</label>
                  <input className="form-control form-control-sm" value={name} onChange={(e) => { setName(e.target.value); setHasUnsavedChanges(true) }} />
                </div>
                <div className="col-lg-4 col-md-5">
                  <label className="form-label mb-1" style={{ fontSize: '.7rem' }}>描述</label>
                  <input className="form-control form-control-sm" value={description} onChange={(e) => { setDescription(e.target.value); setHasUnsavedChanges(true) }} />
                </div>
                <div className="col-lg-5 col-md-12 d-flex align-items-end justify-content-lg-end gap-2 flex-wrap">
                  <span className="badge bg-label-primary">元素 {elementCount}</span>
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => fileInputRef.current?.click()} disabled={busy}>
                    <i className="bx bx-import me-1"></i>匯入 JSON
                  </button>
                  <button type="button" className="btn btn-outline-info btn-sm" onClick={exportJson} disabled={busy}>
                    <i className="bx bx-export me-1"></i>匯出 JSON
                  </button>
                  <button type="button" className="btn btn-outline-warning btn-sm" onClick={handleClear} disabled={busy}>
                    <i className="bx bx-eraser me-1"></i>清空
                  </button>
                </div>
              </div>

              <div className="d-flex gap-2 mb-2 flex-wrap">
                {wireframeTemplates.map((template) => (
                  <button key={template.key} type="button" className="btn btn-sm btn-outline-secondary" onClick={() => applyTemplate(template)} disabled={busy} title={template.description}>
                    <i className={`bx ${template.icon} me-1`}></i>{template.label}
                  </button>
                ))}
              </div>

              {(errMsg || infoMsg) && (
                <div className={`alert ${errMsg ? 'alert-danger' : 'alert-success'} py-1 mb-2`} style={{ fontSize: '.75rem' }}>
                  {errMsg || infoMsg}
                </div>
              )}

              <div style={{ flexGrow: 1, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 240px', gap: 8, minHeight: 0 }}>
                <div style={{ position: 'relative', border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden', minWidth: 0 }}>
                  {visible && (
                    <Excalidraw
                      key={`${record?.id || 'new'}-${sessionKey}`}
                      excalidrawAPI={setExcalidrawApi as never}
                      initialData={initialData as never}
                      onChange={onExcalidrawChange as never}
                      viewModeEnabled={false}
                      gridModeEnabled={false}
                      zenModeEnabled={false}
                      UIOptions={{
                        canvasActions: { saveAsImage: true, loadScene: false },
                      }}
                    />
                  )}
                </div>
                <aside className="border rounded p-2 bg-body-tertiary" style={{ overflow: 'auto' }}>
                  <strong style={{ fontSize: '.8125rem' }}>設計檢查</strong>
                  <div className="small text-muted mt-2">建議 Wireframe 至少包含：</div>
                  <ul className="small ps-3 mt-2 mb-3">
                    <li>頁面標題或流程名稱</li>
                    <li>主要輸入區與操作按鈕</li>
                    <li>回應 / 狀態 / 錯誤顯示區</li>
                    <li>資料表或清單狀態</li>
                  </ul>
                  <div className="small">
                    <div className="d-flex justify-content-between border-top pt-2"><span>畫布元素</span><strong>{elementCount}</strong></div>
                    <div className="d-flex justify-content-between border-top pt-2 mt-2"><span>模式</span><strong>{record ? '編輯' : '新增'}</strong></div>
                    <div className="d-flex justify-content-between border-top pt-2 mt-2"><span>儲存狀態</span><strong>{hasUnsavedChanges ? '未儲存' : '已同步'}</strong></div>
                  </div>
                  <div className="alert alert-info py-2 mt-3 mb-0 small">
                    可用 Excalidraw 內建工具繪製矩形、文字、箭頭與自由線；上方模板可快速建立常用 API/UI 草稿。
                  </div>
                </aside>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="d-none"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void importJsonFile(file)
                }}
              />
            </div>
            <div className="card-footer py-2 d-flex align-items-center gap-2 flex-wrap">
              <span className="text-muted me-auto" style={{ fontSize: '.7rem' }}>
                <i className="bx bx-info-circle me-1"></i>資料會儲存在 SQLite `apiman_wireframes`，可匯出 JSON 做版本備份。
              </span>
              {record && (
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => saveWireframe('copy')} disabled={busy}>
                  <i className="bx bx-copy me-1"></i>另存副本
                </button>
              )}
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleClose} disabled={busy}>取消</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => saveWireframe('save')} disabled={busy}>
                <i className="bx bx-save me-1"></i>{busy ? '儲存中...' : '儲存'}
              </button>
            </div>
          </div>
  )
}
