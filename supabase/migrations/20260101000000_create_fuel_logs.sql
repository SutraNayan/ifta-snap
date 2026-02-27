-- Gwinnett IFTA Snap-Audit
-- Migration: Create fuel_logs table
-- IFTA Requirement: Records must be retained for 4 years (2026 IFTA Procedures Manual)

create extension if not exists "uuid-ossp";

create table if not exists public.fuel_logs (
  id               uuid default uuid_generate_v4() primary key,
  truck_id         text not null,
  seller_name      text not null,
  seller_address   text not null default '',
  seller_city      text not null,
  seller_state     char(2) not null,            -- 2-letter state code for IFTA jurisdiction
  fuel_type        text not null check (fuel_type in ('Diesel', 'Gas', 'DEF', 'Other')),
  gallons          numeric(10, 3) not null check (gallons > 0),
  price_per_gallon numeric(10, 3) not null default 0,
  total_price      numeric(10, 2) not null default 0,
  receipt_date     date not null,
  image_url        text not null,               -- Supabase Storage public URL (primary evidence)
  extracted_json   jsonb not null,              -- Raw AI extraction output for audit trail
  created_at       timestamptz default now() not null
);

-- Indexes for common IFTA query patterns
create index idx_fuel_logs_truck_id      on public.fuel_logs (truck_id);
create index idx_fuel_logs_receipt_date  on public.fuel_logs (receipt_date);
create index idx_fuel_logs_seller_state  on public.fuel_logs (seller_state);
create index idx_fuel_logs_fuel_type     on public.fuel_logs (fuel_type);

-- Composite index for quarterly audit queries (state + date range + truck)
create index idx_fuel_logs_audit_query
  on public.fuel_logs (seller_state, receipt_date, truck_id);

comment on table public.fuel_logs is
  'IFTA fuel purchase records. Retained per 2026 IFTA Procedures Manual (4 years).';
comment on column public.fuel_logs.seller_state is
  'IFTA jurisdiction code. GA purchases trigger 37.3¢/gal tax calculation (Q1 2026).';
comment on column public.fuel_logs.gallons is
  '3-decimal precision required by IFTA Procedures Manual.';
comment on column public.fuel_logs.image_url is
  'Primary audit evidence. Must be accessible for 4 years.';
comment on column public.fuel_logs.extracted_json is
  'Full AI extraction payload stored for dispute resolution.';

-- Row Level Security
alter table public.fuel_logs enable row level security;

-- Policy: authenticated users can manage their own truck logs
create policy "Users can insert fuel logs"
  on public.fuel_logs for insert
  to authenticated
  with check (true);

create policy "Users can read fuel logs"
  on public.fuel_logs for select
  to authenticated
  using (true);

create policy "Users can update fuel logs"
  on public.fuel_logs for update
  to authenticated
  using (true);
