// Serves the app HTML for every public URL with the right <title>, meta
// description, canonical, Open Graph/Twitter tags, JSON-LD and a crawler-
// readable copy of the content (blog posts are fully rendered). React then
// takes over in the browser. Unknown URLs get a real 404 status.
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { envFrom, injectHtml, pageMeta } from './_lib/seo-core.js'
import { originOf } from './seo.js'

let template

async function loadTemplate(origin) {
  if (template) return template
  for (const f of ['dist/app.html', 'dist/index.html']) {
    try {
      template = await readFile(path.join(process.cwd(), f), 'utf8')
      return template
    } catch { /* try next */ }
  }
  const r = await fetch(`${origin}/app.html`)
  if (!r.ok) throw new Error(`template fetch failed: ${r.status}`)
  template = await r.text()
  return template
}

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://x')
  const p = url.searchParams.get('path') || '/'
  // Missing static files (old asset hashes, typos) → plain 404, not the app.
  if (/\.[a-z0-9]{2,5}$/i.test(p)) {
    res.statusCode = 404
    res.setHeader('Content-Type', 'text/plain')
    return res.end('Not found')
  }
  const origin = originOf(req)
  try {
    const [tpl, meta] = await Promise.all([loadTemplate(origin), pageMeta(envFrom(process.env), origin, p)])
    res.statusCode = meta.status
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400')
    res.end(injectHtml(tpl, meta))
  } catch (e) {
    console.error(e)
    // Never take the site down because of SEO: fall back to the plain app shell.
    try {
      const tpl = await loadTemplate(origin)
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.end(tpl)
    } catch {
      res.statusCode = 500
      res.end('Server error')
    }
  }
}
