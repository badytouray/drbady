import { copyFile, rm } from 'node:fs/promises'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { envFrom, robotsTxt, rssFeed, sitemapBlog, sitemapIndex, sitemapPages } from './api/_lib/seo-core.js'

const SEO_FILES = {
  '/sitemap.xml': [sitemapIndex, 'application/xml'],
  '/sitemap-pages.xml': [sitemapPages, 'application/xml'],
  '/sitemap-blog.xml': [sitemapBlog, 'application/xml'],
  '/robots.txt': [robotsTxt, 'text/plain'],
  '/rss.xml': [rssFeed, 'application/rss+xml'],
}

/**
 * - dev:   serve the dynamic sitemap / robots / RSS from the same code Vercel uses.
 * - build: copy index.html → app.html (template for api/render.js). On Vercel the
 *          original index.html is removed so "/" also goes through api/render.js
 *          and gets server-side meta tags.
 */
function seoPlugin(env) {
  let outDir = 'dist'
  return {
    name: 'drbady-seo',
    configResolved(c) { outDir = path.resolve(c.root, c.build.outDir) },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const h = SEO_FILES[req.url.split('?')[0]]
        if (!h) return next()
        try {
          const origin = `http://${req.headers.host}`
          res.setHeader('Content-Type', `${h[1]}; charset=utf-8`)
          res.end(await h[0](envFrom(env), origin))
        } catch (e) { next(e) }
      })
    },
    async closeBundle() {
      await copyFile(path.join(outDir, 'index.html'), path.join(outDir, 'app.html')).catch(() => {})
      if (process.env.VERCEL) await rm(path.join(outDir, 'index.html'), { force: true })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') }
  return {
    plugins: [react(), seoPlugin(env)],
  }
})
