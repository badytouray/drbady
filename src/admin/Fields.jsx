import { useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2, Upload } from 'lucide-react'
import { ICON_CHOICES, Icon } from '../lib/icons'
import { slugify, uploadImage } from '../lib/api'

export function ImageField({ value, onChange }) {
  const ref = useRef()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  async function pick(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setBusy(true); setErr('')
    try { onChange(await uploadImage(f)) } catch (ex) { setErr(ex.message) }
    setBusy(false)
    e.target.value = ''
  }
  return (
    <div className="a-image">
      <div className="a-image-preview">{value ? <img src={value} alt="" /> : <span>No image</span>}</div>
      <div className="a-image-ctl">
        <button type="button" className="a-btn" onClick={() => ref.current.click()} disabled={busy}>
          <Upload size={16} /> {busy ? 'Uploading…' : 'Upload image'}
        </button>
        <input ref={ref} type="file" accept="image/*" hidden onChange={pick} />
        <input placeholder="…or paste an image URL" value={value || ''} onChange={(e) => onChange(e.target.value)} />
        {err && <small className="a-err">{err}</small>}
      </div>
    </div>
  )
}

function IconField({ value, onChange }) {
  return (
    <div className="a-icons">
      {ICON_CHOICES.map((n) => (
        <button type="button" key={n} title={n} className={value === n ? 'on' : ''} onClick={() => onChange(n)}>
          <Icon name={n} size={20} />
        </button>
      ))}
    </div>
  )
}

const move = (arr, i, d) => {
  const a = [...arr]
  const j = i + d
  if (j < 0 || j >= a.length) return a
  ;[a[i], a[j]] = [a[j], a[i]]
  return a
}

function ListField({ value = [], onChange }) {
  const v = value || []
  return (
    <div className="a-list">
      {v.map((item, i) => (
        <div key={i} className="a-list-row">
          <input value={item} onChange={(e) => onChange(v.map((x, k) => (k === i ? e.target.value : x)))} />
          <button type="button" className="a-ico" onClick={() => onChange(move(v, i, -1))} aria-label="Move up"><ArrowUp size={16} /></button>
          <button type="button" className="a-ico" onClick={() => onChange(move(v, i, 1))} aria-label="Move down"><ArrowDown size={16} /></button>
          <button type="button" className="a-ico danger" onClick={() => onChange(v.filter((_, k) => k !== i))} aria-label="Remove"><Trash2 size={16} /></button>
        </div>
      ))}
      <button type="button" className="a-btn ghost" onClick={() => onChange([...v, ''])}><Plus size={16} /> Add item</button>
    </div>
  )
}

function LinksField({ value = [], onChange }) {
  const v = value || []
  const upd = (i, k, val) => onChange(v.map((x, j) => (j === i ? { ...x, [k]: val } : x)))
  return (
    <div className="a-list">
      {v.map((l, i) => (
        <div key={i} className="a-link-row">
          <select value={l.icon || ''} onChange={(e) => upd(i, 'icon', e.target.value)} aria-label="Icon">
            {ICON_CHOICES.map((n) => <option key={n}>{n}</option>)}
          </select>
          <span className="a-link-ico"><Icon name={l.icon} size={18} /></span>
          <input placeholder="Label" value={l.label || ''} onChange={(e) => upd(i, 'label', e.target.value)} />
          <input placeholder="https://…" value={l.url || ''} onChange={(e) => upd(i, 'url', e.target.value)} />
          <button type="button" className="a-ico" onClick={() => onChange(move(v, i, -1))} aria-label="Move up"><ArrowUp size={16} /></button>
          <button type="button" className="a-ico" onClick={() => onChange(move(v, i, 1))} aria-label="Move down"><ArrowDown size={16} /></button>
          <button type="button" className="a-ico danger" onClick={() => onChange(v.filter((_, k) => k !== i))} aria-label="Remove"><Trash2 size={16} /></button>
        </div>
      ))}
      <button type="button" className="a-btn ghost" onClick={() => onChange([...v, { label: '', icon: 'ChevronRight', url: '' }])}><Plus size={16} /> Add link</button>
    </div>
  )
}

/** Free-text tags: type and press Enter or comma. Stored as text[]. */
export function TagsField({ value, onChange, placeholder = 'Add a tag and press Enter' }) {
  const v = value || []
  const [draft, setDraft] = useState('')
  const add = (raw) => {
    const t = raw.trim().replace(/^#/, '').toLowerCase()
    if (t && !v.includes(t)) onChange([...v, t])
    setDraft('')
  }
  return (
    <div className="a-tags">
      {v.map((t) => (
        <span key={t} className="a-tag">#{t}<button type="button" onClick={() => onChange(v.filter((x) => x !== t))} aria-label={`Remove ${t}`}>×</button></span>
      ))}
      <input
        value={draft}
        placeholder={v.length ? '' : placeholder}
        onChange={(e) => (e.target.value.endsWith(',') ? add(e.target.value.slice(0, -1)) : setDraft(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); add(draft) }
          if (e.key === 'Backspace' && !draft && v.length) onChange(v.slice(0, -1))
        }}
        onBlur={() => draft && add(draft)}
      />
    </div>
  )
}

/** ISO timestamp <-> <input type=datetime-local> value (local time). */
export const toLocalInput = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export function CharCount({ value = '', min, max }) {
  const n = (value || '').length
  const cls = !n ? '' : n > max ? 'bad' : min && n < min ? 'warn' : 'good'
  return <small className={`a-count ${cls}`}>{n} / {max}</small>
}

export function Field({ f, value, onChange, row }) {
  let input
  switch (f.type) {
    case 'textarea':
      input = <textarea rows={f.rows || 3} value={value || ''} onChange={(e) => onChange(e.target.value)} required={f.required} maxLength={f.maxLength} />
      break
    case 'slug':
      input = (
        <div className="a-inline">
          <input value={value || ''} onChange={(e) => onChange(slugify(e.target.value))} required />
          <button type="button" className="a-btn ghost" onClick={() => onChange(slugify(row?.[f.from] || ''))}>From title</button>
        </div>
      )
      break
    case 'image': input = <ImageField value={value} onChange={onChange} />; break
    case 'icon': input = <IconField value={value} onChange={onChange} />; break
    case 'color':
      input = (
        <div className="a-inline">
          <input type="color" value={value || '#F5A300'} onChange={(e) => onChange(e.target.value)} />
          <input value={value || ''} onChange={(e) => onChange(e.target.value)} />
        </div>
      )
      break
    case 'number': input = <input type="number" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} />; break
    case 'date': input = <input type="date" value={value || ''} onChange={(e) => onChange(e.target.value || null)} />; break
    case 'bool':
      input = (
        <label className="a-switch">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          <span /> {value ? 'Visible on site' : 'Hidden'}
        </label>
      )
      break
    case 'select':
      input = <select value={value || ''} onChange={(e) => onChange(e.target.value)}>{f.options.map((o) => <option key={o}>{o}</option>)}</select>
      break
    case 'list': input = <ListField value={value} onChange={onChange} />; break
    case 'tags': input = <TagsField value={value} onChange={onChange} />; break
    case 'datetime': input = <input type="datetime-local" value={toLocalInput(value)} onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)} />; break
    case 'links': input = <LinksField value={value} onChange={onChange} />; break
    default:
      input = <input value={value || ''} onChange={(e) => onChange(e.target.value)} required={f.required} />
  }
  return (
    <div className={`a-field ${f.half ? 'half' : ''}`}>
      <span className="a-label">{f.label}{f.required && ' *'}{f.max && <CharCount value={value} min={f.min} max={f.max} />}</span>
      {input}
      {f.help && <small className="a-help">{f.help}</small>}
    </div>
  )
}
