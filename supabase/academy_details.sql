-- =============================================================
-- Dr Bady — Academy detail pages (run AFTER schema.sql and blog_seo.sql)
-- Paste into Supabase → SQL Editor and run. Safe to re-run.
-- =============================================================

alter table public.academy_programs add column if not exists end_date date;
alter table public.academy_programs add column if not exists schedule text;            -- "Saturdays, 10:00–13:00 GMT"
alter table public.academy_programs add column if not exists instructor text;
alter table public.academy_programs add column if not exists level text;               -- Beginner | Intermediate | Advanced | All levels
alter table public.academy_programs add column if not exists content text;             -- Markdown: anything the admin wants
alter table public.academy_programs add column if not exists details jsonb default '[]'::jsonb;  -- [{icon,label,value}] custom key facts
alter table public.academy_programs add column if not exists requirements text[] default '{}';  -- "What you need"
alter table public.academy_programs add column if not exists faqs jsonb default '[]'::jsonb;     -- [{question,answer}]
alter table public.academy_programs add column if not exists cta_label text;           -- custom button text (default "Register")
alter table public.academy_programs add column if not exists meta_title text;
alter table public.academy_programs add column if not exists meta_description text;
alter table public.academy_programs add column if not exists og_image text;
alter table public.academy_programs add column if not exists noindex boolean default false;
alter table public.academy_programs add column if not exists updated_at timestamptz not null default now();

drop trigger if exists touch_updated_at on public.academy_programs;
create trigger touch_updated_at before update on public.academy_programs
  for each row execute function public.touch_updated_at();

-- Starter content for the seeded programmes (only fills empty fields).
update public.academy_programs set
  level = coalesce(level, 'All levels'),
  instructor = coalesce(instructor, 'Dr Bady'),
  content = coalesce(content, E'## About this masterclass\n\nA practical, hands-on day for anyone with an idea who wants to turn it into something real. You will learn how to **spot opportunities**, shape your idea, give it a brand and plan your first week of action.\n\n## Who it is for\n\n- People with an idea they have not started yet\n- Small business owners who want to grow\n- Students and young entrepreneurs\n\n## What happens after\n\nYou leave with a simple **7-day action plan** and support to take the next step. Questions? [Book a free chat](/book).'),
  details = case when details is null or details = '[]'::jsonb then '[{"icon":"Award","label":"Certificate","value":"Certificate of attendance"},{"icon":"UsersRound","label":"Group size","value":"Small groups"}]'::jsonb else details end,
  requirements = case when requirements is null or requirements = '{}' then '{"A notebook or laptop","Your idea (even a rough one)"}' else requirements end,
  faqs = case when faqs is null or faqs = '[]'::jsonb then '[{"question":"Do I need experience?","answer":"No. The masterclass is designed for complete beginners as well as people already running a business."},{"question":"Is it online or in person?","answer":"Both options are available. Choose the one that suits you when you register."}]'::jsonb else faqs end
where slug = 'creative-mindset-masterclass';

update public.academy_programs set
  level = coalesce(level, 'Beginner'),
  instructor = coalesce(instructor, 'Dr Bady'),
  content = coalesce(content, E'## About this workshop\n\nIn half a day you will create the essentials of a brand you can actually use: a simple logo, colours, fonts and social media templates.\n\n## What you get\n\n- A starter **brand kit** (logo files, colours and fonts)\n- Ready-to-use social media templates\n- Feedback on your brand from Dr Bady'),
  requirements = case when requirements is null or requirements = '{}' then '{"A laptop","Your business name"}' else requirements end
where slug = 'brand-your-business';
