import { useEffect, useMemo, useState } from 'react'
import {
  Input as SemiInput,
  InputNumber as SemiInputNumber,
  TextArea as SemiTextArea,
  Select as SemiSelect,
  Radio as SemiRadio,
  Switch as SemiSwitch,
  DatePicker as SemiDatePicker,
  TimePicker as SemiTimePicker,
  Checkbox as SemiCheckbox,
  Button as SemiButton,
  Tag as SemiTag,
  Empty as SemiEmpty,
  Tooltip as SemiTooltip,
  Banner as SemiBanner,
  Tabs as SemiTabs,
  TabPane as SemiTabPane,
  Avatar as SemiAvatar,
  Typography as SemiTypography,
  Divider as SemiDivider,
  InputGroup as SemiInputGroup,
} from '@douyinfe/semi-ui'
import {
  IconPlus,
  IconDelete,
  IconArrowUp,
  IconArrowDown,
  IconSave,
  IconClose,
  IconDownload,
  IconList,
  IconComponent,
  IconAlignCenter,
  IconText,
  IconCalendar,
  IconClock,
  IconSend,
  IconCheckboxTick,
  IconFemale,
  IconPulse,
  IconBranch,
  IconBox,
  IconTextRectangle,
  IconAlertTriangle,
  IconColorPalette,
  IconLoading,
  IconSetting,
  IconChevronRight,
  IconChevronDown,
} from '@douyinfe/semi-icons'
import { createForm, onFieldValueChange } from '@formily/core'
import { FormProvider, createSchemaField, connect, mapProps } from '@formily/react'
import { getApiBase } from '../../../../utils/api'
import 'semi-ui-css'
import './form-editor-layout.css'

export type FormRecord = {
  id: number
  name: string
  description: string
  form_schema_json: string
  created_at: string
  updated_at: string
}

type FieldType =
  | 'string' | 'textarea' | 'number' | 'integer' | 'boolean'
  | 'date' | 'dateRange' | 'time' | 'timeRange' | 'week' | 'month' | 'year' | 'quarter' | 'dateTime'
  | 'email' | 'password' | 'url' | 'tel' | 'search' | 'color'
  | 'select' | 'multiSelect' | 'treeSelect' | 'cascader' | 'radio' | 'checkboxGroup' | 'switch'
  | 'rate' | 'slider' | 'stepper' | 'transfer' | 'tagInput' | 'autoComplete' | 'cascader'
  | 'upload' | 'avatar' | 'colorPicker' | 'mention' | 'signature'
  | 'object' | 'list' | 'array' | 'container' | 'tabs' | 'grid' | 'divider' | 'text' | 'html'
  | 'button' | 'link' | 'image'

type FormField = {
  id: string
  name: string
  title: string
  type: FieldType
  description?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  hidden?: boolean
  defaultValue?: unknown
  options?: Array<{ label: string; value: string }>
  'x-component'?: string
  'x-component-props'?: Record<string, unknown>
  'x-decorator-props'?: Record<string, unknown>
}

type FormSchema = {
  type: 'object'
  title?: string
  description?: string
  properties: Record<string, FormField>
}

type Props = {
  record: FormRecord | null
  visible: boolean
  onSaved: () => void
  onClose: () => void
}

type FieldCategory = 'basic' | 'input' | 'select' | 'datetime' | 'layout' | 'media' | 'advanced'

type FieldTemplate = {
  value: FieldType
  label: string
  component: string
  category: FieldCategory
  icon: React.ReactNode
  description: string
  defaultProps: Record<string, unknown>
  hasOptions?: boolean
}

const fieldTemplates: FieldTemplate[] = [
  // ── basic ──
  { value: 'string', label: '單行文字', component: 'Input', category: 'basic', icon: <IconText />, description: '最基本的輸入欄位', defaultProps: { placeholder: '請輸入...' } },
  { value: 'textarea', label: '多行文字', component: 'Input.TextArea', category: 'basic', icon: <IconTextRectangle />, description: '多行輸入 / 描述', defaultProps: { placeholder: '請輸入...' } },
  { value: 'number', label: '數字', component: 'InputNumber', category: 'basic', icon: <IconLoading />, description: '數值輸入', defaultProps: { placeholder: '請輸入數字' } },
  { value: 'integer', label: '整數', component: 'InputNumber', category: 'basic', icon: <IconLoading />, description: '整數輸入', defaultProps: { placeholder: '0' } },
  { value: 'boolean', label: '開關', component: 'Switch', category: 'basic', icon: <IconBranch />, description: '布林值', defaultProps: {} },
  { value: 'date', label: '日期', component: 'DatePicker', category: 'basic', icon: <IconCalendar />, description: '選擇日期', defaultProps: {} },

  // ── input ──
  { value: 'email', label: 'Email', component: 'Input', category: 'input', icon: <IconSend />, description: 'Email 格式', defaultProps: { type: 'email', placeholder: 'name@example.com' } },
  { value: 'password', label: '密碼', component: 'Input', category: 'input', icon: <IconSetting />, description: '密碼輸入', defaultProps: { type: 'password', placeholder: '••••••' } },
  { value: 'url', label: '網址', component: 'Input', category: 'input', icon: <IconComponent />, description: 'URL 格式', defaultProps: { type: 'url', placeholder: 'https://...' } },
  { value: 'tel', label: '電話', component: 'Input', category: 'input', icon: <IconFemale />, description: '電話號碼', defaultProps: { type: 'tel', placeholder: '0912-345-678' } },
  { value: 'search', label: '搜尋', component: 'Input', category: 'input', icon: <IconAlignCenter />, description: '搜尋欄位', defaultProps: { type: 'search' } },
  { value: 'color', label: '顏色', component: 'Input', category: 'input', icon: <IconAlertTriangle />, description: '顏色選擇', defaultProps: { type: 'color' } },
  { value: 'rate', label: '評分', component: 'Rate', category: 'input', icon: <IconFemale />, description: '星級評分 (1-5)', defaultProps: { count: 5 } },
  { value: 'slider', label: '滑桿', component: 'Slider', category: 'input', icon: <IconPulse />, description: '數值滑桿', defaultProps: { min: 0, max: 100, step: 1 } },
  { value: 'stepper', label: '步進器', component: 'InputNumber', category: 'input', icon: <IconPlus />, description: '增減步進', defaultProps: { min: 0, max: 999, step: 1 } },
  { value: 'signature', label: '簽名', component: 'Input', category: 'input', icon: <IconText />, description: '簽名欄位', defaultProps: { type: 'text' } },
  { value: 'mention', label: '@提及', component: 'Input.TextArea', category: 'input', icon: <IconBranch />, description: '@提及輸入', defaultProps: { placeholder: '輸入 @ 提及...' } },

  // ── select ──
  { value: 'select', label: '下拉選單', component: 'Select', category: 'select', icon: <IconChevronDown />, description: '單選下拉', defaultProps: {}, hasOptions: true },
  { value: 'multiSelect', label: '多選下拉', component: 'Select', category: 'select', icon: <IconChevronDown />, description: '多選下拉', defaultProps: { multiple: true }, hasOptions: true },
  { value: 'treeSelect', label: '樹狀選單', component: 'TreeSelect', category: 'select', icon: <IconBox />, description: '樹狀結構選擇', defaultProps: {}, hasOptions: true },
  { value: 'cascader', label: '層級選擇', component: 'Cascader', category: 'select', icon: <IconBox />, description: '層級聯動選擇', defaultProps: {}, hasOptions: true },
  { value: 'radio', label: '單選群組', component: 'Radio.Group', category: 'select', icon: <IconCheckboxTick />, description: '單選按鈕群組', defaultProps: {}, hasOptions: true },
  { value: 'checkboxGroup', label: '複選群組', component: 'Checkbox.Group', category: 'select', icon: <IconCheckboxTick />, description: '多選核取方塊群組', defaultProps: {}, hasOptions: true },
  { value: 'transfer', label: '穿梭選單', component: 'Select', category: 'select', icon: <IconBranch />, description: '雙欄穿梭選單', defaultProps: { multiple: true }, hasOptions: true },
  { value: 'tagInput', label: '標籤輸入', component: 'TagInput', category: 'select', icon: <IconFemale />, description: '標籤式多選輸入', defaultProps: {}, hasOptions: true },
  { value: 'autoComplete', label: '自動完成', component: 'AutoComplete', category: 'select', icon: <IconAlignCenter />, description: '輸入即建議', defaultProps: {}, hasOptions: true },

  // ── datetime ──
  { value: 'dateRange', label: '日期區間', component: 'DatePicker', category: 'datetime', icon: <IconCalendar />, description: '起訖日期', defaultProps: { type: 'dateRange' } },
  { value: 'time', label: '時間', component: 'TimePicker', category: 'datetime', icon: <IconClock />, description: '選擇時間', defaultProps: {} },
  { value: 'timeRange', label: '時間區間', component: 'TimePicker', category: 'datetime', icon: <IconClock />, description: '起訖時間', defaultProps: { type: 'timeRange' } },
  { value: 'week', label: '週', component: 'DatePicker', category: 'datetime', icon: <IconCalendar />, description: '週選擇', defaultProps: { type: 'week' } },
  { value: 'month', label: '月', component: 'DatePicker', category: 'datetime', icon: <IconCalendar />, description: '月份選擇', defaultProps: { type: 'month' } },
  { value: 'year', label: '年', component: 'DatePicker', category: 'datetime', icon: <IconCalendar />, description: '年份選擇', defaultProps: { type: 'year' } },
  { value: 'quarter', label: '季', component: 'DatePicker', category: 'datetime', icon: <IconCalendar />, description: '季度選擇', defaultProps: { type: 'quarter' } },
  { value: 'dateTime', label: '日期時間', component: 'DatePicker', category: 'datetime', icon: <IconCalendar />, description: '日期 + 時間', defaultProps: { type: 'dateTime' } },

  // ── media ──
  { value: 'upload', label: '上傳', component: 'Upload', category: 'media', icon: <IconSend />, description: '檔案上傳', defaultProps: {} },
  { value: 'avatar', label: '頭像', component: 'Avatar', category: 'media', icon: <IconFemale />, description: '頭像上傳', defaultProps: {} },
  { value: 'colorPicker', label: '色彩選擇器', component: 'ColorPicker', category: 'media', icon: <IconColorPalette />, description: '色彩挑選', defaultProps: {} },

  // ── layout ──
  { value: 'object', label: '群組容器', component: 'ObjectField', category: 'layout', icon: <IconBox />, description: '巢狀欄位群組', defaultProps: {} },
  { value: 'list', label: '陣列容器', component: 'ArrayField', category: 'layout', icon: <IconAlignCenter />, description: '重複欄位組', defaultProps: {} },
  { value: 'array', label: '靜態陣列', component: 'Input', category: 'layout', icon: <IconAlignCenter />, description: 'JSON 陣列', defaultProps: {} },
  { value: 'container', label: '容器', component: 'div', category: 'layout', icon: <IconBox />, description: '純容器', defaultProps: {} },
  { value: 'tabs', label: '分頁', component: 'Tabs', category: 'layout', icon: <IconBranch />, description: '分頁容器', defaultProps: {} },
  { value: 'grid', label: '格狀', component: 'div', category: 'layout', icon: <IconBox />, description: '格狀佈局', defaultProps: {} },
  { value: 'divider', label: '分隔線', component: 'Divider', category: 'layout', icon: <IconAlertTriangle />, description: '水平分隔線', defaultProps: {} },
  { value: 'text', label: '純文字', component: 'Typography.Text', category: 'layout', icon: <IconText />, description: '純文字標籤', defaultProps: {} },
  { value: 'html', label: 'HTML', component: 'div', category: 'layout', icon: <IconComponent />, description: '自訂 HTML', defaultProps: {} },
  { value: 'button', label: '按鈕', component: 'Button', category: 'layout', icon: <IconBranch />, description: '動作按鈕', defaultProps: { children: '按鈕' } },
  { value: 'link', label: '連結', component: 'Typography.Text', category: 'layout', icon: <IconBranch />, description: '超連結', defaultProps: { link: { href: '#', target: '_blank' } } },
  { value: 'image', label: '圖片', component: 'Avatar', category: 'media', icon: <IconFemale />, description: '顯示圖片', defaultProps: {} },
]

const CATEGORIES: Array<{ value: FieldCategory; label: string }> = [
  { value: 'basic', label: '基本輸入' },
  { value: 'input', label: '進階輸入' },
  { value: 'select', label: '選擇' },
  { value: 'datetime', label: '日期時間' },
  { value: 'layout', label: '佈局' },
  { value: 'media', label: '媒體' },
]

const TEMPLATE_MAP = new Map(fieldTemplates.map((t) => [t.value, t]))

function getTemplate(fieldType: FieldType): FieldTemplate {
  return TEMPLATE_MAP.get(fieldType) || fieldTemplates[0]
}

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
  if (!res.ok || json.code !== 0) {
    throw new Error(json.msg || `HTTP ${res.status}`)
  }
  return json.data as T
}

function newField(index: number, type: FieldType = 'string'): FormField {
  const tpl = getTemplate(type)
  const id = `f_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 7)}`
  return {
    id,
    name: `field_${index + 1}`,
    title: `欄位 ${index + 1}`,
    type,
    description: tpl.description,
    placeholder: typeof tpl.defaultProps.placeholder === 'string' ? tpl.defaultProps.placeholder : '',
    required: false,
    disabled: false,
    hidden: false,
    'x-component': tpl.component,
    'x-component-props': { ...tpl.defaultProps },
  }
}

function parseFields(schema: string | null | undefined): { fields: FormField[]; title?: string; description?: string } {
  if (!schema?.trim()) return { fields: [] }
  try {
    const parsed = JSON.parse(schema)
    if (parsed?.type === 'object' && parsed.properties) {
      const fields = Object.entries<Record<string, unknown>>(parsed.properties as Record<string, Record<string, unknown>>).map(
        ([name, field]) => {
          const rawType = (typeof field.type === 'string' ? field.type : 'string') as FieldType
          const tpl = getTemplate(rawType)
          const props = typeof field['x-component-props'] === 'object' && field['x-component-props']
            ? field['x-component-props'] as Record<string, unknown>
            : {}
          return {
            id: typeof field.id === 'string' ? field.id : `legacy_${name}`,
            name,
            title: typeof field.title === 'string' ? field.title : name,
            type: rawType,
            description: typeof field.description === 'string' ? field.description : undefined,
            placeholder: typeof props.placeholder === 'string' ? props.placeholder : '',
            required: Boolean(field.required),
            disabled: Boolean(field.disabled),
            hidden: Boolean(field.hidden),
            'x-component': typeof field['x-component'] === 'string' ? field['x-component'] : tpl.component,
            'x-component-props': props,
          }
        },
      )
      return { fields, title: parsed.title as string | undefined, description: parsed.description as string | undefined }
    }
    return { fields: [] }
  } catch {
    return { fields: [] }
  }
}

function stringifySchema(fields: FormField[]): string {
  const properties: Record<string, Record<string, unknown>> = {}
  fields.forEach((field) => {
    if (!field.name.trim()) return
    const tpl = getTemplate(field.type)
    const { id, name, type, title, description, placeholder, required, disabled, hidden, 'x-component': comp, 'x-component-props': props } = field
    const cleanProps: Record<string, unknown> = {}
    if (placeholder && placeholder !== tpl.defaultProps.placeholder) cleanProps.placeholder = placeholder
    if (comp && comp !== tpl.component) cleanProps['x-component'] = comp
    const entry: Record<string, unknown> = {
      type,
      title: title || name,
      'x-decorator': 'FormItem',
      'x-component': comp || tpl.component,
    }
    if (id && !id.startsWith('legacy_')) entry.id = id
    if (description) entry.description = description
    if (required) entry.required = true
    if (disabled) entry.disabled = true
    if (hidden) entry.hidden = true
    if (Object.keys(cleanProps).length > 0) entry['x-component-props'] = cleanProps
    properties[name] = entry
  })
  return JSON.stringify({ type: 'object', properties }, null, 2)
}

/* ---------- Formily 預覽：Semi UI 元件（以 connect 接入 Formily 狀態）
   注意：這些不是 disabled / readonly —— Formily 編輯器
   預設就是可互動的表單，可即時看到實際運作效果。 */

type FieldProps = {
  value?: unknown
  onChange?: (v: unknown) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  options?: Array<{ label: string; value: string }> | string[]
  type?: string
  text?: string
  multiple?: boolean
}

const PreviewInput = connect(
  (props: FieldProps) => (
    <SemiInput
      value={typeof props.value === 'string' || typeof props.value === 'number' ? String(props.value) : ''}
      onChange={(v: string) => props.onChange?.(v)}
      placeholder={props.placeholder}
      type={props.type as 'text' | 'password' | 'email' | 'number' | undefined}
      disabled={props.disabled}
    />
  ),
  mapProps({ value: true, placeholder: true, type: true, disabled: true }),
)

const PreviewTextArea = connect(
  (props: FieldProps) => (
    <SemiTextArea
      value={typeof props.value === 'string' || typeof props.value === 'number' ? String(props.value) : ''}
      onChange={(v: string) => props.onChange?.(v)}
      placeholder={props.placeholder}
      disabled={props.disabled}
      rows={3}
    />
  ),
  mapProps({ value: true, placeholder: true, disabled: true }),
)

const PreviewInputNumber = connect(
  (props: FieldProps) => (
    <SemiInputNumber
      value={typeof props.value === 'number' ? props.value : undefined}
      onChange={(v: number) => props.onChange?.(v)}
      placeholder={props.placeholder}
      disabled={props.disabled}
    />
  ),
  mapProps({ value: true, placeholder: true, disabled: true }),
)

const PreviewSwitch = connect(
  (props: FieldProps) => (
    <SemiSwitch checked={Boolean(props.value)} onChange={(v: boolean) => props.onChange?.(v)} disabled={props.disabled} text={props.text} />
  ),
  mapProps({ value: true, disabled: true, text: true }),
)

const PreviewCheckbox = connect(
  (props: FieldProps) => (
    <SemiCheckbox checked={Boolean(props.value)} onChange={(e) => props.onChange?.(e.target.checked)} disabled={props.disabled}>
      {props.text}
    </SemiCheckbox>
  ),
  mapProps({ value: true, disabled: true, text: true }),
)

const PreviewSelect = connect(
  (props: FieldProps) => {
    const opts = (props.options || []).map((item) => {
      if (typeof item === 'string') return { label: item, value: item }
      return item
    })
    return (
      <SemiSelect
        value={typeof props.value === 'string' || props.value === 'number' ? String(props.value) : ''}
        onChange={(v: string | string[]) => props.onChange?.(v)}
        placeholder={props.placeholder}
        disabled={props.disabled}
        optionList={opts}
        multiple={props.multiple}
      />
    )
  },
  mapProps({ value: true, placeholder: true, options: true, disabled: true, multiple: true }),
)

const PreviewRadioGroup = connect(
  (props: FieldProps) => {
    const opts = (props.options || []).map((item) => {
      if (typeof item === 'string') return { label: item, value: item }
      return item
    })
    return (
      <SemiRadio.Group
        value={typeof props.value === 'string' || props.value === 'number' ? String(props.value) : ''}
        onChange={(e) => props.onChange?.(e.target.value)}
        disabled={props.disabled}
        options={opts}
      />
    )
  },
  mapProps({ value: true, options: true, disabled: true }),
)

const PreviewDatePicker = connect(
  (props: FieldProps) => (
    <SemiDatePicker
      value={typeof props.value === 'string' ? props.value : undefined}
      onChange={(v: string) => props.onChange?.(v)}
      disabled={props.disabled}
    />
  ),
  mapProps({ value: true, disabled: true }),
)

const PreviewTimePicker = connect(
  (props: FieldProps) => (
    <SemiTimePicker
      value={typeof props.value === 'string' ? props.value : undefined}
      onChange={(v: string) => props.onChange?.(v)}
      disabled={props.disabled}
    />
  ),
  mapProps({ value: true, disabled: true }),
)

const PreviewText = connect(
  (props: { text?: string; value?: string; children?: React.ReactNode }) => (
    <SemiTypography.Text>{props.text || props.value || (props.children as string) || '文字'}</SemiTypography.Text>
  ),
)

const PreviewDivider = connect(() => <SemiDivider />)

/* FormItem decorator：標題 + 必填星號 + 描述 + 錯誤訊息（與 Formily 編輯器一致） */
const PreviewFormItem = connect(
  (props: { title?: string; required?: boolean; description?: string; children?: React.ReactNode; errors?: string[]; decoratorProps?: Record<string, unknown> }) => {
    const showError = Array.isArray(props.errors) && props.errors.length > 0
    return (
      <div className={`kyklos-form-item ${showError ? 'has-error' : ''}`} style={props.decoratorProps as React.CSSProperties}>
        {props.title && (
          <label className="kyklos-form-item-label">
            <span>{props.title}</span>
            {props.required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
          </label>
        )}
        {props.description && <div className="kyklos-form-item-desc">{props.description}</div>}
        <div className="kyklos-form-item-control">{props.children}</div>
        {showError && <div className="kyklos-form-item-error">{props.errors![0]}</div>}
      </div>
    )
  },
  mapProps({ title: true, required: true, description: true, decoratorProps: true }),
)

const { SchemaField } = createSchemaField({
  components: {
    Input: PreviewInput,
    'Input.TextArea': PreviewTextArea,
    InputNumber: PreviewInputNumber,
    Select: PreviewSelect,
    Switch: PreviewSwitch,
    Checkbox: PreviewCheckbox,
    'Radio.Group': PreviewRadioGroup,
    DatePicker: PreviewDatePicker,
    TimePicker: PreviewTimePicker,
    Typography: PreviewText,
    Text: PreviewText,
    Divider: PreviewDivider,
    FormItem: PreviewFormItem,
  },
})

function buildFormSchema(fields: FormField[]): Record<string, unknown> {
  const properties: Record<string, Record<string, unknown>> = {}
  fields.forEach((field) => {
    if (!field.name.trim() || !field.title.trim()) return
    const tpl = getTemplate(field.type)
    // 將不在 Preview 元件中的型別，fallback 到最接近的 Semi UI 元件
    const supportedComponents = new Set(['Input', 'Input.TextArea', 'InputNumber', 'Select', 'Switch', 'Checkbox', 'Radio.Group', 'DatePicker', 'TimePicker', 'Typography', 'Text', 'Divider', 'FormItem'])
    let comp = field['x-component'] || tpl.component
    if (!supportedComponents.has(comp)) {
      const fallbackMap: Record<string, string> = {
        Rate: 'InputNumber', Slider: 'InputNumber', Stepper: 'InputNumber',
        Upload: 'Input', Avatar: 'Input', ColorPicker: 'Input',
        TagInput: 'Select', Transfer: 'Select', AutoComplete: 'Input', TreeSelect: 'Select', Cascader: 'Select',
        Image: 'Input', Tabs: 'Typography', Grid: 'Typography',
        Container: 'Typography', ObjectField: 'Typography', ArrayField: 'Typography', Array: 'Input',
        Divider: 'Divider', Text: 'Text', HTML: 'Typography', Button: 'Typography', Link: 'Typography',
        Signature: 'Input', Mention: 'Input.TextArea', Hidden: 'Input',
      }
      comp = fallbackMap[comp] || 'Input'
    }
    const baseProps = (field['x-component-props'] && Object.keys(field['x-component-props']).length > 0)
      ? field['x-component-props']
      : tpl.defaultProps
    const props = { ...baseProps }
    if (field.placeholder) props.placeholder = field.placeholder
    if (field.options && field.options.length > 0) {
      const optArr = (Array.isArray(props.options) ? (props.options as string[]).map((o) => ({ label: o, value: o })) : field.options)
      props.options = optArr
    }
    if (comp === 'Select' && field.type === 'multiSelect') props.multiple = true
    // 對應 Semi UI 元件實際 prop name
    if (comp === 'Input' && field.type === 'password') props.type = 'password'
    if (comp === 'Input' && field.type === 'email') props.type = 'email'
    if (comp === 'Input' && field.type === 'url') props.type = 'url'
    if (comp === 'Input' && field.type === 'tel') props.type = 'tel'
    if (comp === 'Input' && field.type === 'search') props.type = 'search'
    if (comp === 'Input' && field.type === 'color') props.type = 'color'
    if (comp === 'Input' && (field.type === 'number' || field.type === 'integer' || field.type === 'stepper')) comp = 'InputNumber'
    const entry: Record<string, unknown> = {
      type: field.type,
      title: field.title,
      'x-decorator': 'FormItem',
      'x-component': comp,
      'x-decorator-props': {},
      'x-component-props': props,
    }
    if (field.description) entry.description = field.description
    if (field.required) entry.required = true
    if (field.disabled) entry.disabled = true
    if (field.hidden) entry.hidden = true
    if (field.id) entry.id = field.id
    properties[field.name] = entry
  })
  return { type: 'object', properties }
}

function safeUid(prefix = 'f'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

const DEFAULT_OPTIONS_TEXT = '選項1, 選項2, 選項3'

export default function FormEditorModal({ record, visible, onSaved, onClose }: Props) {
  const [name, setName] = useState(record?.name || '')
  const [description, setDescription] = useState(record?.description || '')
  const [busy, setBusy] = useState(false)
  const [errMsg, setErrMsg] = useState('')
  const [fields, setFields] = useState<FormField[]>([])
  const [jsonText, setJsonText] = useState('{}')
  const [jsonDirty, setJsonDirty] = useState(false)
  const [activeCategory, setActiveCategory] = useState<FieldCategory>('basic')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchTemplate, setSearchTemplate] = useState('')
  const [dragState, setDragState] = useState<{ fromIndex: number | null; type: FieldType | null }>({ fromIndex: null, type: null })

  useEffect(() => {
    if (!visible) {
      setSelectedId(null)
      setSearchTemplate('')
      return
    }
    const result = parseFields(record?.form_schema_json)
    setName(record?.name || '')
    setDescription(record?.description || '')
    setFields(result.fields)
    setJsonText(stringifySchema(result.fields))
    setJsonDirty(false)
  }, [visible, record])

  useEffect(() => {
    if (!jsonDirty) setJsonText(stringifySchema(fields))
  }, [fields, jsonDirty])

  const form = useMemo(
    () => {
      // 為每個欄位提供示例預設值，讓 Formily 預覽看起來像真實的編輯表單
      const sampleValues: Record<string, unknown> = {}
      fields.forEach((field, i) => {
        if (field.name && field.defaultValue !== undefined) {
          sampleValues[field.name] = field.defaultValue
        } else if (field.name) {
          const tpl = getTemplate(field.type)
          switch (field.type) {
            case 'string': case 'textarea': case 'email': case 'url': case 'tel': case 'search':
              sampleValues[field.name] = `範例 ${field.title || field.name}`.slice(0, 20)
              break
            case 'number': case 'integer': case 'stepper':
              sampleValues[field.name] = (i + 1) * 10
              break
            case 'boolean': case 'switch':
              sampleValues[field.name] = i % 2 === 0
              break
            case 'select': case 'multiSelect': case 'treeSelect': case 'cascader': case 'radio': case 'checkboxGroup':
              if (field.options && field.options.length > 0) {
                const firstOpt = field.options[0]
                sampleValues[field.name] = typeof firstOpt === 'string' ? firstOpt : (firstOpt as { value: string }).value
              }
              break
            case 'date': case 'dateTime': case 'dateRange':
              sampleValues[field.name] = new Date().toISOString().split('T')[0]
              break
            case 'time': case 'timeRange':
              sampleValues[field.name] = '12:00'
              break
            case 'rate': sampleValues[field.name] = 4; break
            case 'slider': sampleValues[field.name] = 50; break
            case 'color': sampleValues[field.name] = '#3b82f6'; break
            default:
              if (tpl.component === 'Switch' || tpl.component === 'Checkbox') sampleValues[field.name] = false
              break
          }
        }
      })
      return createForm({
        values: sampleValues,
        effects() {
          onFieldValueChange('*', () => {})
        },
      })
    },
    [fields],
  )

  const selectedField = useMemo(
    () => (selectedId ? fields.find((f) => f.id === selectedId) || null : null),
    [selectedId, fields],
  )

  const filteredTemplates = useMemo(() => {
    const q = searchTemplate.trim().toLowerCase()
    return fieldTemplates.filter((t) => {
      if (t.category !== activeCategory && q === '') return false
      if (q === '') return true
      return t.label.includes(q) || t.description.includes(q) || t.value.toLowerCase().includes(q)
    })
  }, [activeCategory, searchTemplate])

  const schemaForSave = () => {
    if (!jsonDirty) return stringifySchema(fields)
    return jsonText
  }

  /* ---------- Drag and Drop handlers
     注意：HTML5 Drag and Drop 的 dataTransfer.types 在 dragover 階段
     行為不一致（部分瀏覽器拿不到自訂 MIME），所以用 component state（dragState）
     與 CSS class（is-palette-drag / is-reorder-drag）做視覺與邏輯判斷。
     ---------- */

  const [dragMode, setDragMode] = useState<'palette' | 'reorder' | null>(null)

  const handlePaletteDragStart = (e: React.DragEvent<HTMLDivElement>, type: FieldType) => {
    setDragState({ fromIndex: null, type })
    setDragMode('palette')
    e.dataTransfer.setData('application/x-formily-field-type', type)
    e.dataTransfer.setData('text/plain', type) // 兼容部分瀏覽器
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleFieldDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDragState({ fromIndex: index, type: null })
    setDragMode('reorder')
    e.dataTransfer.setData('application/x-formily-field-index', String(index))
    e.dataTransfer.setData('text/plain', String(index))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDragState({ fromIndex: null, type: null })
    setDragMode(null)
  }

  const handleFieldDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = dragMode === 'palette' ? 'copy' : 'move'
  }

  const handleFieldDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    const newType = (e.dataTransfer.getData('application/x-formily-field-type') ||
      (dragMode === 'palette' ? e.dataTransfer.getData('text/plain') : '')) as FieldType | null
    const fromIndexStr = e.dataTransfer.getData('application/x-formily-field-index') ||
      (dragMode === 'reorder' ? e.dataTransfer.getData('text/plain') : '')

    if (newType && fieldTemplates.some((t) => t.value === newType)) {
      // 從 palette 拖入新欄位
      setFields((current) => {
        const insertAt = Math.min(targetIndex, current.length)
        const next = [...current]
        next.splice(insertAt, 0, newField(insertAt, newType as FieldType))
        return next.map((f, i) => ({ ...f, name: f.name.startsWith('field_') ? `field_${i + 1}` : f.name, title: f.title.startsWith('欄位 ') && /^欄位 \d+$/.test(f.title) ? `欄位 ${i + 1}` : f.title }))
      })
    } else if (fromIndexStr !== '') {
      const fromIndex = Number(fromIndexStr)
      if (Number.isNaN(fromIndex) || fromIndex === targetIndex) {
        handleDragEnd()
        return
      }
      setFields((current) => {
        if (fromIndex < 0 || fromIndex >= current.length) return current
        const next = [...current]
        const [item] = next.splice(fromIndex, 1)
        const insertAt = fromIndex < targetIndex ? targetIndex - 1 : targetIndex
        next.splice(Math.min(insertAt, next.length), 0, item)
        return next
      })
    }
    setJsonDirty(false)
    handleDragEnd()
  }

  const handleCanvasDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = dragMode === 'palette' ? 'copy' : 'move'
  }

  const handleCanvasDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const newType = (e.dataTransfer.getData('application/x-formily-field-type') ||
      (dragMode === 'palette' ? e.dataTransfer.getData('text/plain') : '')) as FieldType | null
    if (newType && fieldTemplates.some((t) => t.value === newType)) {
      setFields((current) => {
        const insertAt = current.length
        const next = [...current]
        next.splice(insertAt, 0, newField(insertAt, newType as FieldType))
        return next
      })
      setJsonDirty(false)
    } else {
      // 處理重排序（拖到畫布空白處 = 移到最尾）
      const fromIndexStr = e.dataTransfer.getData('application/x-formily-field-index') ||
        (dragMode === 'reorder' ? e.dataTransfer.getData('text/plain') : '')
      if (fromIndexStr !== '') {
        const fromIndex = Number(fromIndexStr)
        if (!Number.isNaN(fromIndex)) {
          setFields((current) => {
            if (fromIndex < 0 || fromIndex >= current.length) return current
            const next = [...current]
            const [item] = next.splice(fromIndex, 1)
            next.push(item)
            return next
          })
          setJsonDirty(false)
        }
      }
    }
    handleDragEnd()
  }

  /* ---------- Field operations ---------- */

  const setField = (id: string, patch: Partial<FormField>) => {
    setFields((current) => current.map((field) => {
      if (field.id !== id) return field
      const next = { ...field, ...patch }
      if (patch.type) {
        const tpl = getTemplate(patch.type)
        next['x-component'] = tpl.component
        next['x-component-props'] = { ...tpl.defaultProps, ...(next['x-component-props'] || {}) }
        if (!tpl.hasOptions && next['x-component-props'] && Array.isArray((next['x-component-props'] as Record<string, unknown>).options)) {
          const np = { ...next['x-component-props'] } as Record<string, unknown>
          delete np.options
          next['x-component-props'] = np
        }
      }
      return next
    }))
    setJsonDirty(false)
  }

  const addField = (type: FieldType = 'string') => {
    setFields((current) => [...current, newField(current.length, type)])
    setJsonDirty(false)
  }

  const removeField = (id: string) => {
    setFields((current) => current.filter((f) => f.id !== id))
    if (selectedId === id) setSelectedId(null)
    setJsonDirty(false)
  }

  const moveFieldBy = (id: string, offset: number) => {
    setFields((current) => {
      const idx = current.findIndex((f) => f.id === id)
      if (idx < 0) return current
      const target = idx + offset
      if (target < 0 || target >= current.length) return current
      const next = [...current]
      const [item] = next.splice(idx, 1)
      next.splice(target, 0, item)
      return next
    })
    setJsonDirty(false)
  }

  const applyJson = () => {
    try {
      JSON.parse(jsonText)
      const result = parseFields(jsonText)
      setFields(result.fields)
      setSelectedId(null)
      setJsonDirty(false)
      setErrMsg('')
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : String(err))
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setErrMsg('請輸入名稱')
      return
    }
    if (fields.some((f) => !f.name.trim())) {
      setErrMsg('所有欄位都必須有欄位名')
      return
    }
    setBusy(true)
    setErrMsg('')
    try {
      const body = { name: name.trim(), description: description.trim(), form_schema_json: schemaForSave() }
      if (record) {
        await formApi(`/api/apiman/forms/${record.id}`, { method: 'PUT', body: JSON.stringify(body) })
      } else {
        await formApi('/api/apiman/forms', { method: 'POST', body: JSON.stringify(body) })
      }
      onSaved()
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const handleExportJson = () => {
    const schema = jsonDirty ? jsonText : stringifySchema(fields)
    const blob = new Blob([schema], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name.trim() || 'form'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!visible) return null
  const SafeSchemaField = typeof SchemaField !== 'undefined' ? SchemaField : null

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal fade show" tabIndex={-1} style={{ display: 'block' }}>
        <div className="modal-dialog modal-xxl" style={{ maxWidth: '99vw' }}>
          <div className="modal-content" style={{ height: '94vh' }}>
            <div className="modal-header py-2">
              <h6 className="modal-title d-flex align-items-center gap-2">
                <IconList />
                {record ? `編輯 Form #${record.id}` : '新增 Form'}
              </h6>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
            </div>
            <div className="modal-body p-3" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div className="row g-2 mb-2">
                <div className="col-md-4">
                  <label className="form-label mb-1" style={{ fontSize: '.7rem' }}>名稱 *</label>
                  <SemiInput value={name} onChange={(v: string) => setName(v)} placeholder="例如 訂單表單" />
                </div>
                <div className="col-md-6">
                  <label className="form-label mb-1" style={{ fontSize: '.7rem' }}>描述</label>
                  <SemiInput value={description} onChange={(v: string) => setDescription(v)} placeholder="表單說明（選填）" />
                </div>
                <div className="col-md-2 d-flex align-items-end">
                  <SemiTag color="blue" type="solid" size="large">{fields.length} 個欄位</SemiTag>
                </div>
              </div>
              {errMsg && (
                <SemiBanner type="danger" className="mb-2" closeIcon={null}>{errMsg}</SemiBanner>
              )}
              <div className="kyklos-form-builder">
                {/* 左：元件庫 */}
                <div className="kyklos-form-palette">
                  <strong className="kyklos-form-palette-title">
                    <IconComponent style={{ marginRight: 4 }} />
                    元件庫
                  </strong>
                  <SemiInput
                    size="small"
                    placeholder="搜尋元件..."
                    prefix={<IconComponent />}
                    value={searchTemplate}
                    onChange={(v: string) => setSearchTemplate(v)}
                    style={{ marginBottom: 8 }}
                  />
                  <div className="kyklos-form-palette-tabs">
                    {CATEGORIES.map((cat) => {
                      const count = fieldTemplates.filter((t) => t.category === cat.value).length
                      return (
                        <div
                          key={cat.value}
                          className={`kyklos-form-palette-tab ${activeCategory === cat.value ? 'active' : ''}`}
                          onClick={() => setActiveCategory(cat.value)}
                        >
                          {cat.label} <span className="count">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="kyklos-form-palette-items">
                    {filteredTemplates.map((tpl) => (
                      <div
                        key={tpl.value}
                        className="kyklos-form-palette-item"
                        draggable
                        onDragStart={(e) => handlePaletteDragStart(e, tpl.value)}
                        onClick={() => addField(tpl.value)}
                        title={`拖曳到畫布，或點擊加入：${tpl.label}`}
                      >
                        <span className="kyklos-form-palette-item-icon">{tpl.icon}</span>
                        <span className="kyklos-form-palette-item-label">{tpl.label}</span>
                        <span className="kyklos-form-palette-item-comp">{tpl.component}</span>
                      </div>
                    ))}
                    {filteredTemplates.length === 0 && (
                      <SemiEmpty description="沒有符合的元件" style={{ padding: 12 }} />
                    )}
                  </div>
                </div>

                {/* 中：拖放畫布 */}
                <div className="kyklos-form-canvas">
                  <div className="d-flex align-items-center mb-2">
                    <strong style={{ fontSize: '.8125rem' }}>畫布（拖放元件到此）</strong>
                    <div className="ms-auto d-flex align-items-center gap-1">
                      <SemiButton size="small" type="tertiary" icon={<IconPlus />} onClick={() => addField('string')}>
                        快速新增
                      </SemiButton>
                    </div>
                  </div>
                  <div
                    className={`kyklos-form-canvas-body ${dragMode === 'palette' ? 'is-drop-target is-palette-drag' : ''} ${dragMode === 'reorder' ? 'is-reorder-drag' : ''}`}
                    onDragOver={handleCanvasDragOver}
                    onDrop={handleCanvasDrop}
                  >
                    {fields.length === 0 ? (
                      <div className="kyklos-form-canvas-empty">
                        <div className="text-muted">
                          <IconComponent style={{ fontSize: '2.5rem', opacity: 0.3 }} />
                          <div className="mt-2">拖曳左側元件到這裡</div>
                          <div style={{ fontSize: '.7rem' }}>或點擊元件加入</div>
                        </div>
                      </div>
                    ) : (
                      <div className="kyklos-form-canvas-list">
                        {fields.map((field, index) => {
                          const tpl = getTemplate(field.type)
                          return (
                            <div
                              key={field.id}
                              className={`kyklos-form-canvas-item ${selectedId === field.id ? 'selected' : ''} ${dragState.fromIndex === index ? 'dragging' : ''}`}
                              draggable
                              onDragStart={(e) => handleFieldDragStart(e, index)}
                              onDragEnd={handleDragEnd}
                              onDragOver={handleFieldDragOver}
                              onDrop={(e) => handleFieldDrop(e, index)}
                              onClick={() => setSelectedId(field.id)}
                            >
                              <div className="kyklos-form-canvas-item-handle" title="拖曳以重新排序">
                                <IconLoading />
                              </div>
                              <div className="kyklos-form-canvas-item-icon">{tpl.icon}</div>
                              <div className="kyklos-form-canvas-item-info">
                                <div className="kyklos-form-canvas-item-title">
                                  {field.title || '(未命名)'}
                                  {field.required && <span className="text-danger ms-1">*</span>}
                                </div>
                                <div className="kyklos-form-canvas-item-meta">
                                  <SemiTag size="small" color="grey">{tpl.label}</SemiTag>
                                  <code className="ms-1">{field.name}</code>
                                  {field.placeholder && <span className="ms-2 text-muted">= "{field.placeholder}"</span>}
                                </div>
                              </div>
                              <div className="kyklos-form-canvas-item-actions" onClick={(e) => e.stopPropagation()}>
                                <SemiTooltip content="上移">
                                  <SemiButton size="small" type="tertiary" icon={<IconArrowUp />} onClick={() => moveFieldBy(field.id, -1)} />
                                </SemiTooltip>
                                <SemiTooltip content="下移">
                                  <SemiButton size="small" type="tertiary" icon={<IconArrowDown />} onClick={() => moveFieldBy(field.id, 1)} />
                                </SemiTooltip>
                                <SemiTooltip content="刪除">
                                  <SemiButton size="small" type="danger" theme="borderless" icon={<IconDelete />} onClick={() => removeField(field.id)} />
                                </SemiTooltip>
                              </div>
                            </div>
                          )
                        })}
                        <div
                          className="kyklos-form-canvas-dropzone"
                          onDragOver={handleFieldDragOver}
                          onDrop={(e) => handleFieldDrop(e, fields.length)}
                        >
                          + 拖曳至此或點擊加入
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 右：屬性 / 預覽 */}
                <div className="kyklos-form-side">
                  <SemiTabs type="line" activeKey="props" tabPosition="top" size="small" style={{ flexShrink: 0 }}>
                    <SemiTabPane tab={<span><IconSetting /> 屬性</span>} itemKey="props">
                      <div className="kyklos-form-props">
                        {!selectedField ? (
                          <SemiEmpty description="點擊畫布中的欄位以編輯屬性" style={{ padding: 24 }} />
                        ) : (
                          <FieldPropsEditor
                            field={selectedField}
                            onChange={(patch) => setField(selectedField.id, patch)}
                            onDelete={() => removeField(selectedField.id)}
                          />
                        )}
                      </div>
                    </SemiTabPane>
                    <SemiTabPane tab={<span><IconAlignCenter /> Formily 預覽</span>} itemKey="preview">
                      <div className="kyklos-form-preview-header">
                        <SemiTypography.Text type="secondary" style={{ fontSize: '.7rem' }}>
                          <IconAlignCenter style={{ marginRight: 4, fontSize: '.8rem' }} />
                          這是實際的 Formily 即時編輯表單 — 與 Formily 設計工具渲染一致，可即時輸入測試
                        </SemiTypography.Text>
                      </div>
                      <div className="kyklos-form-preview-body">
                        {fields.length === 0 ? (
                          <SemiEmpty description="尚無可預覽欄位" style={{ padding: 24 }} />
                        ) : SafeSchemaField ? (
                          <FormProvider form={form}>
                            <SafeSchemaField schema={buildFormSchema(fields)} />
                          </FormProvider>
                        ) : (
                          <SemiEmpty description="Formily 載入失敗" style={{ padding: 24 }} />
                        )}
                      </div>
                    </SemiTabPane>
                    <SemiTabPane tab={<span>JSON</span>} itemKey="json">
                      <div className="d-flex align-items-center mb-2">
                        <strong style={{ fontSize: '.75rem' }}>JSON Schema</strong>
                        <SemiButton size="small" type="tertiary" onClick={applyJson} style={{ marginLeft: 'auto' }}>
                          套用 JSON
                        </SemiButton>
                      </div>
                      <SemiTextArea
                        value={jsonText}
                        onChange={(v: string) => { setJsonText(v); setJsonDirty(true) }}
                        spellCheck={false}
                        style={{ minHeight: 360, fontFamily: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', fontSize: '.7rem' }}
                      />
                    </SemiTabPane>
                  </SemiTabs>
                </div>
              </div>
            </div>
            <div className="modal-footer py-2">
              <span className="text-muted me-auto" style={{ fontSize: '.7rem' }}>
                <IconList style={{ marginRight: 4 }} />
                Form Builder · @formily/react + @douyinfe/semi-ui（{fieldTemplates.length} 種元件，拖拉式）
              </span>
              <SemiButton type="tertiary" icon={<IconDownload />} onClick={handleExportJson} disabled={busy}>
                匯出 JSON
              </SemiButton>
              <SemiButton type="secondary" icon={<IconClose />} onClick={onClose} disabled={busy}>
                取消
              </SemiButton>
              <SemiButton type="primary" theme="solid" icon={<IconSave />} onClick={handleSave} loading={busy}>
                {busy ? '儲存中...' : '儲存'}
              </SemiButton>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function FieldPropsEditor({ field, onChange, onDelete }: { field: FormField; onChange: (patch: Partial<FormField>) => void; onDelete: () => void }) {
  const tpl = getTemplate(field.type)
  const props = field['x-component-props'] || {}
  const updateProp = (key: string, value: unknown) => {
    onChange({ 'x-component-props': { ...props, [key]: value } })
  }
  const optionsText = Array.isArray(props.options)
    ? (props.options as Array<{ label?: string; value?: string } | string>).map((o) => typeof o === 'string' ? o : o.label || '').join(', ')
    : ''

  return (
    <div className="kyklos-form-props-grid">
      <div className="kyklos-form-props-row">
        <label>類型</label>
        <select className="form-select form-select-sm" value={field.type} onChange={(e) => onChange({ type: e.target.value as FieldType })}>
          {CATEGORIES.map((cat) => (
            <optgroup key={cat.value} label={cat.label}>
              {fieldTemplates.filter((t) => t.category === cat.value).map((tpl) => (
                <option key={tpl.value} value={tpl.value}>{tpl.label} ({tpl.component})</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <div className="kyklos-form-props-row">
        <label>標籤</label>
        <SemiInput value={field.title} onChange={(v: string) => onChange({ title: v })} />
      </div>
      <div className="kyklos-form-props-row">
        <label>欄位名</label>
        <SemiInput value={field.name} onChange={(v: string) => onChange({ name: v })} />
      </div>
      <div className="kyklos-form-props-row">
        <label>提示文字</label>
        <SemiInput value={field.placeholder || ''} onChange={(v: string) => onChange({ placeholder: v })} />
      </div>
      <div className="kyklos-form-props-row">
        <label>描述</label>
        <SemiTextArea value={field.description || ''} onChange={(v: string) => onChange({ description: v })} rows={2} />
      </div>
      {tpl.hasOptions && (
        <div className="kyklos-form-props-row">
          <label>選項（逗號分隔）</label>
          <SemiTextArea
            value={optionsText}
            onChange={(v: string) => updateProp('options', v.split(',').map((s) => ({ label: s.trim(), value: s.trim() })).filter((s) => s.value))}
            rows={3}
          />
        </div>
      )}
      <div className="kyklos-form-props-row">
        <label>預設值</label>
        <SemiInput
          value={field.defaultValue === undefined ? '' : String(field.defaultValue)}
          onChange={(v: string) => onChange({ defaultValue: v })}
          placeholder="選填"
        />
      </div>
      <div className="kyklos-form-props-row kyklos-form-props-toggles">
        <label>選項</label>
        <div className="d-flex flex-wrap gap-3">
          <SemiSwitch checked={Boolean(field.required)} onChange={(v: boolean) => onChange({ required: v })} text="必填" />
          <SemiSwitch checked={Boolean(field.disabled)} onChange={(v: boolean) => onChange({ disabled: v })} text="停用" />
          <SemiSwitch checked={Boolean(field.hidden)} onChange={(v: boolean) => onChange({ hidden: v })} text="隱藏" />
        </div>
      </div>
      <div className="kyklos-form-props-row kyklos-form-props-raw">
        <label>進階（x-component-props）</label>
        <SemiTextArea
          value={JSON.stringify(props, null, 2)}
          onChange={(v: string) => {
            try { onChange({ 'x-component-props': JSON.parse(v) || {} }) } catch { /* ignore parse error */ }
          }}
          spellCheck={false}
          rows={4}
          style={{ fontFamily: 'Menlo, Monaco, Consolas, monospace', fontSize: '.65rem' }}
        />
      </div>
      <div className="kyklos-form-props-actions">
        <SemiButton type="danger" theme="borderless" block icon={<IconDelete />} onClick={onDelete}>
          刪除此欄位
        </SemiButton>
      </div>
    </div>
  )
}
