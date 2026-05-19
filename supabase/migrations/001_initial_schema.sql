create extension if not exists "pgcrypto";

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text,
  theme jsonb,
  groom jsonb,
  bride jsonb,
  greeting jsonb,
  wedding_date date,
  wedding_time text,
  venue jsonb,
  transportation jsonb,
  menu_order jsonb,
  settings jsonb,
  kakao_thumbnail_url text,
  url_thumbnail_url text,
  main_image_url text,
  is_published boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.invitation_images (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references public.invitations(id) on delete cascade,
  type text,
  url text,
  sort_order integer,
  caption text,
  created_at timestamp with time zone default now()
);

create table if not exists public.invitation_audio (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references public.invitations(id) on delete cascade,
  type text,
  url text,
  youtube_url text,
  title text,
  autoplay boolean,
  created_at timestamp with time zone default now()
);

create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references public.invitations(id) on delete cascade,
  side text,
  group_name text,
  bank_name text,
  account_number text,
  account_holder text,
  kakao_pay_enabled boolean default false,
  hidden boolean default false,
  sort_order integer
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references public.invitations(id) on delete cascade,
  role text,
  name text,
  phone text,
  sort_order integer
);

create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references public.invitations(id) on delete cascade,
  guest_name text,
  phone_last4 text,
  attending boolean,
  meal boolean,
  companions integer,
  message text,
  created_at timestamp with time zone default now()
);

create table if not exists public.guestbook (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references public.invitations(id) on delete cascade,
  guest_name text,
  message text,
  password_hash text,
  created_at timestamp with time zone default now()
);

insert into storage.buckets (id, name, public)
values ('invitation-images', 'invitation-images', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('invitation-audio', 'invitation-audio', true)
on conflict (id) do update set public = true;
