// Server-side SEO: sitemaps, robots.txt, RSS and per-URL meta tags for crawlers.
// Used by the Vercel functions in /api and by the Vite dev server (vite.config.js).
// Reads Supabase over its REST API with the public anon key (RLS only exposes
// published content), and falls back to the seed data when Supabase is not set up.
import { renderMarkdown } from '../../src/lib/markdown.js'
import {
  seedSettings, seedPageSeo, seedProducts, seedServices, seedBlogCategories, seedBlogPosts, seedPrograms,
} from '../../src/lib/seed.js'

const SEEDS = {
  page_seo: seedPageSeo,
  products: seedProducts,
  services: seedServices,
  blog_categories: seedBlogCategories,
  blog_posts: seedBlogPosts,
  academy_programs: seedPrograms,
}

export function envFrom(source = {}) {
  return {
    url: source.SUPABASE_URL || source.VITE_SUPABASE_URL || '',
    key: source.SUPABASE_ANON_KEY || source.VITE_SUPABASE_ANON_KEY || '',
    siteUrl: source.SITE_URL || '',
  }
}

const esc = (s = '') =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
const trim = (u = '') => String(u).replace(/\/+$/, '')
const abs = (base, u) => (!u ? '' : /^https?:\/\//i.test(u) ? u : `${base}${u.startsWith('/') ? '' : '/'}${u}`)
const iso = (d) => (d ? new Date(d).toISOString() : undefined)

async function rest(env, table, params = {}) {
  if (!env.url || !env.key) return null
  const qs = new URLSearchParams(params).toString()
  const r = await fetch(`${trim(env.url)}/rest/v1/${table}?${qs}`, {
    headers: { apikey: env.key, Authorization: `Bearer ${env.key}`, Accept: 'application/json' },
  })
  if (!r.ok) throw new Error(`${table}: ${r.status} ${await r.text()}`)
  return r.json()
}

/** Query with seed fallback. `filter(row)` mirrors the REST filter for seeds. */
async function q(env, table, params, filter = () => true) {
  try {
    const rows = await rest(env, table, params)
    if (rows) return rows
  } catch (e) {
    console.warn('[seo]', e.message)
  }
  return (SEEDS[table] || []).filter(filter)
}

const nowIso = () => new Date().toISOString()
const isLive = (p) => p.published && new Date(p.published_at) <= new Date()

export async function loadSettings(env) {
  try {
    const rows = await rest(env, 'site_settings', { select: 'data', id: 'eq.1' })
    if (rows?.[0]?.data) return { ...seedSettings, ...rows[0].data }
  } catch (e) {
    console.warn('[seo]', e.message)
  }
  return seedSettings
}

export function baseUrl(env, settings, origin) {
  return trim(settings?.site_url) || trim(env.siteUrl) || trim(origin)
}

// ---------------------------------------------------------------- sitemaps
const XML_HEAD = '<?xml version="1.0" encoding="UTF-8"?>\n'

function urlEntry({ loc, lastmod, changefreq, priority, images = [] }) {
  return [
    '  <url>',
    `    <loc>${esc(loc)}</loc>`,
    lastmod && `    <lastmod>${lastmod}</lastmod>`,
    changefreq && `    <changefreq>${changefreq}</changefreq>`,
    priority != null && `    <priority>${Number(priority).toFixed(1)}</priority>`,
    ...images.filter((i) => i.loc).map((i) => `    <image:image><image:loc>${esc(i.loc)}</image:loc>${i.title ? `<image:title>${esc(i.title)}</image:title>` : ''}</image:image>`),
    '  </url>',
  ].filter(Boolean).join('\n')
}

function urlset(entries) {
  return `${XML_HEAD}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${entries.map(urlEntry).join('\n')}\n</urlset>\n`
}

async function livePosts(env, select, extra = {}) {
  return q(
    env, 'blog_posts',
    { select, published: 'eq.true', published_at: `lte.${nowIso()}`, order: 'published_at.desc', ...extra },
    isLive,
  )
}

export async function sitemapIndex(env, origin) {
  const settings = await loadSettings(env)
  const base = baseUrl(env, settings, origin)
  const [latest] = await livePosts(env, 'updated_at,published_at', { limit: '1' })
  const blogMod = iso(latest?.updated_at || latest?.published_at)
  return `${XML_HEAD}<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${esc(base)}/sitemap-pages.xml</loc></sitemap>
  <sitemap><loc>${esc(base)}/sitemap-blog.xml</loc>${blogMod ? `<lastmod>${blogMod}</lastmod>` : ''}</sitemap>
</sitemapindex>
`
}

export async function sitemapPages(env, origin) {
  const settings = await loadSettings(env)
  const base = baseUrl(env, settings, origin)
  const [pages, products, services, programs] = await Promise.all([
    q(env, 'page_seo', { select: '*', order: 'sort_order' }),
    q(env, 'products', { select: 'slug,title,cover_image,updated_at,created_at', published: 'eq.true', order: 'sort_order' }, (r) => r.published),
    q(env, 'services', { select: 'slug,title,cover_image,updated_at,created_at', published: 'eq.true', order: 'sort_order' }, (r) => r.published),
    q(env, 'academy_programs', { select: '*', published: 'eq.true', order: 'sort_order' }, (r) => r.published),
  ])
  const entries = [
    ...pages.filter((p) => p.in_sitemap !== false && !p.noindex).map((p) => ({
      loc: `${base}${p.path === '/' ? '/' : p.path}`,
      lastmod: iso(p.updated_at),
      changefreq: p.changefreq,
      priority: p.priority,
      images: p.og_image ? [{ loc: abs(base, p.og_image) }] : [],
    })),
    ...products.map((p) => ({
      loc: `${base}/products/${p.slug}`, lastmod: iso(p.updated_at || p.created_at), changefreq: 'monthly', priority: 0.8,
      images: p.cover_image ? [{ loc: abs(base, p.cover_image), title: p.title }] : [],
    })),
    ...services.map((s) => ({
      loc: `${base}/services/${s.slug}`, lastmod: iso(s.updated_at || s.created_at), changefreq: 'monthly', priority: 0.7,
      images: s.cover_image ? [{ loc: abs(base, s.cover_image), title: s.title }] : [],
    })),
    ...programs.filter((a) => !a.noindex).map((a) => ({
      loc: `${base}/academy/${a.slug}`, lastmod: iso(a.updated_at || a.created_at), changefreq: 'weekly', priority: 0.8,
      images: a.cover_image ? [{ loc: abs(base, a.cover_image), title: a.title }] : [],
    })),
  ]
  return urlset(entries)
}

export async function sitemapBlog(env, origin) {
  const settings = await loadSettings(env)
  const base = baseUrl(env, settings, origin)
  const [posts, cats] = await Promise.all([
    livePosts(env, 'slug,title,cover_image,category_id,noindex,canonical_url,updated_at,published_at'),
    q(env, 'blog_categories', { select: 'id,slug,updated_at', published: 'eq.true', order: 'sort_order' }, (r) => r.published),
  ])
  const own = (p) => !p.noindex && (!p.canonical_url || trim(p.canonical_url) === `${base}/blog/${p.slug}`)
  const latestIn = (catId) => posts.find((p) => p.category_id === catId)
  const entries = [
    ...posts.filter(own).map((p) => ({
      loc: `${base}/blog/${p.slug}`,
      lastmod: iso(p.updated_at || p.published_at),
      changefreq: 'weekly',
      priority: 0.7,
      images: p.cover_image ? [{ loc: abs(base, p.cover_image), title: p.title }] : [],
    })),
    ...cats.filter((c) => latestIn(c.id)).map((c) => {
      const lp = latestIn(c.id)
      return { loc: `${base}/blog/category/${c.slug}`, lastmod: iso(lp.updated_at || lp.published_at), changefreq: 'weekly', priority: 0.5 }
    }),
  ]
  return urlset(entries)
}

export async function robotsTxt(env, origin) {
  const settings = await loadSettings(env)
  const base = baseUrl(env, settings, origin)
  return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /*?q=
Disallow: /*?tag=

Sitemap: ${base}/sitemap.xml
`
}

export async function rssFeed(env, origin) {
  const settings = await loadSettings(env)
  const base = baseUrl(env, settings, origin)
  const [posts, cats] = await Promise.all([
    livePosts(env, 'slug,title,excerpt,cover_image,author_name,category_id,tags,published_at,noindex', { limit: '30' }),
    q(env, 'blog_categories', { select: 'id,title', published: 'eq.true' }, (r) => r.published),
  ])
  const name = settings.seo_site_name || 'Dr Bady'
  const items = posts.slice(0, 30).map((p) => {
    const link = `${base}/blog/${p.slug}`
    const cat = cats.find((c) => c.id === p.category_id)
    return `    <item>
      <title>${esc(p.title)}</title>
      <link>${esc(link)}</link>
      <guid isPermaLink="true">${esc(link)}</guid>
      <pubDate>${new Date(p.published_at).toUTCString()}</pubDate>
      ${p.author_name ? `<dc:creator>${esc(p.author_name)}</dc:creator>` : ''}
      ${cat ? `<category>${esc(cat.title)}</category>` : ''}
      <description>${esc(p.excerpt || '')}</description>
      ${p.cover_image ? `<enclosure url="${esc(abs(base, p.cover_image))}" type="image/${/\.png$/i.test(p.cover_image) ? 'png' : /\.webp$/i.test(p.cover_image) ? 'webp' : 'jpeg'}" length="0" />` : ''}
    </item>`
  })
  return `${XML_HEAD}<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${esc(name)} Blog</title>
    <link>${esc(base)}/blog</link>
    <atom:link href="${esc(base)}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${esc(settings.seo_default_description || '')}</description>
    <language>en-gb</language>
    ${posts[0] ? `<lastBuildDate>${new Date(posts[0].published_at).toUTCString()}</lastBuildDate>` : ''}
${items.join('\n')}
  </channel>
</rss>
`
}

// ---------------------------------------------------------------- HTML meta injection
const STATIC_LABELS = { '/': 'Home', '/products': 'Products', '/services': 'Services', '/blog': 'Blog', '/academy': 'Academy', '/about': 'About', '/contact': 'Contact', '/book': 'Book a Chat', '/faqs': 'FAQs', '/more': 'More' }

function fullTitle(title, s) {
  const name = s.seo_site_name || 'Dr Bady'
  if (!title) return name
  if (title.includes(name)) return title
  return `${title}${s.seo_title_suffix ?? ` | ${name}`}`
}

function headTags(m) {
  const t = (tag) => tag.replace(/^<(\w+)/, '<$1 data-ssr')
  const out = [
    `<title>${esc(m.title)}</title>`,
    m.description && `<meta name="description" content="${esc(m.description)}" />`,
    `<meta name="robots" content="${m.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1'}" />`,
    m.canonical && `<link rel="canonical" href="${esc(m.canonical)}" />`,
    `<meta property="og:site_name" content="${esc(m.siteName)}" />`,
    `<meta property="og:type" content="${m.type || 'website'}" />`,
    `<meta property="og:title" content="${esc(m.title)}" />`,
    m.description && `<meta property="og:description" content="${esc(m.description)}" />`,
    m.canonical && `<meta property="og:url" content="${esc(m.canonical)}" />`,
    m.image && `<meta property="og:image" content="${esc(m.image)}" />`,
    m.imageAlt && `<meta property="og:image:alt" content="${esc(m.imageAlt)}" />`,
    `<meta property="og:locale" content="en_GB" />`,
    m.published && `<meta property="article:published_time" content="${esc(m.published)}" />`,
    m.modified && `<meta property="article:modified_time" content="${esc(m.modified)}" />`,
    `<meta name="twitter:card" content="${m.image ? 'summary_large_image' : 'summary'}" />`,
    m.twitter && `<meta name="twitter:site" content="${esc(m.twitter)}" />`,
    `<meta name="twitter:title" content="${esc(m.title)}" />`,
    m.description && `<meta name="twitter:description" content="${esc(m.description)}" />`,
    m.image && `<meta name="twitter:image" content="${esc(m.image)}" />`,
    ...(m.jsonLd || []).map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`),
  ]
  return out.filter(Boolean).map(t).join('\n    ')
}

const crumbLd = (base, items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: `${base}${it.path}` })),
})

const linkList = (items) =>
  items.length ? `<ul>${items.map((i) => `<li><a href="${esc(i.href)}">${esc(i.text)}</a></li>`).join('')}</ul>` : ''

/**
 * Work out meta tags + crawler-visible body for a path.
 * Returns { status, head, body }.
 */
export async function pageMeta(env, origin, rawPath) {
  let path = decodeURIComponent((rawPath || '/').split('?')[0]) || '/'
  if (path.length > 1) path = path.replace(/\/+$/, '')
  const settings = await loadSettings(env)
  const base = baseUrl(env, settings, origin)
  const siteName = settings.seo_site_name || 'Dr Bady'
  const pages = await q(env, 'page_seo', { select: '*' })
  const defaults = {
    siteName,
    twitter: settings.seo_twitter,
    image: abs(base, settings.seo_default_image),
    description: settings.seo_default_description,
    canonical: `${base}${path === '/' ? '/' : path}`,
  }
  const org = { '@type': 'Organization', name: siteName, url: base, logo: { '@type': 'ImageObject', url: abs(base, settings.seo_org_logo || '/branding/logo_symbol.png') } }
  const nav = linkList([
    { href: '/', text: 'Home' }, { href: '/products', text: 'Products' }, { href: '/services', text: 'Services' },
    { href: '/blog', text: 'Blog' }, { href: '/academy', text: 'Academy' }, { href: '/about', text: 'About' }, { href: '/contact', text: 'Contact' },
  ])
  const shell = (inner) => `<div class="ssr-shell">${inner}<nav aria-label="Site">${nav}</nav></div>`
  let m
  let body
  let status = 200
  let seg

  if ((seg = path.match(/^\/blog\/category\/([^/]+)$/))) {
    const [cat] = await q(env, 'blog_categories', { select: '*', slug: `eq.${seg[1]}`, published: 'eq.true', limit: '1' }, (c) => c.slug === seg[1] && c.published)
    if (cat) {
      const posts = (await livePosts(env, 'slug,title,category_id', { category_id: `eq.${cat.id}`, limit: '30' })).filter((p) => p.category_id === cat.id)
      m = { ...defaults, title: fullTitle(cat.meta_title || `${cat.title} articles`, settings), description: cat.meta_description || cat.description || defaults.description,
        jsonLd: [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: cat.title, url: defaults.canonical }, crumbLd(base, [{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }, { name: cat.title, path }])] }
      body = shell(`<h1>${esc(cat.title)}</h1><p>${esc(cat.description || '')}</p>${linkList(posts.map((p) => ({ href: `/blog/${p.slug}`, text: p.title })))}`)
    }
  } else if ((seg = path.match(/^\/blog\/([^/]+)$/))) {
    const [post] = await livePosts(env, '*', { slug: `eq.${seg[1]}`, limit: '1' }).then((r) => r.filter((p) => p.slug === seg[1]))
    if (post) {
      const cats = await q(env, 'blog_categories', { select: 'id,title,slug', id: `eq.${post.category_id}` }, (c) => c.id === post.category_id)
      const cat = post.category_id ? cats[0] : null
      const desc = post.meta_description || post.excerpt || defaults.description
      const img = abs(base, post.og_image || post.cover_image) || defaults.image
      const canonical = post.canonical_url || `${base}/blog/${post.slug}`
      m = {
        ...defaults, type: 'article', title: fullTitle(post.meta_title || post.title, settings), description: desc, image: img, imageAlt: post.cover_alt,
        canonical, noindex: post.noindex, published: iso(post.published_at), modified: iso(post.updated_at || post.published_at),
        jsonLd: [
          {
            '@context': 'https://schema.org', '@type': 'BlogPosting', mainEntityOfPage: { '@type': 'WebPage', '@id': `${base}/blog/${post.slug}` },
            headline: post.title.slice(0, 110), description: desc, image: [img], datePublished: iso(post.published_at), dateModified: iso(post.updated_at || post.published_at),
            author: { '@type': 'Person', name: post.author_name || siteName, url: `${base}/about` }, publisher: org,
            articleSection: cat?.title, keywords: (post.tags || []).join(', '), inLanguage: 'en-GB',
          },
          crumbLd(base, [{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }, ...(cat ? [{ name: cat.title, path: `/blog/category/${cat.slug}` }] : []), { name: post.title, path }]),
        ],
      }
      const { html } = renderMarkdown(post.content)
      body = shell(`<article><h1>${esc(post.title)}</h1><p><time datetime="${esc(iso(post.published_at))}">${new Date(post.published_at).toDateString()}</time> · ${esc(post.author_name || siteName)}</p>${post.cover_image ? `<img src="${esc(post.cover_image)}" alt="${esc(post.cover_alt || post.title)}" />` : ''}${html}</article>`)
    }
  } else if ((seg = path.match(/^\/academy\/([^/]+)$/))) {
    const slug = seg[1]
    const [a] = await q(env, 'academy_programs', { select: '*', slug: `eq.${slug}`, published: 'eq.true', limit: '1' }, (r) => r.slug === slug && r.published)
    if (a) {
      const desc = a.meta_description || a.short_description || defaults.description
      const facts = [
        a.start_date && ['Date', a.end_date && a.end_date !== a.start_date ? `${a.start_date} – ${a.end_date}` : a.start_date],
        a.schedule && ['Schedule', a.schedule], a.duration && ['Duration', a.duration], a.location && ['Location', a.location],
        a.level && ['Level', a.level], a.price && ['Price', a.price], a.instructor && ['With', a.instructor],
        ...(a.details || []).filter((d) => d.label).map((d) => [d.label, d.value]),
      ].filter(Boolean)
      m = {
        ...defaults, title: fullTitle(a.meta_title || a.title, settings), description: desc, image: abs(base, a.og_image || a.cover_image) || defaults.image, noindex: a.noindex,
        jsonLd: [
          {
            '@context': 'https://schema.org', '@type': 'Course', name: a.title, description: desc, url: defaults.canonical,
            provider: { '@type': 'Organization', name: siteName, sameAs: base },
            hasCourseInstance: { '@type': 'CourseInstance', courseMode: /online/i.test(a.location || '') ? 'Online' : 'Onsite', ...(a.start_date ? { startDate: a.start_date } : {}), ...(a.end_date ? { endDate: a.end_date } : {}) },
          },
          ...((a.faqs || []).length ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: a.faqs.filter((f) => f.question && f.answer).map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })) }] : []),
          crumbLd(base, [{ name: 'Home', path: '/' }, { name: 'Academy', path: '/academy' }, { name: a.title, path }]),
        ],
      }
      const list = (title, arr) => (arr?.length ? `<h2>${title}</h2><ul>${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '')
      body = shell(`<article><h1>${esc(a.title)}</h1><p>${esc(a.short_description || '')}</p>`
        + (facts.length ? `<dl>${facts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : '')
        + list('What you will learn', a.outcomes)
        + (a.content ? renderMarkdown(a.content).html : a.description ? `<p>${esc(a.description)}</p>` : '')
        + list('What you need', a.requirements)
        + ((a.faqs || []).length ? `<h2>Questions &amp; answers</h2>${a.faqs.map((f) => `<h3>${esc(f.question)}</h3><p>${esc(f.answer)}</p>`).join('')}` : '')
        + '</article>')
    }
  } else if ((seg = path.match(/^\/(products|services)\/([^/]+)$/))) {
    const [kind, slug] = [seg[1], seg[2]]
    const [row] = await q(env, kind, { select: '*', slug: `eq.${slug}`, published: 'eq.true', limit: '1' }, (r) => r.slug === slug && r.published)
    if (row) {
      const label = kind === 'products' ? 'Products' : 'Services'
      const desc = row.meta_description || row.tagline || row.description || row.short_description || defaults.description
      m = { ...defaults, title: fullTitle(row.meta_title || row.title, settings), description: desc, image: abs(base, row.cover_image) || defaults.image,
        jsonLd: [crumbLd(base, [{ name: 'Home', path: '/' }, { name: label, path: `/${kind}` }, { name: row.title, path }])] }
      body = shell(`<h1>${esc(row.title)}</h1><p>${esc(desc)}</p>${(row.features || []).length ? `<ul>${row.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}`)
    }
  } else {
    const row = pages.find((p) => p.path === path)
    if (row || STATIC_LABELS[path]) {
      const title = row?.title || STATIC_LABELS[path]
      m = { ...defaults, title: fullTitle(title, settings), description: row?.description || defaults.description, image: abs(base, row?.og_image) || defaults.image, noindex: row?.noindex }
      if (path === '/') m.jsonLd = [{ '@context': 'https://schema.org', ...org, email: settings.email, telephone: settings.phone }, { '@context': 'https://schema.org', '@type': 'WebSite', name: siteName, url: base }]
      let extra = ''
      if (path === '/blog') {
        const posts = await livePosts(env, 'slug,title', { limit: '50' })
        extra = linkList(posts.map((p) => ({ href: `/blog/${p.slug}`, text: p.title })))
      } else if (path === '/academy') {
        const rows = await q(env, 'academy_programs', { select: 'slug,title', published: 'eq.true', order: 'sort_order' }, (r) => r.published)
        extra = linkList(rows.map((r) => ({ href: `/academy/${r.slug}`, text: r.title })))
      } else if (path === '/products' || path === '/services') {
        const rows = await q(env, path.slice(1), { select: 'slug,title', published: 'eq.true', order: 'sort_order' }, (r) => r.published)
        extra = linkList(rows.map((r) => ({ href: `${path}/${r.slug}`, text: r.title })))
      }
      body = shell(`<h1>${esc(title)}</h1>${m.description ? `<p>${esc(m.description)}</p>` : ''}${extra}`)
    }
  }

  if (!m) {
    status = 404
    m = { ...defaults, title: fullTitle('Page not found', settings), noindex: true, canonical: undefined }
    body = shell('<h1>Page not found</h1>')
  }
  return { status, head: headTags(m), body }
}

/** Inject meta + body into the built index.html template. */
export function injectHtml(template, { head, body }) {
  let html = template
  html = html.replace(/<!--seo-->[\s\S]*?<!--\/seo-->/, `<!--seo-->\n    ${head}\n    <!--/seo-->`)
  html = html.replace('<!--app-->', body || '')
  return html
}
