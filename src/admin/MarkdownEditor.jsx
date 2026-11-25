import { useMemo, useRef, useState } from 'react'
import DOMPurify from 'dompurify'
import {
  Bold, Code, Columns2, Eye, Heading2, Heading3, Image as ImageIcon, Italic,
  Link as LinkIcon, List, ListOrdered, Minus, Pencil, Quote, Table,
} from 'lucide-react'
import { uploadImage } from '../lib/api'
import { readingMinutes, renderMarkdown, wordCount } from '../lib/markdown'

export default function MarkdownEditor({ value, onChange, minHeight }) {
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
    <div className={`a-md mode-${mode}`} style={minHeight ? { '--md-h': `${minHeight}px` } : undefined}>
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
            placeholder={'Write your content in Markdown.\n\n## Use H2 headings for sections\n\nNormal paragraphs, **bold**, _italic_, [links](/book) and images.'}
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

