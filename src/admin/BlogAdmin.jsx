import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import DOMPurify from 'dompurify'
import {
  ArrowLeft, Bold, Code, Copy, ExternalLink, Eye, Heading2, Heading3, Image as ImageIcon, Italic,
  Link as LinkIcon, List, ListOrdered, Minus, Pencil, Plus, Quote, Save, Star, Table, Trash2, Columns2,
} from 'lucide-react'
import { adminDelete, adminList, adminSave, getSettings, slugify, uploadImage } from '../lib/api'
import { readingMinutes, renderMarkdown, wordCount } from '../lib/markdown'
import { CharCount, ImageField, TagsField, toLocalInput } from './Fields'
import { SeoChecklist, SerpPreview, postChecks } from './SeoTools'

const EMPTY = {
  title: '', slug: '', excerpt: '', content: '', cover_image: '', cover_alt: '', author_name: 'Dr Bady',
  category_id: null, tags: [], featured: false, meta_title: '', meta_description: '', focus_keyword: '',
  canonical_url: '', og_image: '', noindex: false, published: false, published_at: null,
}

export function postStatus(p) {
  if (!p.published) return 'draft'
  return new Date(p.published_at) > new Date() ? 'scheduled' : 'published'
}

const fmt = (d) => (d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')

// ------------------------------------------------------------ Markdown editor
function MarkdownEditor({ value, onChange }) {
  const ref = useRef()
  const fileRef = useRef()
  const [mode, setMode] = useState('write')
  const [busy, setBusy] = useState(false)
  const preview = useMemo(() => (mode === 'write' ? '' : DOMPurify.sanitize(renderMarkdown(value).html, { ADD_ATTR: ['target'] })), [value, mode])

  function apply(fn) {
    const el = ref.current
    const { selectionStart: s, selectionEnd: e } = el
    const sel = value.slice(s, e)
    const { text, cursor = text.length, select } = fn(sel)
    const next = value.slice(0, s) + text + value.slice(e)
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      if (select) el.setSelectionRange(s + select[0], s + select[1])
      else el.setSelectionRange(s + cursor, s + cursor)
    })
  }
  const wrap = (a, b = a, ph = 'text') => () => apply((sel) => {
    const inner = sel || ph
    return { text: `${a}${inner}${b}`, select: [a.length, a.length + inner.length] }
  })
  const line = (prefix, ph) => () => apply((sel) => {
    const el = ref.current
    const atLineStart = el.selectionStart === 0 || value[el.selectionStart - 1] === '\n'
    const lines = (sel || ph).split('\n').map((l, i) => (typeof prefix === 'function' ? prefix(i) : prefix) + l)
    const text = (atLineStart ? '' : '\n') + lines.join('\n')
    return { text, cursor: text.length }
  })
  const block = (snippet) => () => apply(() => {
    const el = ref.current
    const before = el.selectionStart === 0 || value.slice(0, el.selectionStart).endsWith('\n\n') ? '' : '\n\n'
    const text = `${before}${snippet}\n\n`
    return { text, cursor: text.length }
  })
  const link = () => apply((sel) => {
    const url = prompt('Link URL (https://… for other sites, or /book, /blog/… for this site)', '/')
    if (url === null) return { text: sel }
    const label = sel || 'link text'
    return { text: `[${label}](${url})`, select: [1, 1 + label.length] }
  })

  async function pickImage(e) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const alt = prompt('Describe the image (alt text, important for SEO and accessibility):', f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '))
    setBusy(true)
    try {
      const url = await uploadImage(f)
      block(`![${alt || ''}](${url})`)()
    } catch (ex) { alert(ex.message) }
    setBusy(false)
  }

  const tools = [
    [Heading2, 'Heading 2', line('## ', 'Section heading')],
    [Heading3, 'Heading 3', line('### ', 'Sub-heading')],
    [Bold, 'Bold', wrap('**')],
    [Italic, 'Italic', wrap('_')],
    [LinkIcon, 'Link', link],
    [Quote, 'Quote', line('> ', 'Quote')],
    [List, 'Bullet list', line('- ', 'List item')],
    [ListOrdered, 'Numbered list', line((i) => `${i + 1}. `, 'List item')],
    [Code, 'Code', wrap('`')],
    [Table, 'Table', block('| Column | Column |\n| --- | --- |\n| Cell | Cell |')],
    [Minus, 'Divider', block('---')],
  ]

  return (
    <div className={`a-md mode-${mode}`}>
      <div className="a-md-bar">
        {mode !== 'preview' && tools.map(([I, label, fn]) => (
          <button key={label} type="button" className="a-ico" title={label} aria-label={label} onClick={fn}><I size={17} /></button>
        ))}
        {mode !== 'preview' && (
          <button type="button" className="a-ico" title="Upload image" aria-label="Upload image" onClick={() => fileRef.current.click()} disabled={busy}>
            <ImageIcon size={17} />
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickImage} />
        <div className="a-md-modes">
          <button type="button" className={mode === 'write' ? 'on' : ''} onClick={() => setMode('write')}><Pencil size={14} /> Write</button>
          <button type="button" className={mode === 'split' ? 'on' : ''} onClick={() => setMode('split')}><Columns2 size={14} /> Split</button>
          <button type="button" className={mode === 'preview' ? 'on' : ''} onClick={() => setMode('preview')}><Eye size={14} /> Preview</button>
        </div>
      </div>
      <div className="a-md-panes">
        {mode !== 'preview' && (
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={'Write your article in Markdown.\n\n## Use H2 headings for sections\n\nNormal paragraphs, **bold**, _italic_, [links](/book) and images.'}
            spellCheck
          />
        )}
        {mode !== 'write' && <div className="a-md-preview b-prose" dangerouslySetInnerHTML={{ __html: preview }} />}
      </div>
      <div className="a-md-foot">
        {busy ? 'Uploading image…' : `${wordCount(value)} words · ~${readingMinutes(value)} min read`} · Markdown supported
      </div>
    </div>
  )
}

// ------------------------------------------------------------ Post editor
function PostEditor({ initial, categories, siteUrl, onClose, onSaved }) {
  const [p, setP] = useState(initial)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const set = (k) => (v) => { setP((r) => ({ ...r, [k]: v })); setDirty(true); setMsg('') }
  const setE = (k) => (e) => set(k)(e.target.type === 'checkbox' ? e.target.checked : e.target.value)

  useEffect(() => {
    if (!dirty) return
    const h = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  const status = postStatus({ ...p, published_at: p.published_at || new Date().toISOString() })
  const url = `${siteUrl}/blog/${p.slug || slugify(p.title) || 'your-post'}`
  const checks = postChecks(p)

  async function save(publish) {
    setSaving(true); setMsg('')
    try {
      const row = {
        ...p,
        slug: p.slug || slugify(p.title),
        published: publish ?? p.published,
        published_at: p.published_at || new Date().toISOString(),
        reading_minutes: readingMinutes(p.content),
        tags: p.tags || [],
        category_id: p.category_id || null,
      }
      for (const k of ['meta_title', 'meta_description', 'focus_keyword', 'canonical_url', 'og_image', 'cover_alt']) if (row[k] === '') row[k] = null
      const saved = await adminSave('blog_posts', row)
      setP(saved)
      setDirty(false)
      setMsg(saved.published ? (postStatus(saved) === 'scheduled' ? 'Scheduled.' : 'Published. Live on the site and in the sitemap.') : 'Draft saved.')
      onSaved()
    } catch (ex) {
      setMsg(ex.message.includes('duplicate') ? 'That URL slug is already used by another post.' : ex.message)
    }
    setSaving(false)
  }

  const close = () => (!dirty || confirm('Discard unsaved changes?')) && onClose()

  return (
    <form className="a-page a-page-wide" onSubmit={(e) => { e.preventDefault(); save() }}>
      <div className="a-head">
        <button type="button" className="a-btn ghost" onClick={close}><ArrowLeft size={18} /> All posts</button>
        <div className="a-head-actions">
          {msg && <span className={/saved|Published|Scheduled/.test(msg) ? 'a-ok' : 'a-err'}>{msg}</span>}
          {p.id && status === 'published' && <a className="a-btn ghost" href={`/blog/${p.slug}`} target="_blank" rel="noreferrer"><ExternalLink size={16} /> View</a>}
          {p.published
            ? <>
                <button type="button" className="a-btn" disabled={saving} onClick={() => save(false)}>Unpublish</button>
                <button className="a-btn primary" disabled={saving}><Save size={18} /> {saving ? 'Saving…' : 'Update'}</button>
              </>
            : <>
                <button className="a-btn" disabled={saving}><Save size={18} /> Save draft</button>
                <button type="button" className="a-btn primary" disabled={saving || !p.title} onClick={() => save(true)}>
                  {new Date(p.published_at || 0) > new Date() ? 'Schedule' : 'Publish'}
                </button>
              </>}
        </div>
      </div>

      <div className="a-editor">
        <div className="a-editor-main">
          <div className="a-card a-pad a-stack">
            <input className="a-title-input" placeholder="Post title" value={p.title} onChange={setE('title')} required aria-label="Title" />
            <div className="a-field">
              <span className="a-label">URL</span>
              <div className="a-inline a-slug">
                <span className="a-muted">/blog/</span>
                <input value={p.slug || ''} onChange={(e) => set('slug')(slugify(e.target.value))} placeholder={slugify(p.title) || 'your-post-url'} />
                <button type="button" className="a-btn ghost" onClick={() => set('slug')(slugify(p.title))}>From title</button>
              </div>
              <small className="a-help">Short, lowercase, with the main keyword. Changing it after publishing breaks old links.</small>
            </div>
            <div className="a-field">
              <span className="a-label">Excerpt <CharCount value={p.excerpt} min={110} max={160} /></span>
              <textarea rows={2} value={p.excerpt || ''} onChange={setE('excerpt')} placeholder="One or two sentences summarising the post." />
              <small className="a-help">Shown on blog cards and used as the meta description when none is set.</small>
            </div>
          </div>
          <MarkdownEditor value={p.content || ''} onChange={set('content')} />

          <div className="a-card a-pad a-stack">
            <h2 className="a-card-title">Search engine optimisation</h2>
            <SerpPreview title={(p.meta_title || p.title || '') + ' | Dr Bady'} description={p.meta_description || p.excerpt} url={url} />
            <div className="a-grid">
              <div className="a-field">
                <span className="a-label">Focus keyword</span>
                <input value={p.focus_keyword || ''} onChange={setE('focus_keyword')} placeholder="e.g. start a business in the gambia" />
                <small className="a-help">The main search phrase this article should rank for.</small>
              </div>
              <div className="a-field">
                <span className="a-label">SEO title <CharCount value={p.meta_title} min={30} max={60} /></span>
                <input value={p.meta_title || ''} onChange={setE('meta_title')} placeholder={p.title} />
                <small className="a-help">Leave blank to use the post title. “| Dr Bady” is added automatically.</small>
              </div>
              <div className="a-field">
                <span className="a-label">Meta description <CharCount value={p.meta_description} min={110} max={160} /></span>
                <textarea rows={3} value={p.meta_description || ''} onChange={setE('meta_description')} placeholder={p.excerpt || 'Summary shown in Google results'} />
              </div>
              <div className="a-field">
                <span className="a-label">Social share image</span>
                <ImageField value={p.og_image} onChange={set('og_image')} />
                <small className="a-help">Optional. Used on Facebook, WhatsApp, LinkedIn and X. Defaults to the cover image. Best size 1200×630.</small>
              </div>
              <div className="a-field">
                <span className="a-label">Canonical URL</span>
                <input value={p.canonical_url || ''} onChange={setE('canonical_url')} placeholder={url} />
                <small className="a-help">Only set this if the article was first published on another website.</small>
              </div>
              <label className="a-switch a-field">
                <input type="checkbox" checked={!!p.noindex} onChange={setE('noindex')} />
                <span /> Hide from search engines (noindex)
              </label>
            </div>
          </div>
        </div>

        <aside className="a-editor-side">
          <div className="a-card a-pad a-stack">
            <h2 className="a-card-title">Publishing</h2>
            <div className="a-kv"><span>Status</span><span className={`a-status st-${status}`}>{status}</span></div>
            <div className="a-field">
              <span className="a-label">Publish date</span>
              <input type="datetime-local" value={toLocalInput(p.published_at)} onChange={(e) => set('published_at')(e.target.value ? new Date(e.target.value).toISOString() : null)} />
              <small className="a-help">Pick a future date to schedule. Blank = now.</small>
            </div>
            <label className="a-switch">
              <input type="checkbox" checked={!!p.featured} onChange={setE('featured')} />
              <span /> <Star size={14} /> Featured post
            </label>
            {p.updated_at && <small className="a-muted">Last saved {fmt(p.updated_at)}</small>}
          </div>

          <div className="a-card a-pad a-stack">
            <h2 className="a-card-title">Organise</h2>
            <div className="a-field">
              <span className="a-label">Category</span>
              <select value={p.category_id || ''} onChange={(e) => set('category_id')(e.target.value || null)}>
                <option value="">— None —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <small className="a-help"><Link to="/admin/blog_categories">Manage categories</Link></small>
            </div>
            <div className="a-field">
              <span className="a-label">Tags</span>
              <TagsField value={p.tags} onChange={set('tags')} />
            </div>
            <div className="a-field">
              <span className="a-label">Author</span>
              <input value={p.author_name || ''} onChange={setE('author_name')} />
            </div>
          </div>

          <div className="a-card a-pad a-stack">
            <h2 className="a-card-title">Cover image</h2>
            <ImageField value={p.cover_image} onChange={set('cover_image')} />
            <div className="a-field">
              <span className="a-label">Alt text</span>
              <input value={p.cover_alt || ''} onChange={setE('cover_alt')} placeholder="Describe the image for Google & screen readers" />
            </div>
          </div>

          <div className="a-card a-pad">
            <SeoChecklist checks={checks} />
          </div>
        </aside>
      </div>
    </form>
  )
}

// ------------------------------------------------------------ List
const FILTERS = ['all', 'published', 'scheduled', 'draft']

export default function BlogAdmin() {
  const [rows, setRows] = useState(null)
  const [cats, setCats] = useState([])
  const [siteUrl, setSiteUrl] = useState(window.location.origin)
  const [editing, setEditing] = useState(null)
  const [filter, setFilter] = useState('all')
  const [term, setTerm] = useState('')
  const [err, setErr] = useState('')

  const load = () => adminList('blog_posts', 'published_at').then(setRows).catch((e) => setErr(e.message))
  useEffect(() => {
    load()
    adminList('blog_categories').then(setCats).catch(() => {})
    getSettings().then((s) => s.site_url && setSiteUrl(s.site_url.replace(/\/+$/, '')))
  }, [])

  async function remove(r) {
    if (!confirm(`Delete "${r.title}"? This cannot be undone.`)) return
    try { await adminDelete('blog_posts', r.id); load() } catch (ex) { setErr(ex.message) }
  }

  function duplicate(r) {
    const { id: _i, created_at: _c, updated_at: _u, ...rest } = r
    setEditing({ ...rest, title: `${r.title} (copy)`, slug: `${r.slug}-copy`, published: false, published_at: null })
  }

  if (editing)
    return (
      <PostEditor
        key={editing.id || 'new'}
        initial={editing}
        categories={cats}
        siteUrl={siteUrl}
        onClose={() => { setEditing(null); load() }}
        onSaved={load}
      />
    )

  const counts = Object.fromEntries(FILTERS.map((f) => [f, rows ? rows.filter((r) => f === 'all' || postStatus(r) === f).length : 0]))
  const shown = (rows || []).filter((r) =>
    (filter === 'all' || postStatus(r) === filter) &&
    (!term || `${r.title} ${r.slug} ${(r.tags || []).join(' ')}`.toLowerCase().includes(term.toLowerCase())),
  )
  const catName = (id) => cats.find((c) => c.id === id)?.title

  return (
    <div className="a-page">
      <div className="a-head">
        <h1>Blog Posts</h1>
        <button className="a-btn primary" onClick={() => setEditing({ ...EMPTY })}><Plus size={18} /> New post</button>
      </div>
      {err && <p className="a-err">{err}{/relation|does not exist|schema cache/.test(err) && ' — run supabase/blog_seo.sql in the Supabase SQL editor.'}</p>}

      <div className="a-filters">
        {FILTERS.map((f) => (
          <button key={f} className={`a-chip ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>{f}<b>{counts[f]}</b></button>
        ))}
        <input className="a-search" placeholder="Search posts…" value={term} onChange={(e) => setTerm(e.target.value)} />
      </div>

      <div className="a-card a-table-wrap">
        <table className="a-table">
          <thead>
            <tr><th /><th>Title</th><th>Category</th><th>Status</th><th>Date</th><th /></tr>
          </thead>
          <tbody>
            {rows === null && !err && <tr><td colSpan={6} className="a-muted">Loading…</td></tr>}
            {rows && shown.length === 0 && <tr><td colSpan={6} className="a-muted">No posts here yet. Click “New post”.</td></tr>}
            {shown.map((r) => {
              const st = postStatus(r)
              return (
                <tr key={r.id}>
                  <td className="a-thumb">{r.cover_image ? <img src={r.cover_image} alt="" /> : <span />}</td>
                  <td>
                    <button type="button" className="a-linkbtn" onClick={() => setEditing(r)}><strong>{r.title}</strong></button>
                    {r.featured && <Star size={13} className="a-star" />}
                    <small className="a-muted"> /blog/{r.slug}</small>
                  </td>
                  <td className="a-muted">{catName(r.category_id) || '—'}</td>
                  <td><span className={`a-status st-${st}`}>{st}</span></td>
                  <td className="a-muted">{fmt(r.published_at)}</td>
                  <td className="a-actions">
                    {st === 'published' && <a className="a-ico" href={`/blog/${r.slug}`} target="_blank" rel="noreferrer" aria-label="View on site"><ExternalLink size={17} /></a>}
                    <button className="a-ico" onClick={() => duplicate(r)} aria-label="Duplicate" title="Duplicate"><Copy size={17} /></button>
                    <button className="a-ico" onClick={() => setEditing(r)} aria-label="Edit"><Pencil size={17} /></button>
                    <button className="a-ico danger" onClick={() => remove(r)} aria-label="Delete"><Trash2 size={17} /></button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
