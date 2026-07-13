import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Puck, Render, type Config, type Data } from '@puckeditor/core'
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

type ContentWidth = 'full' | 'wide' | 'medium' | 'narrow' | 'auto'
type WithWidth = { blockWidth: ContentWidth }

type ContentProps = {
  Hero: WithWidth & { eyebrow: string; title: string; subtitle: string; align: 'left' | 'center' }
  SectionTitle: WithWidth & { eyebrow: string; title: string; subtitle: string }
  Paragraph: WithWidth & { text: string; tone: 'normal' | 'muted' | 'lead' }
  Button: WithWidth & { label: string; href: string; variant: 'primary' | 'secondary' | 'outline-primary' | 'outline-secondary' }
  ButtonRow: WithWidth & {
    align: 'left' | 'center' | 'right'
    buttonCount: '2' | '3' | '4'
    label1: string
    href1: string
    variant1: 'primary' | 'secondary' | 'outline-primary' | 'outline-secondary'
    label2: string
    href2: string
    variant2: 'primary' | 'secondary' | 'outline-primary' | 'outline-secondary'
    label3: string
    href3: string
    variant3: 'primary' | 'secondary' | 'outline-primary' | 'outline-secondary'
    label4: string
    href4: string
    variant4: 'primary' | 'secondary' | 'outline-primary' | 'outline-secondary'
  }
  Image: WithWidth & { src: string; alt: string; imageWidth: number; radius: 'none' | 'sm' | 'md' }
  Card: WithWidth & { title: string; body: string; accent: 'blue' | 'green' | 'amber' | 'slate' }
  FeatureGrid: WithWidth & {
    columns: '2' | '3' | '4'
    title1: string
    body1: string
    title2: string
    body2: string
    title3: string
    body3: string
    title4: string
    body4: string
  }
  Stat: WithWidth & { label: string; value: string; helper: string }
  StatGrid: WithWidth & {
    columns: '2' | '3' | '4'
    label1: string
    value1: string
    helper1: string
    label2: string
    value2: string
    helper2: string
    label3: string
    value3: string
    helper3: string
    label4: string
    value4: string
    helper4: string
  }
  Alert: WithWidth & { title: string; body: string; kind: 'info' | 'success' | 'warning' | 'danger' }
  Divider: WithWidth
  Spacer: WithWidth & { size: 'small' | 'medium' | 'large' }
}

const defaultData: Data = { content: [], root: { props: { title: 'Content Page' } } }

const templateLanding: Data = {
  root: { props: { title: 'Landing Content' } },
  content: [
    { type: 'Hero', props: { id: 'landing-hero', blockWidth: 'wide', eyebrow: 'Product Launch', title: '為產品或服務建立展示頁', subtitle: 'Landing 模板適合首頁、活動頁與產品介紹，重點是強烈標題、清楚 CTA 與功能賣點。', align: 'center' } },
    { type: 'ButtonRow', props: { id: 'landing-actions', blockWidth: 'wide', align: 'center', buttonCount: '3', label1: '開始使用', href1: '#start', variant1: 'primary', label2: '查看文件', href2: '#docs', variant2: 'outline-primary', label3: '聯絡我們', href3: '#contact', variant3: 'outline-secondary', label4: '更多', href4: '#more', variant4: 'secondary' } },
    { type: 'FeatureGrid', props: { id: 'landing-features', blockWidth: 'wide', columns: '3', title1: '快速設計', body1: '用區塊快速組合出可重用頁面。', title2: '彈性排版', body2: '支援同列按鈕、卡片與統計資訊。', title3: 'JSON 儲存', body3: '內容以 JSON 保存，方便匯出與同步。', title4: '可擴充', body4: '後續可接資料源與版型管理。' } },
    { type: 'Alert', props: { id: 'landing-note', blockWidth: 'medium', title: '提示', body: '可從 Outline 調整區塊順序、複製或刪除。', kind: 'info' } },
  ],
}

const templateReport: Data = {
  root: { props: { title: 'Report Content' } },
  content: [
    { type: 'SectionTitle', props: { id: 'report-title', blockWidth: 'wide', eyebrow: 'Monthly Report', title: '營運摘要報表', subtitle: 'Report 模板偏向管理摘要，適合展示 KPI、風險、處置狀態與後續行動。' } },
    { type: 'StatGrid', props: { id: 'report-kpi', blockWidth: 'wide', columns: '4', label1: 'API Requests', value1: '1.28M', helper1: '+12.4%', label2: 'Error Rate', value2: '0.18%', helper2: 'within SLO', label3: 'Avg Latency', value3: '86ms', helper3: '-9ms', label4: 'Open Risks', value4: '3', helper4: 'needs review' } },
    { type: 'Paragraph', props: { id: 'report-summary', blockWidth: 'medium', text: '本期主要流量維持穩定，錯誤率低於門檻。尖峰時段仍需觀察部分後端延遲，建議下一期加入容量趨勢追蹤。', tone: 'lead' } },
    { type: 'Alert', props: { id: 'report-risk', blockWidth: 'medium', title: '風險提醒', body: '部分服務尖峰時段延遲升高，建議加入容量觀察與告警閾值。', kind: 'warning' } },
  ],
}

const widthField = {
  type: 'select' as const,
  label: '區塊寬度',
  options: [
    { label: '滿版', value: 'full' },
    { label: '寬版', value: 'wide' },
    { label: '中版', value: 'medium' },
    { label: '窄版', value: 'narrow' },
    { label: '自動', value: 'auto' },
  ],
}

const buttonVariantOptions = [
  { label: 'Primary', value: 'primary' },
  { label: 'Secondary', value: 'secondary' },
  { label: 'Outline Primary', value: 'outline-primary' },
  { label: 'Outline Secondary', value: 'outline-secondary' },
]

function ContentBlock({ width, children }: { width?: ContentWidth; children: ReactNode }) {
  return <div className={`kyklos-content-block kyklos-content-block-${width || 'full'}`}>{children}</div>
}

function cloneData(data: Data): Data {
  return JSON.parse(JSON.stringify(data)) as Data
}

const config: Config<ContentProps> = {
  components: {
    Hero: {
      label: 'Hero 區塊',
      fields: {
        blockWidth: widthField,
        eyebrow: { type: 'text', label: 'Eyebrow' },
        title: { type: 'text', label: '主標題' },
        subtitle: { type: 'textarea', label: '副標題' },
        align: {
          type: 'radio',
          label: '對齊',
          options: [{ label: '靠左', value: 'left' }, { label: '置中', value: 'center' }],
        },
      },
      defaultProps: { blockWidth: 'wide', eyebrow: 'Content', title: '內容標題', subtitle: '這裡放置內容說明。', align: 'left' },
      render: ({ blockWidth, eyebrow, title, subtitle, align }) => (
        <ContentBlock width={blockWidth}>
          <section className={`kyklos-content-hero ${align === 'center' ? 'text-center mx-auto' : ''}`}>
            <div className="kyklos-content-eyebrow">{eyebrow}</div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </section>
        </ContentBlock>
      ),
    },
    SectionTitle: {
      label: '段落標題',
      fields: {
        blockWidth: widthField,
        eyebrow: { type: 'text', label: '分類文字' },
        title: { type: 'text', label: '標題' },
        subtitle: { type: 'textarea', label: '說明' },
      },
      defaultProps: { blockWidth: 'wide', eyebrow: 'Section', title: '段落標題', subtitle: '段落說明文字。' },
      render: ({ blockWidth, eyebrow, title, subtitle }) => (
        <ContentBlock width={blockWidth}>
          <div className="kyklos-content-section-title">
            <div className="kyklos-content-eyebrow">{eyebrow}</div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
        </ContentBlock>
      ),
    },
    Paragraph: {
      label: '段落',
      fields: {
        blockWidth: widthField,
        text: { type: 'textarea', label: '內容' },
        tone: {
          type: 'select',
          label: '語氣',
          options: [{ label: '一般', value: 'normal' }, { label: '淡色', value: 'muted' }, { label: '前言', value: 'lead' }],
        },
      },
      defaultProps: { blockWidth: 'medium', text: '段落內容...', tone: 'normal' },
      render: ({ blockWidth, text, tone }) => (
        <ContentBlock width={blockWidth}>
          <p className={`kyklos-content-paragraph kyklos-content-paragraph-${tone}`}>{text}</p>
        </ContentBlock>
      ),
    },
    Button: {
      label: '按鈕',
      fields: {
        blockWidth: widthField,
        label: { type: 'text', label: '文字' },
        href: { type: 'text', label: '連結' },
        variant: {
          type: 'select',
          label: '樣式',
          options: buttonVariantOptions,
        },
      },
      defaultProps: { blockWidth: 'auto', label: '按鈕', href: '#', variant: 'primary' },
      render: ({ blockWidth, label, href, variant }) => (
        <ContentBlock width={blockWidth}>
          <a className={`btn btn-sm btn-${variant} my-2`} href={href || '#'}>{label}</a>
        </ContentBlock>
      ),
    },
    ButtonRow: {
      label: '按鈕列',
      fields: {
        blockWidth: widthField,
        align: {
          type: 'radio',
          label: '對齊',
          options: [{ label: '靠左', value: 'left' }, { label: '置中', value: 'center' }, { label: '靠右', value: 'right' }],
        },
        buttonCount: {
          type: 'select',
          label: '按鈕數量',
          options: [{ label: '2 個', value: '2' }, { label: '3 個', value: '3' }, { label: '4 個', value: '4' }],
        },
        label1: { type: 'text', label: '按鈕 1 文字' },
        href1: { type: 'text', label: '按鈕 1 連結' },
        variant1: { type: 'select', label: '按鈕 1 樣式', options: buttonVariantOptions },
        label2: { type: 'text', label: '按鈕 2 文字' },
        href2: { type: 'text', label: '按鈕 2 連結' },
        variant2: { type: 'select', label: '按鈕 2 樣式', options: buttonVariantOptions },
        label3: { type: 'text', label: '按鈕 3 文字' },
        href3: { type: 'text', label: '按鈕 3 連結' },
        variant3: { type: 'select', label: '按鈕 3 樣式', options: buttonVariantOptions },
        label4: { type: 'text', label: '按鈕 4 文字' },
        href4: { type: 'text', label: '按鈕 4 連結' },
        variant4: { type: 'select', label: '按鈕 4 樣式', options: buttonVariantOptions },
      },
      defaultProps: {
        blockWidth: 'wide',
        align: 'left',
        buttonCount: '2',
        label1: '主要動作',
        href1: '#primary',
        variant1: 'primary',
        label2: '次要動作',
        href2: '#secondary',
        variant2: 'outline-primary',
        label3: '更多資訊',
        href3: '#more',
        variant3: 'outline-secondary',
        label4: '聯絡我們',
        href4: '#contact',
        variant4: 'secondary',
      },
      render: ({ blockWidth, align, buttonCount, label1, href1, variant1, label2, href2, variant2, label3, href3, variant3, label4, href4, variant4 }) => {
        const buttons = [
          { label: label1, href: href1, variant: variant1 },
          { label: label2, href: href2, variant: variant2 },
          { label: label3, href: href3, variant: variant3 },
          { label: label4, href: href4, variant: variant4 },
        ].slice(0, Number(buttonCount || 2))
        return (
          <ContentBlock width={blockWidth}>
            <div className={`kyklos-content-button-row kyklos-content-button-row-${align}`}>
              {buttons.map((button, index) => (
                <a key={`${button.label}-${index}`} className={`btn btn-sm btn-${button.variant}`} href={button.href || '#'}>
                  {button.label || `Button ${index + 1}`}
                </a>
              ))}
            </div>
          </ContentBlock>
        )
      },
    },
    Image: {
      label: '圖片',
      fields: {
        blockWidth: widthField,
        src: { type: 'text', label: '圖片 URL' },
        alt: { type: 'text', label: '替代文字' },
        imageWidth: { type: 'number', label: '圖片寬度 px' },
        radius: {
          type: 'select',
          label: '圓角',
          options: [{ label: '無', value: 'none' }, { label: '小', value: 'sm' }, { label: '中', value: 'md' }],
        },
      },
      defaultProps: { blockWidth: 'wide', src: '', alt: 'image', imageWidth: 520, radius: 'sm' },
      render: ({ blockWidth, src, alt, imageWidth, radius }) => (
        <ContentBlock width={blockWidth}>
          {src ? (
            <img className={`kyklos-content-image kyklos-content-radius-${radius}`} src={src} alt={alt} style={{ maxWidth: imageWidth || 520 }} />
          ) : (
            <div className={`kyklos-content-image-empty kyklos-content-radius-${radius}`} style={{ maxWidth: imageWidth || 520 }}>請填入圖片 URL</div>
          )}
        </ContentBlock>
      ),
    },
    Card: {
      label: '卡片',
      fields: {
        blockWidth: widthField,
        title: { type: 'text', label: '標題' },
        body: { type: 'textarea', label: '內文' },
        accent: {
          type: 'select',
          label: '色彩',
          options: [{ label: 'Blue', value: 'blue' }, { label: 'Green', value: 'green' }, { label: 'Amber', value: 'amber' }, { label: 'Slate', value: 'slate' }],
        },
      },
      defaultProps: { blockWidth: 'medium', title: '卡片標題', body: '卡片內容...', accent: 'blue' },
      render: ({ blockWidth, title, body, accent }) => (
        <ContentBlock width={blockWidth}>
          <div className={`kyklos-content-card kyklos-content-card-${accent}`}>
            <h3>{title}</h3>
            <p>{body}</p>
          </div>
        </ContentBlock>
      ),
    },
    FeatureGrid: {
      label: '功能卡片列',
      fields: {
        blockWidth: widthField,
        columns: {
          type: 'select',
          label: '欄數',
          options: [{ label: '2 欄', value: '2' }, { label: '3 欄', value: '3' }, { label: '4 欄', value: '4' }],
        },
        title1: { type: 'text', label: '卡片 1 標題' },
        body1: { type: 'textarea', label: '卡片 1 內容' },
        title2: { type: 'text', label: '卡片 2 標題' },
        body2: { type: 'textarea', label: '卡片 2 內容' },
        title3: { type: 'text', label: '卡片 3 標題' },
        body3: { type: 'textarea', label: '卡片 3 內容' },
        title4: { type: 'text', label: '卡片 4 標題' },
        body4: { type: 'textarea', label: '卡片 4 內容' },
      },
      defaultProps: {
        blockWidth: 'wide',
        columns: '3',
        title1: '功能一',
        body1: '功能說明文字。',
        title2: '功能二',
        body2: '功能說明文字。',
        title3: '功能三',
        body3: '功能說明文字。',
        title4: '功能四',
        body4: '功能說明文字。',
      },
      render: ({ blockWidth, columns, title1, body1, title2, body2, title3, body3, title4, body4 }) => {
        const cards = [
          { title: title1, body: body1 },
          { title: title2, body: body2 },
          { title: title3, body: body3 },
          { title: title4, body: body4 },
        ].slice(0, Number(columns || 3))
        return (
          <ContentBlock width={blockWidth}>
            <div className={`kyklos-content-feature-grid kyklos-content-grid-${columns}`}>
              {cards.map((card, index) => (
                <div className="kyklos-content-feature-card" key={`${card.title}-${index}`}>
                  <span>{index + 1}</span>
                  <h3>{card.title || `功能 ${index + 1}`}</h3>
                  <p>{card.body}</p>
                </div>
              ))}
            </div>
          </ContentBlock>
        )
      },
    },
    Stat: {
      label: '統計數字',
      fields: {
        blockWidth: widthField,
        label: { type: 'text', label: '標籤' },
        value: { type: 'text', label: '數值' },
        helper: { type: 'text', label: '輔助文字' },
      },
      defaultProps: { blockWidth: 'auto', label: 'Metric', value: '128', helper: 'updated just now' },
      render: ({ blockWidth, label, value, helper }) => (
        <ContentBlock width={blockWidth}>
          <div className="kyklos-content-stat">
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{helper}</small>
          </div>
        </ContentBlock>
      ),
    },
    StatGrid: {
      label: '統計數字列',
      fields: {
        blockWidth: widthField,
        columns: {
          type: 'select',
          label: '欄數',
          options: [{ label: '2 欄', value: '2' }, { label: '3 欄', value: '3' }, { label: '4 欄', value: '4' }],
        },
        label1: { type: 'text', label: '指標 1 名稱' },
        value1: { type: 'text', label: '指標 1 數值' },
        helper1: { type: 'text', label: '指標 1 補充' },
        label2: { type: 'text', label: '指標 2 名稱' },
        value2: { type: 'text', label: '指標 2 數值' },
        helper2: { type: 'text', label: '指標 2 補充' },
        label3: { type: 'text', label: '指標 3 名稱' },
        value3: { type: 'text', label: '指標 3 數值' },
        helper3: { type: 'text', label: '指標 3 補充' },
        label4: { type: 'text', label: '指標 4 名稱' },
        value4: { type: 'text', label: '指標 4 數值' },
        helper4: { type: 'text', label: '指標 4 補充' },
      },
      defaultProps: {
        blockWidth: 'wide',
        columns: '4',
        label1: 'Requests',
        value1: '128K',
        helper1: '+8.2%',
        label2: 'Errors',
        value2: '0.2%',
        helper2: 'stable',
        label3: 'Latency',
        value3: '84ms',
        helper3: '-12ms',
        label4: 'Alerts',
        value4: '3',
        helper4: 'open',
      },
      render: ({ blockWidth, columns, label1, value1, helper1, label2, value2, helper2, label3, value3, helper3, label4, value4, helper4 }) => {
        const stats = [
          { label: label1, value: value1, helper: helper1 },
          { label: label2, value: value2, helper: helper2 },
          { label: label3, value: value3, helper: helper3 },
          { label: label4, value: value4, helper: helper4 },
        ].slice(0, Number(columns || 4))
        return (
          <ContentBlock width={blockWidth}>
            <div className={`kyklos-content-stat-grid kyklos-content-grid-${columns}`}>
              {stats.map((stat, index) => (
                <div className="kyklos-content-stat" key={`${stat.label}-${index}`}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                  <small>{stat.helper}</small>
                </div>
              ))}
            </div>
          </ContentBlock>
        )
      },
    },
    Alert: {
      label: '提示訊息',
      fields: {
        blockWidth: widthField,
        title: { type: 'text', label: '標題' },
        body: { type: 'textarea', label: '內容' },
        kind: {
          type: 'select',
          label: '類型',
          options: [{ label: 'Info', value: 'info' }, { label: 'Success', value: 'success' }, { label: 'Warning', value: 'warning' }, { label: 'Danger', value: 'danger' }],
        },
      },
      defaultProps: { blockWidth: 'medium', title: '提示', body: '提示內容。', kind: 'info' },
      render: ({ blockWidth, title, body, kind }) => (
        <ContentBlock width={blockWidth}>
          <div className={`kyklos-content-alert kyklos-content-alert-${kind}`}>
            <strong>{title}</strong>
            <p>{body}</p>
          </div>
        </ContentBlock>
      ),
    },
    Divider: {
      label: '分隔線',
      fields: { blockWidth: widthField },
      defaultProps: { blockWidth: 'full' },
      render: ({ blockWidth }) => (
        <ContentBlock width={blockWidth}>
          <hr className="kyklos-content-divider" />
        </ContentBlock>
      ),
    },
    Spacer: {
      label: '留白',
      fields: {
        blockWidth: widthField,
        size: {
          type: 'radio',
          label: '高度',
          options: [{ label: '小', value: 'small' }, { label: '中', value: 'medium' }, { label: '大', value: 'large' }],
        },
      },
      defaultProps: { blockWidth: 'full', size: 'medium' },
      render: ({ blockWidth, size }) => (
        <ContentBlock width={blockWidth}>
          <div className={`kyklos-content-spacer kyklos-content-spacer-${size}`} />
        </ContentBlock>
      ),
    },
  },
  root: {
    fields: {
      title: { type: 'text', label: '頁面標題' },
    },
    defaultProps: { title: 'Content Page' },
    render: ({ children }) => <main className="kyklos-content-render">{children}</main>,
  },
  categories: {
    layout: { title: '版面', components: ['Hero', 'SectionTitle', 'Paragraph', 'Divider', 'Spacer'] },
    media: { title: '內容', components: ['Image', 'Card', 'FeatureGrid', 'Stat', 'StatGrid', 'Alert'] },
    action: { title: '互動', components: ['Button', 'ButtonRow'] },
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
  if (!dataJson?.trim()) return defaultData
  try {
    const parsed = JSON.parse(dataJson)
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.content)) {
      return { content: parsed.content, root: parsed.root || defaultData.root, zones: parsed.zones }
    }
  } catch { /* fall through */ }
  return defaultData
}

function countBlocks(data: Data): number {
  return Array.isArray(data.content) ? data.content.length : 0
}

function safeJson(data: Data): string {
  return JSON.stringify(data, null, 2)
}

type ContentItem = { type?: string; props?: Record<string, unknown> }

function getContentItems(data: Data): ContentItem[] {
  return Array.isArray(data.content) ? data.content as ContentItem[] : []
}

function itemTitle(item: ContentItem, index: number): string {
  const props = item.props || {}
  const title = props.title || props.text || props.label || props.eyebrow || props.value
  return typeof title === 'string' && title.trim() ? title : `${item.type || 'Block'} ${index + 1}`
}

function itemId(item: ContentItem, index: number): string {
  const id = item.props?.id
  return typeof id === 'string' && id.trim() ? id : `content-block-${index + 1}`
}

function withContent(data: Data, content: ContentItem[]): Data {
  return { ...data, content: content as Data['content'] }
}

export default function ContentEditorModal({ record, onSaved, onClose }: Props) {
  const [name, setName] = useState(record?.name || '')
  const [description, setDescription] = useState(record?.description || '')
  const [busy, setBusy] = useState(false)
  const [errMsg, setErrMsg] = useState('')
  const [notice, setNotice] = useState('')
  const [mode, setMode] = useState<'design' | 'outline' | 'preview' | 'json'>('design')
  const [puckData, setPuckData] = useState<Data>(() => parseInitialData(record?.data_json))
  const [jsonText, setJsonText] = useState(() => safeJson(parseInitialData(record?.data_json)))
  const [puckRevision, setPuckRevision] = useState(0)
  const [selectedOutlineId, setSelectedOutlineId] = useState('')

  const blockCount = useMemo(() => countBlocks(puckData), [puckData])
  const outlineItems = useMemo(() => getContentItems(puckData), [puckData])

  useEffect(() => {
    if (mode !== 'json') setJsonText(safeJson(puckData))
  }, [mode, puckData])

  const notify = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2600)
  }

  const handlePuckData = useCallback((nextData: Data) => {
    setPuckData(nextData)
  }, [])

  const saveData = async (nextData: Data) => {
    if (!name.trim()) {
      setErrMsg('請輸入名稱')
      return
    }
    setBusy(true)
    setErrMsg('')
    try {
      const body = {
        name: name.trim(),
        description: description.trim(),
        data_json: JSON.stringify(nextData),
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

  const handleSave = () => void saveData(puckData)

  const handleReset = () => {
    if (!window.confirm('確認重置為空白？所有區塊將被清空。')) return
    setPuckData(cloneData(defaultData))
    setPuckRevision((value) => value + 1)
    setSelectedOutlineId('')
    notify('已重置為空白內容')
  }

  const applyTemplate = (data: Data, label: string) => {
    if (blockCount > 0 && !window.confirm(`套用「${label}」會取代目前內容，確認繼續？`)) return
    const nextData = cloneData(data)
    setPuckData(nextData)
    setJsonText(safeJson(nextData))
    setPuckRevision((value) => value + 1)
    setSelectedOutlineId('')
    setMode('design')
    notify(`已套用模板：${label}`)
  }

  const applyJson = () => {
    try {
      const parsed = JSON.parse(jsonText)
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.content)) {
        throw new Error('JSON 必須包含 content 陣列')
      }
      const nextData = { content: parsed.content, root: parsed.root || defaultData.root, zones: parsed.zones }
      setPuckData(nextData)
      setPuckRevision((value) => value + 1)
      setSelectedOutlineId('')
      setMode('design')
      notify('JSON 已套用到設計器')
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : String(err))
    }
  }

  const downloadJson = () => {
    const blob = new Blob([safeJson(puckData)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name.trim() || 'content'}.json`
    a.click()
    URL.revokeObjectURL(url)
    notify('Content JSON 已下載')
  }

  const updateContentItems = (items: ContentItem[], message: string) => {
    setPuckData((current) => withContent(current, items))
    setPuckRevision((value) => value + 1)
    notify(message)
  }

  const moveOutlineItem = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= outlineItems.length) return
    const items = [...outlineItems]
    const [item] = items.splice(index, 1)
    items.splice(nextIndex, 0, item)
    updateContentItems(items, '區塊順序已更新')
  }

  const duplicateOutlineItem = (index: number) => {
    const items = [...outlineItems]
    const source = JSON.parse(JSON.stringify(items[index])) as ContentItem | undefined
    if (!source) return
    source.props = { ...(source.props || {}), id: `${itemId(source, index)}-copy-${Date.now()}` }
    items.splice(index + 1, 0, source)
    updateContentItems(items, '區塊已複製')
  }

  const removeOutlineItem = (index: number) => {
    if (!window.confirm(`確認刪除區塊「${itemTitle(outlineItems[index], index)}」？`)) return
    const items = outlineItems.filter((_, itemIndex) => itemIndex !== index)
    updateContentItems(items, '區塊已刪除')
  }

  return createPortal(
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal fade show" tabIndex={-1} style={{ display: 'block' }}>
        <div className="modal-dialog modal-fullscreen">
          <div className="modal-content kyklos-content-modal">
            <div className="modal-header py-2">
              <h6 className="modal-title d-flex align-items-center gap-2">
                <i className="bx bx-layout"></i>
                {record ? `編輯 Content #${record.id}` : '新增 Content'}
              </h6>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
            </div>
            <div className="modal-body p-2 d-flex flex-column">
              <div className="kyklos-content-toolbar">
                <div className="kyklos-content-meta-grid">
                  <div>
                    <label className="form-label mb-1">名稱 *</label>
                    <input className="form-control form-control-sm" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label mb-1">描述</label>
                    <input className="form-control form-control-sm" value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>
                  <div className="kyklos-content-counter">
                    <span>區塊數</span>
                    <strong>{blockCount}</strong>
                  </div>
                </div>
                <div className="kyklos-content-actions">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => applyTemplate(templateLanding, 'Landing')}>
                    <i className="bx bx-layer-plus me-1"></i>Landing 模板
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => applyTemplate(templateReport, 'Report')}>
                    <i className="bx bx-chart me-1"></i>Report 模板
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-info" onClick={downloadJson}>
                    <i className="bx bx-download me-1"></i>匯出 JSON
                  </button>
                </div>
              </div>
              {errMsg && <div className="alert alert-danger py-1 mb-2" style={{ fontSize: '.75rem' }}>{errMsg}</div>}
              {notice && <div className="alert alert-success py-1 mb-2" style={{ fontSize: '.75rem' }}>{notice}</div>}
              <div className="kyklos-content-modebar">
                <button type="button" className={mode === 'design' ? 'active' : ''} onClick={() => setMode('design')}>
                  <i className="bx bx-edit-alt"></i>設計
                </button>
                <button type="button" className={mode === 'outline' ? 'active' : ''} onClick={() => setMode('outline')}>
                  <i className="bx bx-list-ul"></i>Outline
                </button>
                <button type="button" className={mode === 'preview' ? 'active' : ''} onClick={() => setMode('preview')}>
                  <i className="bx bx-show"></i>預覽
                </button>
                <button type="button" className={mode === 'json' ? 'active' : ''} onClick={() => setMode('json')}>
                  <i className="bx bx-code-alt"></i>JSON
                </button>
              </div>
              {mode === 'design' && (
                <div className="kyklos-content-puck">
                  <Puck
                    key={puckRevision}
                    config={config}
                    data={puckData}
                    onChange={handlePuckData}
                    onPublish={(data) => void saveData(data)}
                  />
                </div>
              )}
              {mode === 'outline' && (
                <div className="kyklos-content-outline-shell">
                  <div className="kyklos-content-outline-summary">
                    <div>
                      <strong>內容結構</strong>
                      <span>{outlineItems.length} 個區塊，可在此調整順序、複製或刪除。</span>
                    </div>
                    <button type="button" className="btn btn-sm btn-primary" onClick={() => setMode('design')}>
                      <i className="bx bx-edit-alt me-1"></i>回到設計
                    </button>
                  </div>
                  {outlineItems.length === 0 ? (
                    <div className="kyklos-content-outline-empty">
                      <div>
                        <strong>Outline 是內容結構管理</strong>
                        <p>目前尚無區塊。新增區塊後，這裡會列出每個區塊，並可調整順序、複製、刪除。</p>
                        <div className="kyklos-content-outline-empty-actions">
                          <button type="button" className="btn btn-sm btn-primary" onClick={() => applyTemplate(templateLanding, 'Landing')}>
                            <i className="bx bx-layer-plus me-1"></i>套用 Landing 模板
                          </button>
                          <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => applyTemplate(templateReport, 'Report')}>
                            <i className="bx bx-chart me-1"></i>套用 Report 模板
                          </button>
                          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setMode('design')}>
                            <i className="bx bx-edit-alt me-1"></i>回到設計
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="kyklos-content-outline-list">
                      {outlineItems.map((item, index) => {
                        const id = itemId(item, index)
                        return (
                          <div
                            key={`${id}-${index}`}
                            className={`kyklos-content-outline-item ${selectedOutlineId === id ? 'active' : ''}`}
                            onClick={() => setSelectedOutlineId(id)}
                          >
                            <div className="kyklos-content-outline-index">{index + 1}</div>
                            <div className="kyklos-content-outline-main">
                              <strong>{itemTitle(item, index)}</strong>
                              <span>{item.type || 'Unknown'} · 寬度 {(item.props?.blockWidth as string) || 'full'}</span>
                            </div>
                            <div className="kyklos-content-outline-actions" onClick={(event) => event.stopPropagation()}>
                              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => moveOutlineItem(index, -1)} disabled={index === 0} title="上移">
                                <i className="bx bx-up-arrow-alt"></i>
                              </button>
                              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => moveOutlineItem(index, 1)} disabled={index === outlineItems.length - 1} title="下移">
                                <i className="bx bx-down-arrow-alt"></i>
                              </button>
                              <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => duplicateOutlineItem(index)} title="複製">
                                <i className="bx bx-copy"></i>
                              </button>
                              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeOutlineItem(index)} title="刪除">
                                <i className="bx bx-trash"></i>
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
              {mode === 'preview' && (
                <div className="kyklos-content-preview-shell">
                  <Render config={config} data={puckData} />
                </div>
              )}
              {mode === 'json' && (
                <div className="kyklos-content-json-shell">
                  <textarea
                    className="form-control"
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    spellCheck={false}
                  />
                  <div className="d-flex justify-content-end gap-2 mt-2">
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setJsonText(safeJson(puckData))}>還原目前內容</button>
                    <button type="button" className="btn btn-sm btn-primary" onClick={applyJson}>套用 JSON</button>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer py-2">
              <span className="text-muted me-auto" style={{ fontSize: '.7rem' }}>
                <i className="bx bx-info-circle me-1"></i>Content 編輯器 · Puck 視覺化區塊設計，資料以 JSON 儲存
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
