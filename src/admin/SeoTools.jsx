import { CircleAlert, CircleCheck } from 'lucide-react'
import { plainText, wordCount } from '../lib/markdown'
import { slugify } from '../lib/api'

const cut = (s = '', n) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s)

/** Google-style search result preview. */
export function SerpPreview({ title, description, url }) {
  let shown = url || ''
  try {
    const u = new URL(url)
    shown = `${u.host}${u.pathname.replace(/\/$/, '').split('/').filter(Boolean).map((p) => ` › ${p}`).join('')}`
  } catch { /* relative */ }
  return (
    <div className="a-serp" aria-label="Search result preview">
      <small>{shown}</small>
      <b>{cut(title || 'Page title', 62)}</b>
      <p>{cut(description || 'Add a meta description so search engines show a helpful summary of this page.', 160)}</p>
    </div>
  )
}

const has = (hay = '', needle = '') => !!needle && hay.toLowerCase().includes(needle.toLowerCase())

/** On-page checks for a blog post. Returns [{ ok, label }] */
export function postChecks(p, siteName = 'Dr Bady') {
  const kw = (p.focus_keyword || '').trim()
  const title = p.meta_title || p.title || ''
  const desc = p.meta_description || p.excerpt || ''
  const text = plainText(p.content)
  const words = wordCount(p.content)
  const firstPara = text.split(/\s+/).slice(0, 120).join(' ')
  const subheads = (p.content || '').match(/^#{2,3}\s.+$/gm) || []
  const fullLen = (title.includes(siteName) ? title : `${title} | ${siteName}`).length
  return [
    { ok: !!kw, label: 'Focus keyword is set' },
    kw && { ok: has(p.title, kw) || has(title, kw), label: 'Keyword appears in the title' },
    kw && { ok: has(desc, kw), label: 'Keyword appears in the meta description' },
    kw && { ok: (p.slug || '').includes(slugify(kw)), label: 'Keyword appears in the URL slug' },
    kw && { ok: has(firstPara, kw), label: 'Keyword appears in the opening paragraph' },
    kw && { ok: subheads.some((h) => has(h, kw)), label: 'Keyword appears in a subheading (H2/H3)' },
    { ok: fullLen >= 30 && fullLen <= 65, label: `SEO title length is 30–65 characters (now ${fullLen})` },
    { ok: desc.length >= 110 && desc.length <= 160, label: `Meta description is 110–160 characters (now ${desc.length})` },
    { ok: words >= 300, label: `At least 300 words (now ${words})` },
    { ok: subheads.length >= 2, label: 'Uses subheadings (## H2) to structure the article' },
    { ok: /\]\(\/(?!\/)/.test(p.content || ''), label: 'Links to another page on this site (internal link)' },
    { ok: !!p.cover_image, label: 'Has a cover image' },
    { ok: !p.cover_image || !!(p.cover_alt || '').trim(), label: 'Cover image has alt text' },
    { ok: !/!\[\]\(/.test(p.content || ''), label: 'All images in the article have alt text' },
    { ok: !p.noindex, label: 'Visible to search engines (not "noindex")' },
  ].filter(Boolean)
}

export function SeoChecklist({ checks }) {
  const pass = checks.filter((c) => c.ok).length
  const pct = Math.round((pass / checks.length) * 100)
  const grade = pct >= 80 ? 'good' : pct >= 50 ? 'warn' : 'bad'
  return (
    <div className="a-checks">
      <div className={`a-score ${grade}`}>
        <b>{pct}</b>
        <span>SEO score<br /><small>{pass} of {checks.length} checks passed</small></span>
      </div>
      <ul>
        {checks.map((c, i) => (
          <li key={i} className={c.ok ? 'ok' : ''}>
            {c.ok ? <CircleCheck size={16} /> : <CircleAlert size={16} />} {c.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
