import { useEffect, useState } from 'react'
import { Eye, EyeOff, Pencil, Plus, Trash2, X, Save } from 'lucide-react'
import { adminDelete, adminList, adminSave, slugify } from '../lib/api'
import { Icon } from '../lib/icons'
import { CONTENT } from './config'
import { Field } from './Fields'

function Cell({ col, row }) {
  const v = row[col]
  if (col === 'cover_image') return <td className="a-thumb">{v ? <img src={v} alt="" /> : <span />}</td>
  if (col === 'icon') return <td className="a-thumb"><span className="a-thumb-ico"><Icon name={v} size={22} /></span></td>
  if (col === 'title' || col === 'question') return <td><strong>{v}</strong>{row.slug && <small className="a-muted"> /{row.slug}</small>}</td>
  return <td className="a-muted">{v ?? '—'}</td>
}

export default function CrudPage({ table }) {
  const cfg = CONTENT[table]
  const [rows, setRows] = useState(null)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const load = () => adminList(table).then(setRows).catch((e) => setErr(e.message))
  useEffect(() => { setRows(null); setEditing(null); load() }, [table]) // eslint-disable-line react-hooks/exhaustive-deps

  async function save(e) {
    e.preventDefault()
    setSaving(true); setErr('')
    try {
      const row = { ...editing }
      if (cfg.fields.some((f) => f.key === 'slug') && !row.slug) row.slug = slugify(row.title)
      await adminSave(table, row)
      setEditing(null)
      await load()
    } catch (ex) { setErr(ex.message) }
    setSaving(false)
  }

  async function remove(r) {
    if (!confirm(`Delete "${r.title || r.question}"? This cannot be undone.`)) return
    try { await adminDelete(table, r.id); load() } catch (ex) { setErr(ex.message) }
  }

  async function togglePublish(r) {
    try { await adminSave(table, { id: r.id, published: !r.published }); load() } catch (ex) { setErr(ex.message) }
  }

  return (
    <div className="a-page">
      <div className="a-head">
        <h1>{cfg.label}</h1>
        <button className="a-btn primary" onClick={() => setEditing({ ...cfg.defaults })}><Plus size={18} /> New {cfg.singular}</button>
      </div>
      {err && <p className="a-err">{err}</p>}

      <div className="a-card a-table-wrap">
        <table className="a-table">
          <thead>
            <tr>
              {cfg.columns.map((c) => <th key={c}>{c === 'cover_image' || c === 'icon' ? '' : c.replace(/_/g, ' ')}</th>)}
              <th>Order</th><th>Status</th><th />
            </tr>
          </thead>
          <tbody>
            {rows === null && <tr><td colSpan={9} className="a-muted">Loading…</td></tr>}
            {rows?.length === 0 && <tr><td colSpan={9} className="a-muted">Nothing yet. Click “New {cfg.singular}”.</td></tr>}
            {rows?.map((r) => (
              <tr key={r.id}>
                {cfg.columns.map((c) => <Cell key={c} col={c} row={r} />)}
                <td className="a-muted">{r.sort_order}</td>
                <td>
                  <button className={`a-pill ${r.published ? 'ok' : ''}`} onClick={() => togglePublish(r)} title="Toggle visibility">
                    {r.published ? <><Eye size={14} /> Live</> : <><EyeOff size={14} /> Hidden</>}
                  </button>
                </td>
                <td className="a-actions">
                  <button className="a-ico" onClick={() => setEditing(r)} aria-label="Edit"><Pencil size={17} /></button>
                  <button className="a-ico danger" onClick={() => remove(r)} aria-label="Delete"><Trash2 size={17} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="a-drawer-bg" onClick={() => !saving && setEditing(null)}>
          <form className="a-drawer" onClick={(e) => e.stopPropagation()} onSubmit={save}>
            <div className="a-drawer-head">
              <h2>{editing.id ? `Edit ${cfg.singular}` : `New ${cfg.singular}`}</h2>
              <button type="button" className="a-ico" onClick={() => setEditing(null)} aria-label="Close"><X size={20} /></button>
            </div>
            <div className="a-drawer-body a-grid">
              {cfg.fields.map((f) => (
                <Field key={f.key} f={f} row={editing} value={editing[f.key]} onChange={(val) => setEditing((r) => ({ ...r, [f.key]: val }))} />
              ))}
            </div>
            <div className="a-drawer-foot">
              {err && <span className="a-err">{err}</span>}
              <button type="button" className="a-btn ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="a-btn primary" disabled={saving}><Save size={18} /> {saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
