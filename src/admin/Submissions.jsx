import { useEffect, useMemo, useState } from 'react'
import { Download, Mail, Trash2 } from 'lucide-react'
import { adminDelete, adminList, adminSave } from '../lib/api'
import { WhatsAppIcon } from '../lib/icons'
import { waLink } from '../lib/hooks'
import { SUBMISSIONS } from './config'

function toCsv(rows, cols) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const head = [...cols.map((c) => c[1]), 'Status', 'Received'].map(esc).join(',')
  const body = rows.map((r) => [...cols.map((c) => r[c[0]]), r.status, r.created_at].map(esc).join(','))
  return [head, ...body].join('\n')
}

export default function Submissions({ table }) {
  const cfg = SUBMISSIONS[table]
  const [rows, setRows] = useState(null)
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [err, setErr] = useState('')

  const load = () => adminList(table, 'created_at').then(setRows).catch((e) => setErr(e.message))
  useEffect(() => { setRows(null); load() }, [table]) // eslint-disable-line react-hooks/exhaustive-deps

  const shown = useMemo(() => {
    if (!rows) return []
    const s = q.toLowerCase()
    return rows.filter((r) =>
      (filter === 'all' || r.status === filter) &&
      (!s || cfg.columns.some(([k]) => String(r[k] ?? '').toLowerCase().includes(s))))
  }, [rows, filter, q, cfg])

  async function setStatus(r, status) {
    setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, status } : x)))
    try { await adminSave(table, { id: r.id, status }) } catch (ex) { setErr(ex.message); load() }
  }
  async function remove(r) {
    if (!confirm(`Delete entry from ${r.full_name}?`)) return
    try { await adminDelete(table, r.id); load() } catch (ex) { setErr(ex.message) }
  }
  function exportCsv() {
    const blob = new Blob([toCsv(shown, cfg.columns)], { type: 'text/csv' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${table}.csv` })
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="a-page">
      <div className="a-head">
        <h1>{cfg.label}</h1>
        <button className="a-btn" onClick={exportCsv} disabled={!shown.length}><Download size={18} /> Export CSV</button>
      </div>
      <div className="a-filters">
        {['all', ...cfg.statuses].map((s) => (
          <button key={s} className={`a-chip ${filter === s ? 'on' : ''}`} onClick={() => setFilter(s)}>
            {s} {rows && <b>{s === 'all' ? rows.length : rows.filter((r) => r.status === s).length}</b>}
          </button>
        ))}
        <input className="a-search" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {err && <p className="a-err">{err}</p>}

      <div className="a-subs">
        {rows === null && <p className="a-muted">Loading…</p>}
        {rows && shown.length === 0 && <div className="a-card a-empty">No entries yet.</div>}
        {shown.map((r) => (
          <article key={r.id} className={`a-card a-sub status-${r.status}`}>
            <header>
              <div>
                <h3>{r.full_name}</h3>
                <small className="a-muted">{new Date(r.created_at).toLocaleString('en-GB')}</small>
              </div>
              <select value={r.status} onChange={(e) => setStatus(r, e.target.value)} className={`a-status s-${r.status}`}>
                {cfg.statuses.map((s) => <option key={s}>{s}</option>)}
              </select>
            </header>
            <dl>
              {cfg.columns.filter(([k]) => k !== 'full_name' && r[k]).map(([k, label]) => (
                <div key={k} className={k === 'message' ? 'wide' : ''}><dt>{label}</dt><dd>{r[k]}</dd></div>
              ))}
            </dl>
            <footer>
              {r.phone && <a className="a-btn wa" href={waLink(r.phone, `Hi ${r.full_name.split(' ')[0]}, it's Dr Bady.`)} target="_blank" rel="noreferrer"><WhatsAppIcon size={18} /> WhatsApp</a>}
              <a className="a-btn" href={`mailto:${r.email}`}><Mail size={16} /> Email</a>
              <button className="a-ico danger" onClick={() => remove(r)} aria-label="Delete"><Trash2 size={17} /></button>
            </footer>
          </article>
        ))}
      </div>
    </div>
  )
}
