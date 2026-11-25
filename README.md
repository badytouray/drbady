# Dr Bady — website, mobile app UI & admin panel

React + Vite site with a Supabase backend.

- **Desktop (> 820px):** website layout with header, hero, products, services and CTA footer.
- **Mobile (≤ 820px):** app-style UI with a splash screen, top bar, white sheets and a bottom tab bar (Home / Products / Services / More).
- **Blog (`/blog`):** articles with categories, tags, search, pagination, table of contents, related posts and share buttons.
- **Admin (`/admin`):** manage products, services, academy programmes, FAQs, blog posts & categories, per-page SEO and site settings. View and manage consultation bookings and academy sign-ups ("Academy People").

Without Supabase configured, the site runs on built-in seed content (`src/lib/seed.js`) and forms run in demo mode.

## 1. Run locally

```bash
npm install
npm run dev        # http://localhost:5173  ·  admin: http://localhost:5173/admin
```

## 2. Connect Supabase

1. Create a project at https://supabase.com.
2. In **SQL Editor**, paste and run all of [`supabase/schema.sql`](supabase/schema.sql). This creates the tables, security rules, the `media` image bucket and the starting content.
   Then run [`supabase/blog_seo.sql`](supabase/blog_seo.sql) (blog tables, per-page SEO) and [`supabase/academy_details.sql`](supabase/academy_details.sql) (academy detail pages) the same way. All files are safe to re-run.
3. Copy `.env.example` to `.env` and fill in the values from **Project Settings → API**:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=...
   ```
4. Create your admin login: **Authentication → Users → Add user** (email and password, tick "auto confirm").
5. Give that user admin rights (SQL Editor):
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'you@example.com';
   ```
6. Restart `npm run dev` and sign in at `/admin`.

Tip: under **Authentication → Providers → Email**, turn off "Allow new users to sign up" so nobody else can create accounts. Even if someone does sign up, they can't edit anything unless they're in the `admins` table.

## What the admin can manage

| Section | What you can edit |
|---|---|
| Products | Title, slug, card text, detail subtitle, cover image (upload), icon and colour, link list (e.g. Buy a Car → URL), checklist, button text/link/icon, order, publish on/off |
| Services | Title, short title for the home strip, description, icon, image, "what's included", order, publish |
| Academy Programmes | Each programme gets its own page at `/academy/<slug>`. Edit image, type, level, dates, schedule, duration, location, price, places, instructor, "what you will learn", requirements, **your own key facts** (any label → value with an icon), **free page content** (Markdown editor with images, headings, tables…), Q&As, button text, SEO title/description/share image, noindex |
| Academy People | Everyone who registered for a programme: change status, WhatsApp/email them, export CSV |
| Bookings | "Book a Chat" consultation requests: status, reply buttons, export CSV |
| FAQs | Questions and answers |
| Blog → Posts | Markdown editor (toolbar, image upload, split preview), excerpt, cover image + alt text, category, tags, author, featured, draft / publish / schedule (future date), duplicate. SEO panel: focus keyword, SEO title, meta description, share image, canonical URL, noindex, Google preview and a live SEO checklist/score |
| Blog → Categories | Name, slug, description, SEO title/description, order, publish |
| SEO & Pages | Title, meta description, share image, sitemap frequency/priority and noindex for every fixed page (Home, Products, Blog, About…). Links to the live sitemap, robots.txt and RSS |
| Settings | Phone, WhatsApp, email, hero text and photo (desktop and mobile), footer CTA, About page, **SEO defaults** (website address, site name, title suffix, default description/share image, logo, X handle) |
| Products / Services | Also have optional SEO title + meta description |

## SEO

- **Per-page tags:** every page renders its own `<title>`, meta description, canonical URL, robots, Open Graph and Twitter tags (`src/components/Seo.jsx`), plus JSON-LD: Organization + WebSite (home), BlogPosting, BreadcrumbList, Service, FAQPage.
- **Server-rendered meta for crawlers (Vercel):** `api/render.js` serves every public URL with the correct tags already in the HTML and a crawler-readable copy of the content (full article text for blog posts), so WhatsApp/Facebook/LinkedIn previews and non-JS crawlers see the right title, description and image. Unknown URLs and missing posts return a real **404**. `/admin` is `noindex`.
- **Dynamic sitemap:** `/sitemap.xml` is a sitemap index →
  - `/sitemap-pages.xml`: fixed pages (from *SEO & Pages*, respecting "include in sitemap" / noindex) + every published product, service and academy programme
  - `/sitemap-blog.xml`: every live blog post (with `lastmod` and cover image) + categories that have posts. Drafts, scheduled posts (until their date), noindex posts and posts with an external canonical are left out automatically.
- **`/robots.txt`** (points to the sitemap, blocks `/admin`, `/api`, search/tag filter URLs) and **`/rss.xml`** feed are generated the same way.
- All of these are cached at the CDN for 5–10 minutes, so a newly published post appears within minutes. In `npm run dev` the sitemap/robots/RSS URLs work too (served by a Vite middleware using the same code).

After deploying: set **Settings → SEO defaults → Website address** to your real domain, then submit `https://your-domain/sitemap.xml` in Google Search Console and Bing Webmaster Tools.

## Build / deploy

```bash
npm run build      # output in dist/
```

Deploy on **Vercel** (recommended; `vercel.json` and the `api/` functions are set up for it). Set the two `VITE_SUPABASE_*` environment variables in the Vercel project (they're used by both the site and the SEO functions). Optionally set `SITE_URL=https://your-domain`.

Other static hosts (Netlify, Cloudflare Pages) can serve `dist/` with an SPA rewrite (all routes → `/index.html`), but the dynamic sitemap, robots.txt, RSS and server-side meta tags need the `api/` functions, so they only work on Vercel without extra porting.

## Project layout

```
src/
  pages/        Home, Products, Services, Academy, Blog, Info (About/Contact/FAQs/More)
  components/   Header, CtaBand, MobileShell (tabs + splash), Forms, ListRow, Logo, Seo
  admin/        AdminApp, CrudPage (generic editor), BlogAdmin, PageSeoAdmin, SeoTools, Submissions, Settings, config.js
  lib/          supabase client, api helpers, markdown renderer, seed data, icons
api/            Vercel functions: render.js (meta tags per URL), seo.js (sitemaps, robots, RSS), _lib/seo-core.js
supabase/schema.sql, supabase/blog_seo.sql
public/         images & branding assets
```

To add an editable field, add a column in Supabase and a line in `src/admin/config.js`.
