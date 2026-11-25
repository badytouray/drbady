// GET /sitemap.xml, /sitemap-pages.xml, /sitemap-blog.xml, /robots.txt, /rss.xml
// (mapped here by vercel.json rewrites). Always reflects current Supabase content.
import { envFrom, sitemapIndex, sitemapPages, sitemapBlog, robotsTxt, rssFeed } from './_lib/seo-core.js'

const HANDLERS = {
  index: [sitemapIndex, 'application/xml'],
  pages: [sitemapPages, 'application/xml'],
  blog: [sitemapBlog, 'application/xml'],
  robots: [robotsTxt, 'text/plain'],
  rss: [rssFeed, 'application/rss+xml'],
}

export function originOf(req) {
  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0]
  const host = req.headers['x-forwarded-host'] || req.headers.host
  return `${proto}://${host}`
}

export default async function handler(req, res) {
  const type = new URL(req.url, 'http://x').searchParams.get('type') || 'index'
  const h = HANDLERS[type]
  if (!h) {
    res.statusCode = 404
    return res.end('Not found')
  }
  try {
    const body = await h[0](envFrom(process.env), originOf(req))
    res.setHeader('Content-Type', `${h[1]}; charset=utf-8`)
    // CDN caches for 10 min, then serves stale while refreshing in the background.
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400')
    res.end(body)
  } catch (e) {
    console.error(e)
    res.statusCode = 500
    res.end('Error generating file')
  }
}
