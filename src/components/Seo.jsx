import { useLocation } from 'react-router-dom'
import { useData } from '../lib/DataContext'

export const trimSlash = (u = '') => String(u).replace(/\/+$/, '')

export function siteUrlFrom(settings) {
  return trimSlash(settings?.site_url) || (typeof window !== 'undefined' ? window.location.origin : '')
}

export function absUrl(base, u) {
  if (!u) return undefined
  if (/^https?:\/\//i.test(u)) return u
  return `${base}${u.startsWith('/') ? '' : '/'}${u}`
}

/** Title with site suffix, unless it already contains the site name. */
export function fullTitle(title, s) {
  const name = s.seo_site_name || 'Dr Bady'
  if (!title) return name
  if (title.includes(name)) return title
  return `${title}${s.seo_title_suffix ?? ` | ${name}`}`
}

/**
 * Per-page SEO. React 19 hoists these tags into <head> and removes them on unmount.
 *  - path:   use the admin-managed row from "SEO & Pages" (page_seo) as defaults
 *  - title/description/image: override (detail pages, blog posts)
 *  - canonicalPath: path used for <link rel=canonical> (defaults to current path, no query)
 *  - jsonLd: object or array of schema.org objects
 */
export default function Seo({ path, title, description, image, imageAlt, type = 'website', noindex, canonical, canonicalPath, jsonLd, article, children }) {
  const { settings: s, pageSeo } = useData()
  const { pathname } = useLocation()
  const row = path ? pageSeo?.find((r) => r.path === path) : null
  const base = siteUrlFrom(s)

  const t = fullTitle(title || row?.title, s)
  const desc = (description || row?.description || s.seo_default_description || '').slice(0, 300)
  const img = absUrl(base, image || row?.og_image || s.seo_default_image)
  const canon = canonical || `${base}${canonicalPath ?? pathname}`
  const robots = noindex || row?.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1'
  const ld = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).filter(Boolean) : []

  return (
    <>
      <title>{t}</title>
      {desc && <meta name="description" content={desc} />}
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canon} />
      <meta property="og:site_name" content={s.seo_site_name || 'Dr Bady'} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={t} />
      {desc && <meta property="og:description" content={desc} />}
      <meta property="og:url" content={canon} />
      {img && <meta property="og:image" content={img} />}
      {img && imageAlt && <meta property="og:image:alt" content={imageAlt} />}
      <meta property="og:locale" content="en_GB" />
      {article?.published_time && <meta property="article:published_time" content={article.published_time} />}
      {article?.modified_time && <meta property="article:modified_time" content={article.modified_time} />}
      {article?.section && <meta property="article:section" content={article.section} />}
      {article?.tags?.map((tg) => <meta key={tg} property="article:tag" content={tg} />)}
      <meta name="twitter:card" content={img ? 'summary_large_image' : 'summary'} />
      {s.seo_twitter && <meta name="twitter:site" content={s.seo_twitter} />}
      <meta name="twitter:title" content={t} />
      {desc && <meta name="twitter:description" content={desc} />}
      {img && <meta name="twitter:image" content={img} />}
      {ld.map((obj, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(obj).replace(/</g, '\\u003c') }} />
      ))}
      {children}
    </>
  )
}

/** schema.org BreadcrumbList from [{ name, path }] */
export function breadcrumbLd(base, items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: `${base}${it.path}` })),
  }
}

export function useSiteBase() {
  const { settings } = useData()
  return siteUrlFrom(settings)
}
