-- FlightFinder: schema inicial.
-- RLS habilitado e SEM policies públicas: nenhum acesso via anon key. Toda
-- leitura/escrita passa por API routes server-side usando a service role
-- (que ignora RLS). Assim o frontend nunca escreve direto em tabelas sensíveis.

create extension if not exists "pgcrypto";

create table if not exists public.searches (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  mode text not null default 'normal',
  origin text,
  destination text,
  departure_date date,
  return_date date,
  flexibility_days int default 0,
  passengers int default 1,
  baggage text,
  accepts_alternative_airports boolean default false,
  accepts_split_ticket boolean default false,
  accepts_multimodal boolean default false,
  accepts_aggressive_routes boolean default false,
  raw_request jsonb
);

create table if not exists public.search_results (
  id uuid primary key default gen_random_uuid(),
  search_id uuid references public.searches(id) on delete cascade,
  created_at timestamptz not null default now(),
  rank int,
  title text,
  route_summary text,
  total_price_brl numeric,
  original_price numeric,
  original_currency text,
  deal_score numeric,
  confidence_score text,
  risk_level text,
  sources_used jsonb,
  warnings jsonb,
  raw_payload jsonb
);

create table if not exists public.lucky_deals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  headline text,
  origin text,
  destination text,
  start_date date,
  end_date date,
  total_price_brl numeric,
  typical_price_brl numeric,
  percent_below_typical numeric,
  deal_score numeric,
  urgency text,
  confidence_score text,
  sources_used jsonb,
  caveats jsonb,
  raw_payload jsonb
);

create table if not exists public.eval_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  eval_name text,
  status text,
  duration_ms int,
  sources_called jsonb,
  errors jsonb,
  consolidated_result jsonb,
  raw_payload jsonb
);

create table if not exists public.source_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source_name text,
  endpoint_or_adapter text,
  status text,
  duration_ms int,
  error_message text,
  metadata jsonb
);

create table if not exists public.user_preferences (
  id text primary key default 'default',
  updated_at timestamptz not null default now(),
  origin_airports jsonb,
  passport text default 'Brazil',
  currency text default 'BRL',
  risk_tolerance text,
  baggage text,
  accepts_alternative_airports boolean,
  accepts_split_ticket boolean,
  accepts_multimodal boolean,
  has_miles boolean,
  mile_value_per_thousand numeric,
  raw jsonb
);

create index if not exists idx_search_results_search on public.search_results(search_id);
create index if not exists idx_searches_created on public.searches(created_at desc);
create index if not exists idx_lucky_created on public.lucky_deals(created_at desc);

alter table public.searches enable row level security;
alter table public.search_results enable row level security;
alter table public.lucky_deals enable row level security;
alter table public.eval_runs enable row level security;
alter table public.source_logs enable row level security;
alter table public.user_preferences enable row level security;
