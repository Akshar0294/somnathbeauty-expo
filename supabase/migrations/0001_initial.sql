create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  short_description text not null default '',
  full_description text not null default '',
  event_image text,
  gallery_images jsonb not null default '[]'::jsonb,
  venue text not null default '',
  address text not null default '',
  city text not null default '',
  state text not null default 'Gujarat',
  country text not null default 'India',
  start_date date not null,
  end_date date not null,
  start_time time,
  end_time time,
  registration_price integer not null default 100 check (registration_price >= 0),
  maximum_capacity integer not null default 500 check (maximum_capacity >= 0),
  available_slots integer not null default 500 check (available_slots >= 0),
  registration_open boolean not null default false,
  registration_deadline timestamptz,
  status text not null default 'OPEN' check (status in ('OPEN', 'LIVE', 'COMPLETED', 'CLOSED')),
  sponsor_name text,
  sponsor_logo text,
  sponsor_website text,
  terms_and_conditions text not null default 'Please carry a valid photo ID to the expo.',
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  registration_id text not null unique,
  event_id uuid not null references public.events(id) on delete restrict,
  visitor_name text not null,
  phone text not null,
  email text,
  city text not null,
  gender text not null default 'Female' check (gender = 'Female'),
  payment_status text not null default 'PENDING' check (payment_status in ('PENDING', 'PAID', 'FAILED', 'CANCELLED')),
  registration_status text not null default 'PENDING' check (registration_status in ('PENDING', 'CONFIRMED', 'CANCELLED')),
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature_verified boolean not null default false,
  amount integer not null check (amount >= 0),
  currency text not null default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, phone)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete restrict,
  razorpay_order_id text not null unique,
  razorpay_payment_id text,
  amount integer not null check (amount >= 0),
  currency text not null default 'INR',
  status text not null default 'PENDING' check (status in ('PENDING', 'PAID', 'FAILED', 'CANCELLED')),
  signature_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo text,
  website text,
  enabled boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null default '',
  email text not null default '',
  message text not null,
  status text not null default 'UNREAD' check (status in ('UNREAD', 'READ')),
  created_at timestamptz not null default now()
);

create table if not exists public.website_settings (
  id integer primary key default 1 check (id = 1),
  site_logo text,
  hero_heading text not null default 'Beauty. Quality. Wholesale.',
  hero_description text not null default 'Explore beauty expos, discover new opportunities, and register for upcoming events with Soft Shine Cosmetic.',
  hero_image text,
  about_text text not null default 'Soft Shine Cosmetic is a beauty and makeup products wholesale business dedicated to bringing quality beauty products to retailers, salons, makeup artists, beauty professionals, resellers, and businesses.',
  contact_numbers jsonb not null default jsonb_build_array(
    jsonb_build_object('name', 'Dhruvin Solanki', 'phone', '+91 63521 63885'),
    jsonb_build_object('name', 'Govind Solanki', 'phone', '+91 82004 64792')
  ),
  address text not null default 'Satabajar, Subhash Rd, SattaBazar, Veraval, Gujarat 362265',
  google_maps_url text not null default 'https://maps.app.goo.gl/feEfBZJc71QAEM4e9',
  footer_text text not null default 'Beauty & Makeup Products Wholesale',
  social_links jsonb not null default '{}'::jsonb,
  default_registration_price integer not null default 100,
  updated_at timestamptz not null default now()
);

insert into public.website_settings (id)
values (1)
on conflict (id) do nothing;

insert into public.events (
  event_name, short_description, full_description, venue, address, city, state, country,
  start_date, end_date, start_time, end_time, registration_price, maximum_capacity,
  available_slots, registration_open, status, terms_and_conditions, featured
)
select
  'Somnath Beauty Expo',
  'Beauty, cosmetics and professional makeup discoveries for the women shaping the industry.',
  'A focused beauty and cosmetics expo for retailers, salons, makeup artists, resellers and beauty professionals.',
  'Somnath Expo Hall',
  'Veraval, Gujarat',
  'Veraval',
  'Gujarat',
  'India',
  '2026-09-12',
  '2026-09-13',
  '10:00',
  '18:00',
  100,
  500,
  500,
  true,
  'OPEN',
  'These expos are exclusively for female visitors. Please carry a valid photo ID.',
  true
where not exists (select 1 from public.events where event_name = 'Somnath Beauty Expo');

create index if not exists events_active_idx on public.events (registration_open, start_date);
create index if not exists registrations_event_idx on public.registrations (event_id);
create index if not exists registrations_phone_idx on public.registrations (phone);
create index if not exists payments_registration_idx on public.payments (registration_id);
create index if not exists contact_messages_status_idx on public.contact_messages (status, created_at);

alter table public.events enable row level security;
alter table public.website_settings enable row level security;
alter table public.sponsors enable row level security;
alter table public.registrations enable row level security;
alter table public.payments enable row level security;
alter table public.contact_messages enable row level security;

drop policy if exists "Public can read open events" on public.events;
create policy "Public can read open events"
on public.events for select
using (registration_open = true);

drop policy if exists "Public can read site settings" on public.website_settings;
create policy "Public can read site settings"
on public.website_settings for select
using (true);

drop policy if exists "Public can read enabled sponsors" on public.sponsors;
create policy "Public can read enabled sponsors"
on public.sponsors for select
using (enabled = true);

insert into storage.buckets (id, name, public)
values ('public-assets', 'public-assets', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can read public assets" on storage.objects;
create policy "Public can read public assets"
on storage.objects for select
using (bucket_id = 'public-assets');

-- All writes to business tables and storage use the server-only service role
-- after admin authentication; the service role bypasses RLS.
