import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Clock, Link2, ListTree, Search, Share2, Check } from 'lucide-react'
import { useData } from '../lib/DataContext'
import { useIsMobile, waLink } from '../lib/hooks'
import { listPosts, getPost, relatedPosts } from '../lib/api'
import { renderMarkdown, wordCount } from '../lib/markdown'
import { WhatsAppIcon } from '../lib/icons'
import { Sheet } from '../components/MobileShell'
import Seo, { absUrl, breadcrumbLd, useSiteBase } from '../components/Seo'
import { SectionTitle } from './Home'

const PER_PAGE = 9

export function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function PostMeta({ p, cat }) {
  return (
    <div className="b-meta">
      {cat && <Link to={`/blog/category/${cat.slug}`} className="b-cat">{cat.title}</Link>}
      <span><CalendarDays size={15} /> <time dateTime={p.published_at}>{fmtDate(p.published_at)}</time></span>
      <span><Clock size={15} /> {p.reading_minutes || 1} min read</span>
    </div>
  )
}

export function PostCard({ p, big }) {
  const { categories } = useData()
  const cat = categories.find((c) => c.id === p.category_id)
  return (
    <article className={`b-card ${big ? 'b-card-big' : ''}`}>
      <Link to={`/blog/${p.slug}`} className="b-card-img" tabIndex={-1} aria-hidden="true">
        {p.cover_image ? <img src={p.cover_image} alt={p.cover_alt || ''} loading={big ? 'eager' : 'lazy'} decoding="async" /> : <span className="b-card-ph" />}
      </Link>
      <div className="b-card-body">
        <PostMeta p={p} cat={cat} />
        <h2 className="b-card-title"><Link to={`/blog/${p.slug}`}>{p.title}</Link></h2>
        {p.excerpt && <p>{p.excerpt}</p>}
        <Link to={`/blog/${p.slug}`} className="text-link" aria-label={`Read: ${p.title}`}>Read article <ArrowRight size={16} /></Link>
      </div>
    </article>
  )
}

function Pagination({ page, pages, makeHref }) {
  if (pages <= 1) return null
  const nums = []
  for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i)
  return (
    <nav className="b-pages" aria-label="Pagination">
      {page > 1 ? <Link to={makeHref(page - 1)} rel="prev"><ChevronLeft size={18} /> Newer</Link> : <span />}
      <div className="b-page-nums">
        {nums.map((n, i) => (
          <span key={n}>
            {i > 0 && n - nums[i - 1] > 1 && <em>…</em>}
            {n === page ? <b aria-current="page">{n}</b> : <Link to={makeHref(n)}>{n}</Link>}
          </span>
        ))}
      </div>
      {page < pages ? <Link to={makeHref(page + 1)} rel="next">Older <ChevronRight size={18} /></Link> : <span />}
    </nav>
  )
}

function NotFoundBlock({ what = 'page' }) {
  const body = (
    <div className="b-empty">
      <h1>{what === 'post' ? 'Article not found' : 'Page not found'}</h1>
      <p className="muted">It may have been moved or unpublished.</p>
      <Link to="/blog" className="btn btn-gold btn-pill">Browse the blog</Link>
    </div>
  )
  const seo = <Seo title="Not found" noindex />
  if (useIsMobile()) return <Sheet>{seo}{body}</Sheet>
  return <section className="section page-top"><div className="container container-narrow">{seo}{body}</div></section>
}

/** /blog and /blog/category/:slug */
export function BlogIndex() {
  const { slug } = useParams()
  const [sp, setSp] = useSearchParams()
  const { categories, settings, pageSeo, loading } = useData()
  const isMobile = useIsMobile()
  const base = useSiteBase()
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10) || 1)
  const tag = sp.get('tag') || ''
  const q = sp.get('q') || ''
  const cat = slug ? categories.find((c) => c.slug === slug) : null
  const [data, setData] = useState(null)
  const [term, setTerm] = useState(q)

  useEffect(() => setTerm(q), [q])
  useEffect(() => {
    if (slug && !cat) return
    let alive = true
    setData(null)
    listPosts({ category: cat?.id, tag, q, page, perPage: PER_PAGE }).then((d) => alive && setData(d))
    return () => { alive = false }
  }, [slug, cat?.id, tag, q, page]) // eslint-disable-line react-hooks/exhaustive-deps

  if (slug && !cat) return loading ? null : <NotFoundBlock />

  const basePath = cat ? `/blog/category/${cat.slug}` : '/blog'
  const pages = data ? Math.max(1, Math.ceil(data.total / PER_PAGE)) : 1
  const makeHref = (n) => {
    const p = new URLSearchParams(sp)
    if (n > 1) p.set('page', String(n)); else p.delete('page')
    const qs = p.toString()
    return `${basePath}${qs ? `?${qs}` : ''}`
  }
  const filtered = !!(tag || q)
  const showFeatured = !filtered && page === 1 && data?.posts?.length > 0
  const [first, ...rest] = data?.posts || []

  const blogRow = pageSeo.find((r) => r.path === '/blog')
  const seoTitle = cat ? (cat.meta_title || `${cat.title} articles`) : (blogRow?.title || 'Blog')
  const seoDesc = cat ? (cat.meta_description || cat.description) : undefined
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }, ...(cat ? [{ name: cat.title, path: basePath }] : [])]

  const onSearch = (e) => {
    e.preventDefault()
    const p = new URLSearchParams()
    if (term.trim()) p.set('q', term.trim())
    if (tag) p.set('tag', tag)
    setSp(p)
  }

  const seo = (
    <Seo
      path={cat ? undefined : '/blog'}
      title={page > 1 ? `${seoTitle} – Page ${page}` : seoTitle}
      description={seoDesc}
      noindex={filtered}
      canonicalPath={page > 1 ? `${basePath}?page=${page}` : basePath}
      jsonLd={[
        {
          '@context': 'https://schema.org',
          '@type': cat ? 'CollectionPage' : 'Blog',
          name: cat ? cat.title : `${settings.seo_site_name || 'Dr Bady'} Blog`,
          url: `${base}${basePath}`,
          description: seoDesc || blogRow?.description,
          ...(data?.posts?.length
            ? { [cat ? 'hasPart' : 'blogPost']: data.posts.map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: `${base}/blog/${p.slug}`, datePublished: p.published_at })) }
            : {}),
        },
        breadcrumbLd(base, crumbs),
      ]}
    >
      <link rel="alternate" type="application/rss+xml" title="Blog RSS" href={`${base}/rss.xml`} />
    </Seo>
  )

  const controls = (
    <div className="b-controls">
      <nav className="b-chips" aria-label="Categories">
        <Link to="/blog" className={!cat ? 'on' : ''}>All</Link>
        {categories.map((c) => <Link key={c.id} to={`/blog/category/${c.slug}`} className={cat?.id === c.id ? 'on' : ''}>{c.title}</Link>)}
      </nav>
      <form className="b-search" role="search" onSubmit={onSearch}>
        <Search size={18} />
        <input type="search" placeholder="Search articles" aria-label="Search articles" value={term} onChange={(e) => setTerm(e.target.value)} />
      </form>
    </div>
  )

  const list = (
    <>
      {filtered && (
        <p className="b-filter">
          {q && <>Results for “<b>{q}</b>” </>}{tag && <>tagged <b>#{tag}</b> </>}
          · <Link to={basePath}>Clear</Link>
        </p>
      )}
      {data === null && <p className="muted">Loading…</p>}
      {data?.posts?.length === 0 && <p className="muted b-none">No articles found{filtered ? '' : ' yet. Check back soon'}.</p>}
      {showFeatured && !isMobile && <PostCard p={first} big />}
      <div className="b-grid">
        {(showFeatured && !isMobile ? rest : data?.posts || []).map((p) => <PostCard key={p.id} p={p} />)}
      </div>
      {data && <Pagination page={page} pages={pages} makeHref={makeHref} />}
    </>
  )

  if (isMobile)
    return (
      <Sheet title={cat ? cat.title : 'Blog'}>
        {seo}
        {(cat?.description || !cat) && <p className="m-lead">{cat?.description || 'Ideas, guides and stories on business, branding and growth.'}</p>}
        {controls}
        {list}
      </Sheet>
    )

  return (
    <section className="section page-top">
      {seo}
      <div className="container">
        {cat && <nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link> / <Link to="/blog">Blog</Link> / <span>{cat.title}</span></nav>}
        {cat
          ? <div className="section-title"><h1 className="b-h1">{cat.title}</h1>{cat.description && <p>{cat.description}</p>}</div>
          : <SectionTitle first="The" underline="Blog" sub="Ideas, guides and stories on business, branding, technology and growth." as="h1" />}
        {controls}
        {list}
      </div>
    </section>
  )
}

function ShareBar({ url, title }) {
  const [copied, setCopied] = useState(false)
  const enc = encodeURIComponent
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { /* ignore */ }
  }
  const native = typeof navigator !== 'undefined' && navigator.share
  return (
    <div className="b-share">
      <span><Share2 size={16} /> Share</span>
      {native && <button type="button" onClick={() => navigator.share({ title, url }).catch(() => {})}>Share…</button>}
      <a href={waLink('', `${title} ${url}`)} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={16} /> WhatsApp</a>
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`} target="_blank" rel="noopener noreferrer">LinkedIn</a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`} target="_blank" rel="noopener noreferrer">Facebook</a>
      <a href={`https://x.com/intent/post?url=${enc(url)}&text=${enc(title)}`} target="_blank" rel="noopener noreferrer">X</a>
      <button type="button" onClick={copy}>{copied ? <><Check size={15} /> Copied</> : <><Link2 size={15} /> Copy link</>}</button>
    </div>
  )
}

/** /blog/:slug */
export function BlogPost() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { categories, settings } = useData()
  const isMobile = useIsMobile()
  const base = useSiteBase()
  const [post, setPost] = useState(undefined)
  const [related, setRelated] = useState([])

  useEffect(() => {
    let alive = true
    setPost(undefined)
    setRelated([])
    getPost(slug).then((p) => {
      if (!alive) return
      setPost(p)
      if (p) relatedPosts(p).then((r) => alive && setRelated(r))
    })
    return () => { alive = false }
  }, [slug])

  const rendered = useMemo(() => {
    if (!post) return null
    const { html, toc } = renderMarkdown(post.content)
    return { html: DOMPurify.sanitize(html, { ADD_ATTR: ['target'] }), toc }
  }, [post])

  if (post === undefined)
    return isMobile ? <Sheet><p className="muted">Loading…</p></Sheet> : <section className="section page-top"><div className="container container-narrow"><p className="muted">Loading…</p></div></section>
  if (!post) return <NotFoundBlock what="post" />

  const cat = categories.find((c) => c.id === post.category_id)
  const url = `${base}/blog/${post.slug}`
  const orgName = settings.seo_site_name || 'Dr Bady'
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }, ...(cat ? [{ name: cat.title, path: `/blog/category/${cat.slug}` }] : []), { name: post.title, path: `/blog/${post.slug}` }]

  // Keep internal links inside the SPA.
  const onArticleClick = (e) => {
    const a = e.target.closest('a')
    const href = a?.getAttribute('href')
    if (!href || a.target || !href.startsWith('/') || e.metaKey || e.ctrlKey || e.shiftKey) return
    e.preventDefault()
    navigate(href)
  }

  const seo = (
    <Seo
      title={post.meta_title || post.title}
      description={post.meta_description || post.excerpt}
      image={post.og_image || post.cover_image}
      imageAlt={post.cover_alt}
      type="article"
      noindex={post.noindex}
      canonical={post.canonical_url || undefined}
      canonicalPath={`/blog/${post.slug}`}
      article={{ published_time: post.published_at, modified_time: post.updated_at, section: cat?.title, tags: post.tags }}
      jsonLd={[
        {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          mainEntityOfPage: { '@type': 'WebPage', '@id': url },
          headline: post.title.slice(0, 110),
          description: post.meta_description || post.excerpt,
          image: [absUrl(base, post.og_image || post.cover_image)].filter(Boolean),
          datePublished: post.published_at,
          dateModified: post.updated_at || post.published_at,
          author: { '@type': 'Person', name: post.author_name || orgName, url: `${base}/about` },
          publisher: { '@type': 'Organization', name: orgName, logo: { '@type': 'ImageObject', url: absUrl(base, settings.seo_org_logo || '/branding/logo_symbol.png') } },
          articleSection: cat?.title,
          keywords: post.tags?.join(', '),
          wordCount: wordCount(post.content),
          inLanguage: 'en-GB',
        },
        breadcrumbLd(base, crumbs),
      ]}
    />
  )

  const toc = rendered.toc.length >= 3 && (
    <nav className="b-toc" aria-label="Table of contents">
      <strong><ListTree size={16} /> On this page</strong>
      <ol>{rendered.toc.map((h) => <li key={h.id} className={`d${h.depth}`}><a href={`#${h.id}`}>{h.text}</a></li>)}</ol>
    </nav>
  )

  const body = (
    <>
      <div className="b-prose" onClick={onArticleClick} dangerouslySetInnerHTML={{ __html: rendered.html }} />
      {post.tags?.length > 0 && (
        <div className="b-tags">
          {post.tags.map((t) => <Link key={t} to={`/blog?tag=${encodeURIComponent(t)}`} rel="tag">#{t}</Link>)}
        </div>
      )}
      <ShareBar url={url} title={post.title} />
      <aside className="b-cta">
        <div>
          <h2>Have an idea or project?</h2>
          <p>Let's talk and turn it into a plan.</p>
        </div>
        <Link to="/book" className="btn btn-gold btn-pill"><CalendarDays size={18} /> Book a Chat</Link>
      </aside>
    </>
  )

  const relatedBlock = related.length > 0 && (
    <section className="b-related" aria-label="Related articles">
      <h2 className="more-title">Keep reading</h2>
      <div className="b-grid">{related.map((p) => <PostCard key={p.id} p={p} />)}</div>
    </section>
  )

  const head = (
    <header className="b-head">
      <PostMeta p={post} cat={cat} />
      <h1>{post.title}</h1>
      {post.excerpt && <p className="b-lede">{post.excerpt}</p>}
      <p className="b-author">By <Link to="/about">{post.author_name || orgName}</Link></p>
    </header>
  )
  const cover = post.cover_image && (
    <figure className="b-cover"><img src={post.cover_image} alt={post.cover_alt || post.title} fetchPriority="high" /></figure>
  )

  if (isMobile)
    return (
      <Sheet>
        {seo}
        <article className="b-article">
          {head}
          {cover}
          {toc}
          {body}
        </article>
        {relatedBlock}
      </Sheet>
    )

  return (
    <section className="section page-top">
      {seo}
      <div className="container">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link> / <Link to="/blog">Blog</Link>
          {cat && <> / <Link to={`/blog/category/${cat.slug}`}>{cat.title}</Link></>}
        </nav>
        <article className="b-article">
          <div className="b-narrow">{head}</div>
          {cover}
          <div className={`b-layout ${toc ? 'has-toc' : ''}`}>
            {toc && <div className="b-toc-col">{toc}</div>}
            <div className="b-narrow">{body}</div>
          </div>
        </article>
        {relatedBlock}
      </div>
    </section>
  )
}
