-- =============================================================
-- Dr Bady — Supabase schema
-- Run this whole file once in Supabase Dashboard → SQL Editor.
-- Safe to re-run: uses IF NOT EXISTS / ON CONFLICT where possible.
-- =============================================================

create extension if not exists "pgcrypto";

-- ---------- Admins ----------
-- Only users listed here can edit content / read submissions.
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------- Site settings (single row, id = 1) ----------
create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------- Products ----------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  short_description text,          -- shown on cards / lists
  tagline text,                    -- shown under title on detail page
  description text,                -- long text on detail page (optional)
  cover_image text,                -- card + detail header image
  icon text default 'Box',         -- lucide icon name
  accent text default '#F5A300',   -- icon colour on mobile / detail badge
  features text[] default '{}',    -- checklist on detail page
  links jsonb default '[]'::jsonb, -- [{label, icon, url}] list on detail page
  cta_label text,
  cta_icon text default 'ExternalLink',
  cta_url text,
  website_url text,
  sort_order int default 0,
  published boolean default true,
  created_at timestamptz not null default now()
);

-- ---------- Services ----------
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,             -- "Web & App Development"
  short_title text,                -- "Web Development" (desktop strip)
  short_description text,
  description text,
  icon text default 'Briefcase',
  cover_image text,
  features text[] default '{}',
  sort_order int default 0,
  published boolean default true,
  created_at timestamptz not null default now()
);

-- ---------- Academy ----------
create table if not exists public.academy_programs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  kind text default 'Workshop',    -- Workshop | Masterclass | Course | Mentoring
  short_description text,
  description text,
  cover_image text,
  start_date date,
  duration text,                   -- "1 day", "6 weeks"
  location text,                   -- "Online", "Banjul", "London"
  price text,                      -- "Free", "£49"
  capacity int,
  outcomes text[] default '{}',
  sort_order int default 0,
  published boolean default true,
  created_at timestamptz not null default now()
);

create table if not exists public.academy_enrollments (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references public.academy_programs(id) on delete set null,
  program_title text,
  full_name text not null,
  email text not null,
  phone text,
  country text,
  message text,
  status text not null default 'new', -- new | contacted | confirmed | cancelled
  created_at timestamptz not null default now()
);

-- ---------- Consultation bookings ----------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  topic text,                      -- service / product the enquiry is about
  preferred_date date,
  preferred_time text,
  contact_method text,             -- WhatsApp | Phone | Email | Video call
  message text,
  status text not null default 'new', -- new | contacted | booked | closed
  created_at timestamptz not null default now()
);

-- ---------- FAQs ----------
create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order int default 0,
  published boolean default true,
  created_at timestamptz not null default now()
);

-- =============================================================
-- Row Level Security
-- =============================================================
alter table public.admins              enable row level security;
alter table public.site_settings       enable row level security;
alter table public.products            enable row level security;
alter table public.services            enable row level security;
alter table public.academy_programs    enable row level security;
alter table public.academy_enrollments enable row level security;
alter table public.bookings            enable row level security;
alter table public.faqs                enable row level security;

-- helper to (re)create policies idempotently
do $$
declare t text;
begin
  -- public content: anyone reads published rows, admins do everything
  foreach t in array array['products','services','academy_programs','faqs'] loop
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select using (published or public.is_admin())', t);
    execute format('drop policy if exists "admin write" on public.%I', t);
    execute format('create policy "admin write" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;

  -- submissions: anyone can insert, only admins read/update/delete
  foreach t in array array['bookings','academy_enrollments'] loop
    execute format('drop policy if exists "public insert" on public.%I', t);
    execute format('create policy "public insert" on public.%I for insert with check (status = ''new'')', t);
    execute format('drop policy if exists "admin all" on public.%I', t);
    execute format('create policy "admin all" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

drop policy if exists "public read" on public.site_settings;
create policy "public read" on public.site_settings for select using (true);
drop policy if exists "admin write" on public.site_settings;
create policy "admin write" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "self read" on public.admins;
create policy "self read" on public.admins for select using (user_id = auth.uid());

-- =============================================================
-- Storage bucket for uploaded images
-- =============================================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects for select using (bucket_id = 'media');
drop policy if exists "media admin insert" on storage.objects;
create policy "media admin insert" on storage.objects for insert with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "media admin update" on storage.objects;
create policy "media admin update" on storage.objects for update using (bucket_id = 'media' and public.is_admin());
drop policy if exists "media admin delete" on storage.objects;
create policy "media admin delete" on storage.objects for delete using (bucket_id = 'media' and public.is_admin());

-- =============================================================
-- Seed content (matches the design). Edit later from /admin.
-- =============================================================
insert into public.site_settings (id, data) values (1, '{
  "phone": "+44 7533 780033",
  "whatsapp": "447533780033",
  "email": "hello@drbady.com",
  "location": "UK & The Gambia",
  "hero_title_1": "One Creative Mind.",
  "hero_title_2": "Multiple Solutions.",
  "hero_subtitle": "Digital products, business services and training that solve real problems, create opportunities and help people and businesses grow in the UK, The Gambia and beyond.",
  "mobile_hero_title_1": "From Ideas to Real-World",
  "mobile_hero_title_2": "Solutions.",
  "mobile_hero_subtitle": "Digital products, business services, branding and training for individuals, businesses and communities.",
  "hero_image": "/branding/illustrative_founder.png",
  "cta_title": "Let''s Build Something Together.",
  "cta_subtitle": "Have an idea, project or business challenge? Let''s talk and turn it into a plan.",
  "about_title": "About Dr Bady",
  "about_text": "Dr Bady is a creative entrepreneur building digital products, brands and businesses across the UK and The Gambia.\n\nFrom car marketplaces to venue security reporting, from brand identities to hands-on masterclasses, the goal is always the same: turn ideas into real-world solutions that help people and communities grow.",
  "about_image": "/branding/illustrative_founder.png"
}'::jsonb)
on conflict (id) do nothing;

insert into public.products (slug, title, short_description, tagline, cover_image, icon, accent, features, links, cta_label, cta_icon, cta_url, sort_order) values
('motor-gambia', 'Motor Gambia', 'Buy, sell, rent and export cars in The Gambia.', 'The Gambia''s biggest car marketplace.', '/images/motor_gambia.png', 'Car', '#E5322D', '{}',
 '[{"label":"Buy a Car","icon":"Tag","url":"https://motorgambia.com"},{"label":"Sell Your Car (Keep 100%)","icon":"CirclePlus","url":"https://motorgambia.com"},{"label":"Rent a Car","icon":"Car","url":"https://motorgambia.com"},{"label":"Export from the UK","icon":"Ship","url":"https://motorgambia.com"},{"label":"Car Servicing","icon":"Wrench","url":"https://motorgambia.com"}]',
 'Visit MotorGambia.com', 'ExternalLink', 'https://motorgambia.com', 1),
('security-reports', 'Security Reports', 'Incident & door refusal reporting for venues.', 'Incident & door refusal reporting for venues and events.', '/images/security_reports.png', 'ShieldCheck', '#1E73E8',
 '{"Fast, consistent reports","Capture photos and evidence","Live dashboard and insights","Supports licensing & compliance"}', '[]',
 'View Live Demo', 'ExternalLink', '#', 2),
('creative-mindset', 'Creative Mindset', 'Masterclasses to build skills, brands and businesses.', 'Workshops and masterclasses to build your skills, brand and business.', '/images/creative_mindset.png', 'GraduationCap', '#F5A300',
 '{"Spot opportunities","Build and brand your idea","Design and promote","7-day action planning"}', '[]',
 'Join a Workshop', 'CalendarDays', '/academy', 3),
('business-showroom', 'Business Showroom', 'Ready-made websites, brand setups and business ideas.', 'Ready-made websites, brand setups and business ideas you can launch fast.', '/images/creative_workspace.png', 'Store', '#8B2BE2',
 '{"Ready-made websites","Complete brand setups","Proven business ideas","Launch support"}', '[]',
 'Browse the Showroom', 'ExternalLink', '#', 4)
on conflict (slug) do nothing;

insert into public.services (slug, title, short_title, short_description, icon, features, sort_order) values
('web-app-development', 'Web & App Development', 'Web Development', 'Websites, apps and MVPs.', 'Laptop', '{"Business websites","Web & mobile apps","MVPs for startups","Hosting & maintenance"}', 1),
('branding-design', 'Branding & Design', 'Branding & Design', 'Logos, visuals and brand kits.', 'Palette', '{"Logo design","Brand identity kits","Social media visuals","Packaging & signage"}', 2),
('printing-merchandise', 'Printing & Merchandise', 'Printing & Merchandise', 'T-shirts, flyers, banners and more.', 'Printer', '{"Branded clothing","Flyers & posters","Banners & roll-ups","Business cards"}', 3),
('marketing-promotion', 'Marketing & Promotion', 'Marketing & Promotion', 'Campaigns, content and growth.', 'Megaphone', '{"Social media campaigns","Content creation","Paid ads","Launch promotion"}', 4),
('business-consulting', 'Business Consulting', 'Business Consulting', 'Ideas, planning and setup support.', 'BriefcaseBusiness', '{"Idea validation","Business planning","Company setup","Growth strategy"}', 5),
('training-workshops', 'Training & Workshops', 'Training & Workshops', 'Hands-on sessions for teams and communities.', 'UsersRound', '{"Masterclasses","Team training","Community workshops","1-to-1 mentoring"}', 6)
on conflict (slug) do nothing;

insert into public.academy_programs (slug, title, kind, short_description, cover_image, duration, location, price, outcomes, sort_order) values
('creative-mindset-masterclass', 'Creative Mindset Masterclass', 'Masterclass', 'Spot opportunities, build and brand your idea, and leave with a 7-day action plan.', '/images/creative_mindset.png', '1 day', 'Online & in person', 'Free', '{"Spot opportunities","Build and brand your idea","Design and promote","7-day action planning"}', 1),
('brand-your-business', 'Brand Your Business', 'Workshop', 'Hands-on workshop to create a logo, colours and a simple brand kit for your business.', '/images/creative_workspace.png', 'Half day', 'Online', '£29', '{"Logo & colour basics","Brand kit you can use","Social media templates"}', 2)
on conflict (slug) do nothing;

insert into public.faqs (question, answer, sort_order)
select * from (values
  ('How do I book a chat?', 'Use the Book a Chat button or message on WhatsApp. Pick a topic and a time that suits you and we will confirm.', 1),
  ('Do you work with clients outside the UK?', 'Yes. Most work is delivered remotely across the UK, The Gambia and beyond.', 2),
  ('How much does a website cost?', 'It depends on what you need. Book a free chat and you will get a clear quote and plan.', 3)
) v(q, a, s)
where not exists (select 1 from public.faqs);

-- =============================================================
-- LAST STEP (manual): make yourself an admin.
-- 1. Authentication → Users → "Add user" (email + password).
-- 2. Run:  insert into public.admins (user_id)
--          select id from auth.users where email = 'you@example.com';
-- =============================================================
