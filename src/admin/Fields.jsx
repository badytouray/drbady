import { useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2, Upload } from 'lucide-react'
import { ICON_CHOICES, Icon } from '../lib/icons'
import { slugify, uploadImage } from '../lib/api'

function ImageField({ value, onChange }) {
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

export function Field({ f, value, onChange, row }) {
  let input
  switch (f.type) {
    case 'textarea':
      input = <textarea rows={f.rows || 3} value={value || ''} onChange={(e) => onChange(e.target.value)} required={f.required} />
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
    case 'links': input = <LinksField value={value} onChange={onChange} />; break
    default:
      input = <input value={value || ''} onChange={(e) => onChange(e.target.value)} required={f.required} />
  }
  return (
    <div className={`a-field ${f.half ? 'half' : ''}`}>
      <span className="a-label">{f.label}{f.required && ' *'}</span>
      {input}
      {f.help && <small className="a-help">{f.help}</small>}
    </div>
  )
}
