// Markdown → HTML for blog posts. Shared by the browser and the server
// (api/render.js), so it must not touch window/document.
import { Marked } from 'marked'

export function headingId(text) {
  return String(text)
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z#0-9]+;/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80) || 'section'
}

const escapeAttr = (s = '') => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/**
 * Render markdown and collect the table of contents (h2/h3).
 * External links open in a new tab with rel="noopener"; images are lazy.
 */
export function renderMarkdown(md = '') {
  const toc = []
  const used = new Map()
  const marked = new Marked({
    gfm: true,
    breaks: false,
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens)
        let id = headingId(html)
        const n = used.get(id) || 0
        used.set(id, n + 1)
        if (n) id = `${id}-${n}`
        if (depth === 2 || depth === 3) toc.push({ id, depth, text: html.replace(/<[^>]+>/g, '') })
        return `<h${depth} id="${id}">${html}</h${depth}>\n`
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens)
        const ext = /^https?:\/\//i.test(href || '')
        const t = title ? ` title="${escapeAttr(title)}"` : ''
        const rel = ext ? ' target="_blank" rel="noopener"' : ''
        return `<a href="${escapeAttr(href)}"${t}${rel}>${text}</a>`
      },
      image({ href, title, text }) {
        const t = title ? ` title="${escapeAttr(title)}"` : ''
        return `<img src="${escapeAttr(href)}" alt="${escapeAttr(text)}"${t} loading="lazy" decoding="async" />`
      },
    },
  })
  const html = marked.parse(md || '')
  return { html, toc }
}

export function plainText(md = '') {
  return String(md)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`~|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export const wordCount = (md) => (plainText(md).match(/\S+/g) || []).length
export const readingMinutes = (md) => Math.max(1, Math.round(wordCount(md) / 220))
