-- =============================================================
-- Dr Bady — Blog + SEO (run AFTER schema.sql)
-- Paste this whole file into Supabase → SQL Editor and run it.
-- Safe to re-run.
-- =============================================================

-- updated_at helper
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- Blog categories ----------
create table if not exists public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  meta_title text,
  meta_description text,
  sort_order int default 0,
  published boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Blog posts ----------
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,                         -- card text + fallback meta description
  content text not null default '',     -- Markdown
  cover_image text,
  cover_alt text,
  author_name text default 'Dr Bady',
  category_id uuid references public.blog_categories(id) on delete set null,
  tags text[] default '{}',
  featured boolean default false,
  reading_minutes int default 1,
  -- SEO
  meta_title text,
  meta_description text,
  focus_keyword text,
  canonical_url text,
  og_image text,
  noindex boolean default false,
  -- publishing
  published boolean default false,      -- false = draft
  published_at timestamptz not null default now(), -- future date = scheduled
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists blog_posts_pub_idx on public.blog_posts (published, published_at desc);
create index if not exists blog_posts_cat_idx on public.blog_posts (category_id);
create index if not exists blog_posts_tags_idx on public.blog_posts using gin (tags);

-- ---------- Per-page SEO for fixed site pages ----------
create table if not exists public.page_seo (
  path text primary key,                -- "/", "/about", "/blog" …
  label text not null,                  -- shown in admin
  title text,
  description text,
  og_image text,
  noindex boolean default false,
  in_sitemap boolean default true,
  changefreq text default 'monthly',    -- always|hourly|daily|weekly|monthly|yearly|never
  priority numeric(2,1) default 0.5,
  sort_order int default 0,
  updated_at timestamptz not null default now()
);

-- ---------- SEO fields on existing content ----------
alter table public.products         add column if not exists meta_title text;
alter table public.products         add column if not exists meta_description text;
alter table public.products         add column if not exists updated_at timestamptz not null default now();
alter table public.services         add column if not exists meta_title text;
alter table public.services         add column if not exists meta_description text;
alter table public.services         add column if not exists updated_at timestamptz not null default now();
alter table public.academy_programs add column if not exists updated_at timestamptz not null default now();

do $$
declare t text;
begin
  foreach t in array array['blog_categories','blog_posts','page_seo','products','services','academy_programs'] loop
    execute format('drop trigger if exists touch_updated_at on public.%I', t);
    execute format('create trigger touch_updated_at before update on public.%I for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- ---------- Row Level Security ----------
alter table public.blog_categories enable row level security;
alter table public.blog_posts      enable row level security;
alter table public.page_seo        enable row level security;

drop policy if exists "public read" on public.blog_categories;
create policy "public read" on public.blog_categories for select using (published or public.is_admin());
drop policy if exists "admin write" on public.blog_categories;
create policy "admin write" on public.blog_categories for all using (public.is_admin()) with check (public.is_admin());

-- visitors only see published posts whose publish date has arrived (scheduling)
drop policy if exists "public read" on public.blog_posts;
create policy "public read" on public.blog_posts for select using ((published and published_at <= now()) or public.is_admin());
drop policy if exists "admin write" on public.blog_posts;
create policy "admin write" on public.blog_posts for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read" on public.page_seo;
create policy "public read" on public.page_seo for select using (true);
drop policy if exists "admin write" on public.page_seo;
create policy "admin write" on public.page_seo for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Seed ----------
insert into public.page_seo (path, label, title, description, changefreq, priority, sort_order, noindex, in_sitemap) values
('/',          'Home',        'Dr Bady — Ideas • Build • Brand • Deliver', 'Digital products, business services and training that solve real problems in the UK, The Gambia and beyond.', 'weekly', 1.0, 1, false, true),
('/products',  'Products',    'Products', 'Purpose-built digital products for real-world needs: Motor Gambia, Security Reports, Creative Mindset and more.', 'monthly', 0.9, 2, false, true),
('/services',  'Services',    'Services', 'Web & app development, branding, printing, marketing, consulting and training for businesses in the UK and The Gambia.', 'monthly', 0.9, 3, false, true),
('/blog',      'Blog',        'Blog', 'Ideas, guides and stories on business, branding, technology and growth from Dr Bady.', 'daily', 0.9, 4, false, true),
('/academy',   'Academy',     'Academy', 'Workshops and masterclasses to build your skills, brand and business.', 'weekly', 0.8, 5, false, true),
('/about',     'About',       'About Dr Bady', 'Dr Bady is a creative entrepreneur building digital products, brands and businesses across the UK and The Gambia.', 'monthly', 0.7, 6, false, true),
('/contact',   'Contact',     'Contact', 'Get in touch about an idea, project or business challenge. WhatsApp, phone, email or book a chat.', 'yearly', 0.6, 7, false, true),
('/book',      'Book a Chat', 'Book a Chat', 'Book a free chat to turn your idea, project or business challenge into a plan.', 'yearly', 0.6, 8, false, true),
('/faqs',      'FAQs',        'Frequently Asked Questions', 'Answers to common questions about working with Dr Bady.', 'monthly', 0.5, 9, false, true),
('/more',      'More (mobile menu)', 'More', null, 'yearly', 0.1, 10, true, false)
on conflict (path) do nothing;

insert into public.blog_categories (slug, title, description, sort_order) values
('business', 'Business', 'Starting, running and growing a business.', 1),
('branding', 'Branding', 'Logos, identity and standing out.', 2),
('technology', 'Technology', 'Websites, apps and digital tools.', 3)
on conflict (slug) do nothing;

insert into public.blog_posts (slug, title, excerpt, content, cover_image, cover_alt, category_id, tags, featured, reading_minutes, focus_keyword, published, published_at)
select 'turn-your-idea-into-a-business',
  'How to Turn Your Idea Into a Real Business in 7 Days',
  'A practical 7-day plan to test your idea, build a simple brand and get your first customers.',
  E'Every business starts as an idea. The difference between an idea and a business is **action**. This 7-day plan helps you turn your idea into a business you can test with real customers.\n\n## Day 1–2: Spot the opportunity\n\nWrite down the problem you solve and who has it. Talk to five people who have that problem.\n\n## Day 3–4: Build and brand\n\n- Pick a clear name\n- Create a simple logo and colours\n- Set up a one-page website or social profile\n\n## Day 5–7: Promote and learn\n\nShare your offer, collect feedback and improve. Small steps every day beat a perfect plan that never starts.\n\n> Want help? [Book a free chat](/book) and we will build your plan together.',
  '/images/creative_mindset.png', 'Notebook and laptop on a desk planning a new business idea',
  (select id from public.blog_categories where slug = 'business'),
  '{"business ideas","startups","planning"}', true, 2, 'turn your idea into a business', true, now()
where not exists (select 1 from public.blog_posts);
