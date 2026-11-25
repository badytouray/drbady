import { useEffect, useState } from 'react'
import { EyeOff, FileText, Map as MapIcon, Pencil, Rss, Save, X } from 'lucide-react'
import { adminList, adminSavePageSeo, getSettings } from '../lib/api'
import { CharCount, ImageField } from './Fields'
import { SerpPreview } from './SeoTools'

const FREQ = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']

export default function PageSeoAdmin() {
  const [rows, setRows] = useState(null)
  const [settings, setSettings] = useState({})
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const load = () => adminList('page_seo').then(setRows).catch((e) => setErr(e.message))
  useEffect(() => { load(); getSettings().then(setSettings) }, [])

  const base = (settings.site_url || window.location.origin).replace(/\/+$/, '')
  const suffix = settings.seo_title_suffix ?? ' | Dr Bady'
  const fullTitle = (t) => (!t ? settings.seo_site_name || 'Dr Bady' : t.includes(settings.seo_site_name || 'Dr Bady') ? t : t + suffix)
  const set = (k) => (v) => setEditing((r) => ({ ...r, [k]: v }))

  async function save(e) {
    e.preventDefault()
    setSaving(true); setErr('')
    try {
      await adminSavePageSeo({ ...editing, priority: Number(editing.priority) || 0.5 })
      setEditing(null)
      await load()
    } catch (ex) { setErr(ex.message) }
    setSaving(false)
  }

  return (
    <div className="a-page">
      <div className="a-head"><h1>SEO &amp; Pages</h1></div>
      {err && <p className="a-err">{err}{/relation|does not exist|schema cache/.test(err) && ' — run supabase/blog_seo.sql in the Supabase SQL editor.'}</p>}

      <div className="a-card a-pad a-seo-links">
        <div>
          <h2 className="a-card-title">Sitemap &amp; feeds</h2>
          <p className="a-muted">Generated automatically from your published pages, products, services and blog posts. Submit <b>{base}/sitemap.xml</b> once in Google Search Console and Bing Webmaster Tools; new posts are picked up on their own.</p>
          {!settings.site_url && <p className="a-err">Tip: set your live domain under Settings → SEO defaults → “Website address”, so canonical links and the sitemap always use it.</p>}
        </div>
        <div className="a-seo-btns">
          <a className="a-btn" href="/sitemap.xml" target="_blank" rel="noreferrer"><MapIcon size={16} /> sitemap.xml</a>
          <a className="a-btn" href="/sitemap-pages.xml" target="_blank" rel="noreferrer"><MapIcon size={16} /> Pages sitemap</a>
          <a className="a-btn" href="/sitemap-blog.xml" target="_blank" rel="noreferrer"><MapIcon size={16} /> Blog sitemap</a>
          <a className="a-btn" href="/robots.txt" target="_blank" rel="noreferrer"><FileText size={16} /> robots.txt</a>
          <a className="a-btn" href="/rss.xml" target="_blank" rel="noreferrer"><Rss size={16} /> RSS feed</a>
        </div>
      </div>

      <p className="a-muted a-note">Each fixed page's title, description and share image. Products, services and blog posts have their own SEO fields in their editors.</p>
      <div className="a-card a-table-wrap">
        <table className="a-table">
          <thead><tr><th>Page</th><th>Search title &amp; description</th><th>Sitemap</th><th /></tr></thead>
          <tbody>
            {rows === null && !err && <tr><td colSpan={4} className="a-muted">Loading…</td></tr>}
            {rows?.map((r) => (
              <tr key={r.path}>
                <td><strong>{r.label}</strong><br /><small className="a-muted">{r.path}</small></td>
                <td className="a-seo-cell">
                  <b>{fullTitle(r.title)}</b>
                  <small className="a-muted">{r.description || <em>No description — the site default is used.</em>}</small>
                </td>
                <td>
                  {r.noindex
                    ? <span className="a-pill"><EyeOff size={13} /> noindex</span>
                    : r.in_sitemap
                      ? <span className="a-pill ok">{r.changefreq} · {Number(r.priority).toFixed(1)}</span>
                      : <span className="a-pill">excluded</span>}
                </td>
                <td className="a-actions"><button className="a-ico" onClick={() => setEditing(r)} aria-label="Edit"><Pencil size={17} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="a-drawer-bg" onClick={() => !saving && setEditing(null)}>
          <form className="a-drawer" onClick={(e) => e.stopPropagation()} onSubmit={save}>
            <div className="a-drawer-head">
              <h2>SEO · {editing.label} <small className="a-muted">{editing.path}</small></h2>
              <button type="button" className="a-ico" onClick={() => setEditing(null)} aria-label="Close"><X size={20} /></button>
            </div>
            <div className="a-drawer-body a-grid">
              <div className="a-field">
                <SerpPreview title={fullTitle(editing.title)} description={editing.description || settings.seo_default_description} url={`${base}${editing.path}`} />
              </div>
              <div className="a-field">
                <span className="a-label">Page title <CharCount value={editing.title} min={20} max={60} /></span>
                <input value={editing.title || ''} onChange={(e) => set('title')(e.target.value)} />
                <small className="a-help">“{suffix.trim()}” is added automatically unless the title already contains the site name.</small>
              </div>
              <div className="a-field">
                <span className="a-label">Meta description <CharCount value={editing.description} min={110} max={160} /></span>
                <textarea rows={3} value={editing.description || ''} onChange={(e) => set('description')(e.target.value)} />
              </div>
              <div className="a-field">
                <span className="a-label">Social share image (1200×630 recommended)</span>
                <ImageField value={editing.og_image} onChange={set('og_image')} />
              </div>
              <div className="a-field half">
                <span className="a-label">Change frequency</span>
                <select value={editing.changefreq || 'monthly'} onChange={(e) => set('changefreq')(e.target.value)}>
                  {FREQ.map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div className="a-field half">
                <span className="a-label">Priority (0.0 – 1.0)</span>
                <input type="number" min="0" max="1" step="0.1" value={editing.priority ?? 0.5} onChange={(e) => set('priority')(e.target.value)} />
              </div>
              <label className="a-switch a-field half">
                <input type="checkbox" checked={!!editing.in_sitemap} onChange={(e) => set('in_sitemap')(e.target.checked)} />
                <span /> Include in sitemap
              </label>
              <label className="a-switch a-field half">
                <input type="checkbox" checked={!!editing.noindex} onChange={(e) => set('noindex')(e.target.checked)} />
                <span /> Hide from search (noindex)
              </label>
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
