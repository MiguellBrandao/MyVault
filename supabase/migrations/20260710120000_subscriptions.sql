-- Subscrições: despesas/ganhos recorrentes registados automaticamente
-- no servidor por um job diário (pg_cron), sem depender de abrir a app.

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type text not null check (type in ('expense', 'income')),
  name text not null check (char_length(name) between 1 and 120),
  amount_cents int not null check (amount_cents > 0),
  category_id uuid references public.categories (id) on delete set null,
  frequency text not null check (frequency in ('weekly', 'monthly', 'yearly')),
  -- weekly: 0=domingo … 6=sábado
  day_of_week int check (day_of_week between 0 and 6),
  -- monthly/yearly: dia do mês (em meses curtos ajusta para o último dia)
  day_of_month int check (day_of_month between 1 and 31),
  -- yearly: mês da cobrança
  month_of_year int check (month_of_year between 1 and 12),
  -- Próxima cobrança; avança a cada geração.
  next_date date not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index subscriptions_due_idx on public.subscriptions (next_date) where active;

alter table public.subscriptions enable row level security;

create policy "own rows select" on public.subscriptions for select to authenticated
  using (user_id = (select auth.uid()));
create policy "own rows insert" on public.subscriptions for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "own rows update" on public.subscriptions for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows delete" on public.subscriptions for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.subscriptions from anon;

-- Movimentos gerados ficam ligados à subscrição e marcados como tal.
alter table public.transactions
  add column subscription_id uuid references public.subscriptions (id) on delete set null;

alter table public.transactions drop constraint transactions_source_check;
alter table public.transactions
  add constraint transactions_source_check check (source in ('manual', 'wallet', 'subscription'));

-- Próxima data de cobrança a partir de uma cobrança em from_date.
create or replace function public.subscription_next_date(
  freq text, dow int, dom int, moy int, from_date date
)
returns date
language plpgsql
immutable
as $$
declare
  base date;
  days_in_month int;
  y int;
begin
  if freq = 'weekly' then
    return from_date + 7;
  elsif freq = 'monthly' then
    base := (date_trunc('month', from_date) + interval '1 month')::date;
    days_in_month := extract(day from (base + interval '1 month' - interval '1 day'))::int;
    return make_date(
      extract(year from base)::int,
      extract(month from base)::int,
      least(coalesce(dom, 1), days_in_month)
    );
  else
    y := extract(year from from_date)::int + 1;
    days_in_month := extract(day from (make_date(y, coalesce(moy, 1), 1) + interval '1 month' - interval '1 day'))::int;
    return make_date(y, coalesce(moy, 1), least(coalesce(dom, 1), days_in_month));
  end if;
end;
$$;

-- Regista as cobranças devidas (com catch-up de dias perdidos) e avança next_date.
create or replace function public.process_subscriptions()
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  s record;
  v_next date;
begin
  for s in
    select * from public.subscriptions
    where active and next_date <= current_date
  loop
    v_next := s.next_date;
    while v_next <= current_date loop
      insert into public.transactions
        (user_id, type, amount_cents, description, category_id, date, source, status, subscription_id)
      values
        (s.user_id, s.type, s.amount_cents, s.name, s.category_id, v_next, 'subscription', 'confirmed', s.id);
      v_next := public.subscription_next_date(s.frequency, s.day_of_week, s.day_of_month, s.month_of_year, v_next);
    end loop;
    update public.subscriptions set next_date = v_next where id = s.id;
  end loop;
end;
$$;

revoke execute on function public.process_subscriptions() from public, anon, authenticated;

-- Job diário às 06:00 UTC.
create extension if not exists pg_cron;
select cron.schedule('process-subscriptions', '0 6 * * *', 'select public.process_subscriptions()');
