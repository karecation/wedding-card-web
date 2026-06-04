create table if not exists public.purchase_sessions (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references public.invitations(id) on delete set null,
  slug text not null,
  status text not null default 'previewed'
    check (status in ('previewed', 'purchase_clicked', 'paid_pending_match', 'completed')),
  naver_product_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists purchase_sessions_invitation_id_idx
  on public.purchase_sessions(invitation_id);

create index if not exists purchase_sessions_slug_idx
  on public.purchase_sessions(slug);
