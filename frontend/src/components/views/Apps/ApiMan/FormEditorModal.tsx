import { useEffect, useMemo, useState } from 'react'
import { createForm, onFieldValueChange } from '@formily/core'
import { FormProvider, createSchemaField, connect, mapProps } from '@formily/react'
import { getApiBase } from '../../../../utils/api'
import './form-editor-layout.css'

export type FormRecord = {
  id: number
  name: string
  description: string
  form_schema_json: string
  created_at: string
  updated_at: string
}

type FieldType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'date' | 'textarea' | 'email' | 'password' | 'select' | 'radio'

type FormField = {
  name: string
  title: string
  type: FieldType
  description?: string
  'x-component'?: string
  'x-component-props'?: Record<string, unknown>
}

type Props = {
  record: FormRecord | null
  visible: boolean
  onSaved: () => void
  onClose: () => void
}

const fieldTypes: Array<{ value: FieldType; label: string; component: string }> = [
  { value: 'string', label: '文字', component: 'Input' },
  { value: 'textarea', label: '多行文字', component: 'Input.TextArea' },
  { value: 'number', label: '數字', component: 'InputNumber' },
  { value: 'email', label: 'Email', component: 'Input' },
  { value: 'password', label: '密碼', component: 'Input' },
  { value: 'select', label: '下拉選單', component: 'Select' },
  { value: 'boolean', label: '核取方塊', component: 'Switch' },
  { value: 'radio', label: '單選', component: 'Radio.Group' },
  { value: 'date', label: '日期', component: 'DatePicker' },
]

const FIELD_TYPE_MAP = new Map(fieldTypes.map((item) => [item.value, item]))

function toComponentType(fieldType: FieldType): string {
  return FIELD_TYPE_MAP.get(fieldType)?.component || 'Input'
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

function newField(index: number): FormField {
  return {
    name: `field_${index + 1}`,
    title: `欄位 ${index + 1}`,
    type: 'string',
    'x-component': 'Input',
    'x-component-props': { placeholder: '' },
  }
}

function parseFields(schema: string | null | undefined): { fields: FormField[]; title?: string; description?: string } {
  if (!schema?.trim()) return { fields: [] }
  try {
    const parsed = JSON.parse(schema)
    if (parsed?.type === 'object' && parsed.properties) {
      const fields = Object.entries<Record<string, unknown>>(parsed.properties as Record<string, Record<string, unknown>>).map(
        ([name, field]) => ({
          name,
          title: typeof field.title === 'string' ? field.title : name,
          type: (typeof field.type === 'string' ? field.type : 'string') as FieldType,
          description: typeof field.description === 'string' ? field.description : undefined,
          'x-component': typeof field['x-component'] === 'string' ? field['x-component'] : toComponentType(field.type as FieldType),
          'x-component-props': typeof field['x-component-props'] === 'object' && field['x-component-props'] ? field['x-component-props'] as Record<string, unknown> : {},
        }),
      )
      return { fields, title: parsed.title as string | undefined, description: parsed.description as string | undefined }
    }
    return { fields: [] }
  } catch {
    return { fields: [] }
  }
}

function stringifySchema(fields: FormField[], title?: string, description?: string): string {
  const properties: Record<string, Record<string, unknown>> = {}
  fields.forEach((field) => {
    const { name, type, title: fTitle, description: fDesc, 'x-component': comp, 'x-component-props': props } = field
    const entry: Record<string, unknown> = {
      type,
      title: fTitle || name,
      'x-decorator': 'FormItem',
      'x-component': comp || toComponentType(type),
    }
    if (fDesc) entry.description = fDesc
    if (props && Object.keys(props).length > 0) entry['x-component-props'] = props
    properties[name] = entry
  })
  const schema: Record<string, unknown> = { type: 'object', properties }
  if (title) schema.title = title
  if (description) schema.description = description
  return JSON.stringify(schema, null, 2)
}

function needsOptions(type: FieldType): boolean {
  return type === 'select' || type === 'radio'
}

/* ---------- Formily Bootstrap 元件（以 connect 注入 Formily 狀態） ---------- */

type FieldProps = {
  value?: unknown
  onChange?: (v: unknown) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  options?: string[] | Array<{ label: string; value: string }>
  className?: string
  style?: React.CSSProperties
  type?: string
  id?: string
}

const PreviewInput = connect(
  (props: FieldProps) => (
    <input
      className={`form-control form-control-sm ${props.className || ''}`}
      value={typeof props.value === 'string' || typeof props.value === 'number' ? String(props.value) : ''}
      onChange={(e) => props.onChange?.(e.target.value)}
      placeholder={props.placeholder}
      type={props.type || 'text'}
      disabled={props.disabled}
      readOnly
    />
  ),
  mapProps({
    value: true,
    placeholder: true,
    type: true,
    disabled: true,
  }),
)

const PreviewTextArea = connect(
  (props: FieldProps) => (
    <textarea
      className="form-control form-control-sm"
      value={typeof props.value === 'string' || typeof props.value === 'number' ? String(props.value) : ''}
      onChange={(e) => props.onChange?.(e.target.value)}
      placeholder={props.placeholder}
      disabled={props.disabled}
      readOnly
      rows={3}
    />
  ),
  mapProps({
    value: true,
    placeholder: true,
    disabled: true,
  }),
)

const PreviewInputNumber = connect(
  (props: FieldProps) => (
    <input
      className="form-control form-control-sm"
      value={typeof props.value === 'string' || typeof props.value === 'number' ? String(props.value) : ''}
      onChange={(e) => props.onChange?.(e.target.value === '' ? undefined : Number(e.target.value))}
      placeholder={props.placeholder}
      type="number"
      disabled={props.disabled}
      readOnly
    />
  ),
  mapProps({
    value: true,
    placeholder: true,
    disabled: true,
  }),
)

const PreviewSelect = connect(
  (props: FieldProps) => {
    const opts = (props.options || []).map((item) => {
      if (typeof item === 'string') return { label: item, value: item }
      return item
    })
    const value = typeof props.value === 'string' || typeof props.value === 'number' ? String(props.value) : ''
    return (
      <select className="form-select form-select-sm" value={value} onChange={(e) => props.onChange?.(e.target.value)} disabled={props.disabled}>
        <option value="">{props.placeholder || '請選擇'}</option>
        {opts.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
    )
  },
  mapProps({
    value: true,
    placeholder: true,
    options: true,
    disabled: true,
  }),
)

const PreviewSwitch = connect(
  (props: FieldProps) => (
    <div className="form-check form-switch">
      <input
        className="form-check-input"
        type="checkbox"
        checked={Boolean(props.value)}
        onChange={(e) => props.onChange?.(e.target.checked)}
        disabled={props.disabled}
        readOnly
      />
    </div>
  ),
  mapProps({
    value: true,
    disabled: true,
  }),
)

const PreviewRadioGroup = connect(
  (props: FieldProps) => {
    const opts = (props.options || []).map((item) => {
      if (typeof item === 'string') return { label: item, value: item }
      return item
    })
    return (
      <div>
        {opts.map((item) => (
          <div className="form-check form-check-inline" key={item.value}>
            <input
              className="form-check-input"
              type="radio"
              checked={props.value === item.value}
              onChange={() => props.onChange?.(item.value)}
              disabled={props.disabled}
              readOnly
            />
            <label className="form-check-label small">{item.label}</label>
          </div>
        ))}
      </div>
    )
  },
  mapProps({
    value: true,
    options: true,
    disabled: true,
  }),
)

const PreviewDatePicker = connect(
  (props: FieldProps) => (
    <input
      className="form-control form-control-sm"
      type="date"
      value={typeof props.value === 'string' ? props.value : ''}
      onChange={(e) => props.onChange?.(e.target.value)}
      disabled={props.disabled}
      readOnly
    />
  ),
  mapProps({
    value: true,
    disabled: true,
  }),
)

const PreviewFormItem = connect(
  (props: { title?: string; required?: boolean; children?: React.ReactNode }) => (
    <div className="mb-2">
      {props.title && (
        <label className="form-label mb-1 small">
          {props.title}
          {props.required && <span className="text-danger ms-1">*</span>}
        </label>
      )}
      {props.children}
    </div>
  ),
)

const { SchemaField } = createSchemaField({
  components: {
    Input: PreviewInput,
    'Input.TextArea': PreviewTextArea,
    InputNumber: PreviewInputNumber,
    Select: PreviewSelect,
    Switch: PreviewSwitch,
    'Radio.Group': PreviewRadioGroup,
    DatePicker: PreviewDatePicker,
    FormItem: PreviewFormItem,
  },
})

function buildFormSchema(fields: FormField[]): Record<string, unknown> {
  const properties: Record<string, Record<string, unknown>> = {}
  fields.forEach((field) => {
    if (!field.name.trim() || !field.title.trim()) return
    const comp = field['x-component'] || toComponentType(field.type)
    const entry: Record<string, unknown> = {
      type: field.type,
      title: field.title,
      'x-decorator': 'FormItem',
      'x-component': comp,
      'x-decorator-props': {},
    }
    if (field.description) entry.description = field.description
    if (field['x-component-props']) {
      const props = { ...field['x-component-props'] }
      if (Boolean(props.required)) {
        entry.required = true
        delete props.required
      }
      if (Object.keys(props).length > 0) entry['x-component-props'] = props
    }
    properties[field.name] = entry
  })
  return { type: 'object', properties }
}

export default function FormEditorModal({ record, visible, onSaved, onClose }: Props) {
  const [name, setName] = useState(record?.name || '')
  const [description, setDescription] = useState(record?.description || '')
  const [busy, setBusy] = useState(false)
  const [errMsg, setErrMsg] = useState('')
  const [fields, setFields] = useState<FormField[]>([])
  const [jsonText, setJsonText] = useState('{}')
  const [jsonDirty, setJsonDirty] = useState(false)

  useEffect(() => {
    if (!visible) return
    const result = parseFields(record?.form_schema_json)
    setName(record?.name || '')
    setDescription(record?.description || '')
    setFields(result.fields)
    setJsonText(stringifySchema(result.fields, result.title, result.description))
    setJsonDirty(false)
  }, [visible, record])

  useEffect(() => {
    if (!jsonDirty) setJsonText(stringifySchema(fields, undefined, undefined))
  }, [fields, jsonDirty])

  const form = useMemo(
    () => createForm({
      values: {},
      effects() {
        onFieldValueChange('*', () => {})
      },
    }),
    [],
  )

  const previewFields = useMemo(
    () => fields.filter((field) => field.title.trim() && field.name.trim()),
    [fields],
  )

  const setField = (index: number, patch: Partial<FormField>) => {
    setFields((current) => current.map((field, i) => {
      if (i !== index) return field
      const next = { ...field, ...patch }
      if (patch.type) {
        next['x-component'] = toComponentType(patch.type)
        if (!needsOptions(patch.type)) {
          const props = { ...next['x-component-props'] }
          delete (props as Record<string, unknown>).options
          next['x-component-props'] = props
        }
      }
      return next
    }))
    setJsonDirty(false)
  }

  const addField = () => {
    setFields((current) => [...current, newField(current.length)])
    setJsonDirty(false)
  }

  const removeField = (index: number) => {
    setFields((current) => current.filter((_, i) => i !== index))
    setJsonDirty(false)
  }

  const moveField = (index: number, offset: number) => {
    setFields((current) => {
      const target = index + offset
      if (target < 0 || target >= current.length) return current
      const next = [...current]
      const [item] = next.splice(index, 1)
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
      setJsonDirty(false)
      setErrMsg('')
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : String(err))
    }
  }

  const schemaForSave = () => {
    if (!jsonDirty) return stringifySchema(fields, undefined, undefined)
    return jsonText
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setErrMsg('請輸入名稱')
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
    const schema = jsonDirty ? jsonText : stringifySchema(fields, undefined, undefined)
    const blob = new Blob([schema], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name.trim() || 'form'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!visible) return null

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal fade show" tabIndex={-1} style={{ display: 'block' }}>
        <div className="modal-dialog modal-xl" style={{ maxWidth: '95vw' }}>
          <div className="modal-content" style={{ height: '92vh' }}>
            <div className="modal-header py-2">
              <h6 className="modal-title d-flex align-items-center gap-2">
                <i className="bx bx-list-check"></i>
                {record ? `編輯 Form #${record.id}` : '新增 Form'}
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
                  <span className="badge bg-label-info">{fields.length} 欄位</span>
                </div>
              </div>
              {errMsg && <div className="alert alert-danger py-1 mb-2" style={{ fontSize: '.75rem' }}>{errMsg}</div>}
              <div className="kyklos-form-layout">
                <div className="kyklos-form-fields">
                  <div className="d-flex align-items-center mb-2">
                    <strong style={{ fontSize: '.8125rem' }}>欄位設定</strong>
                    <button type="button" className="btn btn-sm btn-primary ms-auto" onClick={addField}>
                      <i className="bx bx-plus me-1"></i>新增欄位
                    </button>
                  </div>
                  <div className="table-responsive kyklos-form-table">
                    <table className="table table-sm align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: '8%' }}>排序</th>
                          <th style={{ width: '14%' }}>類型</th>
                          <th style={{ width: '18%' }}>標籤</th>
                          <th style={{ width: '18%' }}>欄位名</th>
                          <th style={{ width: '18%' }}>提示</th>
                          <th style={{ width: '16%' }}>選項</th>
                          <th style={{ width: '8%' }} className="text-end">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fields.length === 0 ? (
                          <tr><td colSpan={7} className="text-center text-muted py-4">尚無欄位，點擊「新增欄位」開始。</td></tr>
                        ) : fields.map((field, index) => (
                          <tr key={index}>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button type="button" className="btn btn-outline-secondary" onClick={() => moveField(index, -1)} disabled={index === 0} title="上移"><i className="bx bx-up-arrow-alt"></i></button>
                                <button type="button" className="btn btn-outline-secondary" onClick={() => moveField(index, 1)} disabled={index === fields.length - 1} title="下移"><i className="bx bx-down-arrow-alt"></i></button>
                              </div>
                            </td>
                            <td>
                              <select className="form-select form-select-sm" value={field.type} onChange={(e) => setField(index, { type: e.target.value as FieldType })}>
                                {fieldTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                              </select>
                            </td>
                            <td><input className="form-control form-control-sm" value={field.title} onChange={(e) => setField(index, { title: e.target.value })} /></td>
                            <td><input className="form-control form-control-sm" value={field.name} onChange={(e) => setField(index, { name: e.target.value })} /></td>
                            <td>
                              <input className="form-control form-control-sm" value={String(field['x-component-props']?.placeholder ?? '')} onChange={(e) => setField(index, { 'x-component-props': { ...field['x-component-props'], placeholder: e.target.value } })} />
                            </td>
                            <td>
                              {needsOptions(field.type) ? (
                                <input className="form-control form-control-sm" value={Array.isArray(field['x-component-props']?.options) ? (field['x-component-props']?.options as string[]).join(', ') : ''} onChange={(e) => setField(index, { 'x-component-props': { ...field['x-component-props'], options: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) } })} placeholder="A, B, C" />
                              ) : (
                                <div className="form-check">
                                  <input className="form-check-input" type="checkbox" checked={Boolean(field['x-component-props']?.required)} onChange={(e) => setField(index, { 'x-component-props': { ...field['x-component-props'], required: e.target.checked } })} id={`field-required-${index}`} />
                                  <label className="form-check-label small" htmlFor={`field-required-${index}`}>必填</label>
                                </div>
                              )}
                            </td>
                            <td className="text-end">
                              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeField(index)} title="刪除"><i className="bx bx-trash"></i></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="kyklos-form-side">
                  <div className="kyklos-form-preview">
                    <strong style={{ fontSize: '.8125rem' }}>預覽 (Formily)</strong>
                    <div className="mt-2">
                      {previewFields.length === 0 ? (
                        <div className="text-muted small">尚無可預覽欄位</div>
                      ) : (
                        <FormProvider form={form}>
                          <SchemaField schema={buildFormSchema(fields)} />
                        </FormProvider>
                      )}
                    </div>
                  </div>
                  <div className="kyklos-form-json">
                    <div className="d-flex align-items-center mb-2">
                      <strong style={{ fontSize: '.8125rem' }}>JSON Schema</strong>
                      <button type="button" className="btn btn-sm btn-outline-secondary ms-auto" onClick={applyJson}>套用 JSON</button>
                    </div>
                    <textarea className="form-control form-control-sm" style={{ height: 320 }} value={jsonText} onChange={(e) => { setJsonText(e.target.value); setJsonDirty(true) }} spellCheck={false}></textarea>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer py-2">
              <span className="text-muted me-auto" style={{ fontSize: '.7rem' }}>
                <i className="bx bx-info-circle me-1"></i>Formily JSON Schema 表單編輯器
              </span>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleExportJson}>
                <i className="bx bx-download me-1"></i>匯出 JSON
              </button>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose} disabled={busy}>取消</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleSave} disabled={busy}>
                <i className="bx bx-save me-1"></i>{busy ? '儲存中...' : '儲存'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
