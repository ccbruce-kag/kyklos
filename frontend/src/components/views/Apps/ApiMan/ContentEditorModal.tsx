import { useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Puck, type Config, type Data } from '@puckeditor/core'
import '@puckeditor/core/puck.css'
import { getApiBase } from '../../../../utils/api'
import './content-editor-layout.css'

export type ContentRecord = {
  id: number
  name: string
  description: string
  data_json: string
  created_at: string
  updated_at: string
}

type Props = {
  record: ContentRecord | null
  onSaved: () => void
  onClose: () => void
}

type ContentProps = {
  Heading: { text: string; level: 'h1' | 'h2' | 'h3' }
  Paragraph: { text: string }
  Button: { label: string; href: string; variant: 'primary' | 'secondary' | 'outline-primary' | 'outline-secondary' }
  Image: { src: string; alt: string; width: number }
  Card: { title: string; body: string }
  Divider: {}
}

const config: Config<ContentProps> = {
  components: {
    Heading: {
      label: '標題',
      fields: {
        text: { type: 'text', label: '文字' },
        level: {
          type: 'radio',
          label: '層級',
          options: [
            { label: 'H1', value: 'h1' },
            { label: 'H2', value: 'h2' },
            { label: 'H3', value: 'h3' },
          ],
        },
      },
      defaultProps: { text: '標題', level: 'h2' },
      render: ({ text, level }) => {
        const Tag = level || 'h2'
        return <Tag className="fw-semibold mb-2">{text}</Tag>
      },
    },
    Paragraph: {
      label: '段落',
      fields: {
        text: { type: 'textarea', label: '內容' },
      },
      defaultProps: { text: '段落內容...' },
      render: ({ text }) => <p className="mb-2">{text}</p>,
    },
    Button: {
      label: '按鈕',
      fields: {
        label: { type: 'text', label: '文字' },
        href: { type: 'text', label: '連結' },
        variant: {
          type: 'select',
          label: '樣式',
          options: [
            { label: 'Primary', value: 'primary' },
            { label: 'Secondary', value: 'secondary' },
            { label: 'Outline Primary', value: 'outline-primary' },
            { label: 'Outline Secondary', value: 'outline-secondary' },
          ],
        },
      },
      defaultProps: { label: '按鈕', href: '#', variant: 'primary' },
      render: ({ label, href, variant }) => (
        <a className={`btn btn-sm btn-${variant} mb-2`} href={href || '#'}>{label}</a>
      ),
    },
    Image: {
      label: '圖片',
      fields: {
        src: { type: 'text', label: '網址' },
        alt: { type: 'text', label: '替代文字' },
        width: { type: 'number', label: '寬度 (px)' },
      },
      defaultProps: { src: '', alt: 'image', width: 200 },
      render: ({ src, alt, width }) => (
        src ? <img className="mb-2" src={src} alt={alt} style={{ maxWidth: width || 200 }} /> : <div className="border rounded p-3 text-muted small mb-2" style={{ width: width || 200 }}>請填入圖片網址</div>
      ),
    },
    Card: {
      label: '卡片',
      fields: {
        title: { type: 'text', label: '標題' },
        body: { type: 'textarea', label: '內文' },
      },
      defaultProps: { title: '卡片標題', body: '卡片內容...' },
      render: ({ title, body }) => (
        <div className="card mb-2">
          <div className="card-body">
            <h6 className="card-title fw-semibold">{title}</h6>
            <p className="card-text small mb-0">{body}</p>
          </div>
        </div>
      ),
    },
    Divider: {
      label: '分隔線',
      fields: {},
      defaultProps: {},
      render: () => <hr className="my-2" />,
    },
  },
  root: {
    fields: {},
    defaultProps: {},
    render: () => <div className="p-3" />,
  },
  categories: {
    layout: { title: '版面', components: ['Heading', 'Paragraph', 'Divider', 'Card'] },
    action: { title: '互動', components: ['Button', 'Image'] },
  },
}

async function contentApi<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
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

function parseInitialData(dataJson: string | null | undefined): Data {
  if (!dataJson) return { content: [], root: {} }
  try {
    const parsed = JSON.parse(dataJson)
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.content)) {
      return { content: parsed.content, root: parsed.root || {}, zones: parsed.zones }
    }
  } catch { /* fall through */ }
  return { content: [], root: {} }
}

export default function ContentEditorModal({ record, onSaved, onClose }: Props) {
  const puckRef = useRef<{ getData: () => Data } | null>(null)
  const [name, setName] = useState(record?.name || '')
  const [description, setDescription] = useState(record?.description || '')
  const [busy, setBusy] = useState(false)
  const [errMsg, setErrMsg] = useState('')
  const [blockCount, setBlockCount] = useState(0)

  const initialData = parseInitialData(record?.data_json)

  const onPuckPublish = useCallback((puckData: Data) => {
    const content = puckData?.content
    if (Array.isArray(content)) setBlockCount(content.length)
  }, [])

  const handleSave = async () => {
    if (!name.trim()) {
      setErrMsg('請輸入名稱')
      return
    }
    setBusy(true)
    setErrMsg('')
    try {
      const data: Data = puckRef.current ? puckRef.current.getData() : initialData
      const body = {
        name: name.trim(),
        description: description.trim(),
        data_json: JSON.stringify(data),
      }
      if (record) {
        await contentApi(`/api/apiman/contents/${record.id}`, { method: 'PUT', body: JSON.stringify(body) })
      } else {
        await contentApi('/api/apiman/contents', { method: 'POST', body: JSON.stringify(body) })
      }
      onSaved()
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const handleReset = () => {
    if (!window.confirm('確認重置為空白？所有區塊將被清空。')) return
    const api = puckRef.current
    if (api) {
      api.getData()
    }
    setBlockCount(0)
  }

  return createPortal(
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal fade show" tabIndex={-1} style={{ display: 'block' }}>
        <div className="modal-dialog modal-xl" style={{ maxWidth: '98vw' }}>
          <div className="modal-content" style={{ height: '94vh' }}>
            <div className="modal-header py-2">
              <h6 className="modal-title d-flex align-items-center gap-2">
                <i className="bx bx-layout"></i>
                {record ? `編輯 Content #${record.id}` : '新增 Content'}
              </h6>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
            </div>
            <div className="modal-body p-2 d-flex flex-column" style={{ overflow: 'hidden' }}>
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
                  <div className="text-muted" style={{ fontSize: '.7rem' }}>
                    區塊數：<span className="badge bg-label-primary ms-1">{blockCount}</span>
                  </div>
                </div>
              </div>
              {errMsg && (
                <div className="alert alert-danger py-1 mb-2" style={{ fontSize: '.75rem' }}>{errMsg}</div>
              )}
              <div className="kyklos-content-puck">
                <Puck
                  config={config}
                  data={initialData}
                  onPublish={onPuckPublish as never}
                  puckRef={puckRef as never}
                />
              </div>
            </div>
            <div className="modal-footer py-2">
              <span className="text-muted me-auto" style={{ fontSize: '.7rem' }}>
                <i className="bx bx-info-circle me-1"></i>Puck 視覺化編輯器 · 拖放區塊即時配置屬性
              </span>
              <button type="button" className="btn btn-outline-warning btn-sm" onClick={handleReset} disabled={busy}>
                <i className="bx bx-eraser me-1"></i>重置
              </button>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose} disabled={busy}>取消</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleSave} disabled={busy}>
                <i className="bx bx-save me-1"></i>{busy ? '儲存中…' : '儲存'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}
