# Dr Bady — website, mobile app UI & admin panel

React + Vite site with a Supabase backend.

- **Desktop (> 820px):** website layout with header, hero, products, services and CTA footer.
- **Mobile (≤ 820px):** app-style UI with a splash screen, top bar, white sheets and a bottom tab bar (Home / Products / Services / More).
- **Admin (`/admin`):** manage products, services, academy programmes, FAQs and site settings. View and manage consultation bookings and academy sign-ups ("Academy People").

Without Supabase configured, the site runs on built-in seed content (`src/lib/seed.js`) and forms run in demo mode.

## 1. Run locally

```bash
npm install
npm run dev        # http://localhost:5173  ·  admin: http://localhost:5173/admin
```

## 2. Connect Supabase

1. Create a project at https://supabase.com.
2. In **SQL Editor**, paste and run all of [`supabase/schema.sql`](supabase/schema.sql). This creates the tables, security rules, the `media` image bucket and the starting content.
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
| Academy Programmes | Workshops/masterclasses with image, date, duration, location, price, capacity, outcomes |
| Academy People | Everyone who registered for a programme: change status, WhatsApp/email them, export CSV |
| Bookings | "Book a Chat" consultation requests: status, reply buttons, export CSV |
| FAQs | Questions and answers |
| Settings | Phone, WhatsApp, email, hero text and photo (desktop and mobile), footer CTA, About page |

## Build / deploy

```bash
npm run build      # output in dist/
```

Deploy `dist/` to Vercel, Netlify or Cloudflare Pages. Set the two `VITE_SUPABASE_*` environment variables there, and add an SPA rewrite (all routes → `/index.html`) so links like `/products/motor-gambia` and `/admin` load on refresh.

## Project layout

```
src/
  pages/        Home, Products, Services, Academy, Info (About/Contact/FAQs/More)
  components/   Header, CtaBand, MobileShell (tabs + splash), Forms, ListRow, Logo
  admin/        AdminApp, CrudPage (generic editor), Submissions, Settings, config.js
  lib/          supabase client, api helpers, seed data, icons
supabase/schema.sql
public/         images & branding assets
```

To add an editable field, add a column in Supabase and a line in `src/admin/config.js`.
