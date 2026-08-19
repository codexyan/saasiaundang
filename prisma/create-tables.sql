-- iaundang — Create Tables
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query → paste → Run

-- USERS
create table if not exists users (
  id            text primary key,
  email         text not null unique,
  password_hash text not null,
  role          text not null default 'user',
  created_at    timestamptz not null default now()
);

-- INVITATIONS
create table if not exists invitations (
  id           text primary key,
  user_id      text not null references users(id) on delete cascade,
  slug         text not null unique,
  template_id  text not null,
  data         jsonb not null default '{}',
  package_tier text,
  is_published boolean not null default false,
  is_paid      boolean not null default false,
  expires_at   timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists idx_invitations_user_id on invitations(user_id);

-- GALLERIES
create table if not exists galleries (
  id            text primary key,
  invitation_id text not null references invitations(id) on delete cascade,
  url           text not null,
  "order"       int  not null default 0
);
create index if not exists idx_galleries_invitation_id on galleries(invitation_id);

-- GUESTS
create table if not exists guests (
  id            text primary key,
  invitation_id text not null references invitations(id) on delete cascade,
  name          text not null,
  attending     boolean not null default false,
  total_guests  int not null default 1,
  created_at    timestamptz not null default now()
);
create index if not exists idx_guests_invitation_id on guests(invitation_id);

-- WISHES
create table if not exists wishes (
  id            text primary key,
  invitation_id text not null references invitations(id) on delete cascade,
  name          text not null,
  message       text not null,
  created_at    timestamptz not null default now()
);
create index if not exists idx_wishes_invitation_id on wishes(invitation_id);

-- TEMPLATE RECORDS
create table if not exists template_records (
  id               text primary key,
  name             text not null,
  slug             text not null unique,
  category         text not null,
  config           jsonb not null default '{}',
  thumbnail_url    text not null default '',
  status           text not null default 'draft',
  sort_order       int  not null default 0,
  usage_count      int  not null default 0,
  price            int  not null default 0,
  required_package text not null default 'all',
  created_at       timestamptz not null default now()
);

-- PAYMENT PROOFS

-- APP SETTINGS (satu row, key = 'main')
create table if not exists app_settings (
  key        text primary key,
  value      jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
