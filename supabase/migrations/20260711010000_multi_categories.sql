-- Multi-categorias em movimentos e subscrições + categoria de sistema «Subscrições».

-- ─────────────────────────────────────────────────────────────
-- 1. Categoria de sistema: «Subscrições» com ícone de loop,
--    indelével e com nome reservado.
-- ─────────────────────────────────────────────────────────────

alter table public.categories add column is_system boolean not null default false;

update public.categories
set icon = 'repeat', is_system = true
where lower(name) = 'subscrições' and type = 'expense';

-- Utilizadores que tenham apagado a categoria voltam a tê-la.
insert into public.categories (user_id, name, icon, type, sort_order, is_system)
select
  u.id, 'Subscrições', 'repeat', 'expense',
  coalesce((select max(c.sort_order) + 1 from public.categories c where c.user_id = u.id and c.type = 'expense'), 0),
  true
from auth.users u
where not exists (
  select from public.categories c where c.user_id = u.id and lower(c.name) = 'subscrições'
);

-- Sem nomes duplicados por tipo (inclui proteger o nome reservado).
create unique index categories_user_type_name_key
  on public.categories (user_id, type, lower(name));

-- RLS: a categoria de sistema não pode ser apagada nem alterada,
-- e não é possível criar categorias de sistema nem usar o nome reservado.
drop policy "own rows insert" on public.categories;
create policy "own rows insert" on public.categories for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and not is_system
    and lower(name) <> 'subscrições'
  );

drop policy "own rows update" on public.categories;
create policy "own rows update" on public.categories for update to authenticated
  using (user_id = (select auth.uid()) and not is_system)
  with check (user_id = (select auth.uid()) and not is_system);

drop policy "own rows delete" on public.categories;
create policy "own rows delete" on public.categories for delete to authenticated
  using (user_id = (select auth.uid()) and not is_system);

-- ─────────────────────────────────────────────────────────────
-- 2. Junções N:N (movimento↔categorias, subscrição↔categorias)
-- ─────────────────────────────────────────────────────────────

create table public.transaction_categories (
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  primary key (transaction_id, category_id)
);

create table public.subscription_categories (
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  primary key (subscription_id, category_id)
);

create index transaction_categories_category_idx on public.transaction_categories (category_id);
create index subscription_categories_category_idx on public.subscription_categories (category_id);

alter table public.transaction_categories enable row level security;
alter table public.subscription_categories enable row level security;

create policy "own rows select" on public.transaction_categories for select to authenticated
  using (user_id = (select auth.uid()));
create policy "own rows insert" on public.transaction_categories for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select from public.transactions t where t.id = transaction_id and t.user_id = (select auth.uid()))
    and exists (select from public.categories c where c.id = category_id and c.user_id = (select auth.uid()))
  );
create policy "own rows delete" on public.transaction_categories for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "own rows select" on public.subscription_categories for select to authenticated
  using (user_id = (select auth.uid()));
create policy "own rows insert" on public.subscription_categories for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select from public.subscriptions s where s.id = subscription_id and s.user_id = (select auth.uid()))
    and exists (select from public.categories c where c.id = category_id and c.user_id = (select auth.uid()))
  );
create policy "own rows delete" on public.subscription_categories for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.transaction_categories from anon;
revoke all on public.subscription_categories from anon;

-- ─────────────────────────────────────────────────────────────
-- 3. Backfill a partir das colunas antigas e remoção das mesmas
-- ─────────────────────────────────────────────────────────────

insert into public.transaction_categories (transaction_id, category_id, user_id)
select id, category_id, user_id from public.transactions where category_id is not null;

insert into public.subscription_categories (subscription_id, category_id, user_id)
select id, category_id, user_id from public.subscriptions where category_id is not null;

-- Todas as subscrições existentes ganham a categoria de sistema.
insert into public.subscription_categories (subscription_id, category_id, user_id)
select s.id, c.id, s.user_id
from public.subscriptions s
join public.categories c on c.user_id = s.user_id and c.is_system
on conflict do nothing;

alter table public.transactions drop column category_id;
alter table public.subscriptions drop column category_id;

-- ─────────────────────────────────────────────────────────────
-- 4. A geração automática copia as categorias da subscrição
-- ─────────────────────────────────────────────────────────────

create or replace function public.process_subscriptions()
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  s record;
  v_next date;
  v_tx uuid;
begin
  for s in
    select * from public.subscriptions
    where active and next_date <= current_date
  loop
    v_next := s.next_date;
    while v_next <= current_date loop
      insert into public.transactions
        (user_id, type, amount_cents, description, date, source, status, subscription_id)
      values
        (s.user_id, s.type, s.amount_cents, s.name, v_next, 'subscription', 'confirmed', s.id)
      returning id into v_tx;

      insert into public.transaction_categories (transaction_id, category_id, user_id)
      select v_tx, sc.category_id, s.user_id
      from public.subscription_categories sc
      where sc.subscription_id = s.id;

      v_next := public.subscription_next_date(s.frequency, s.day_of_week, s.day_of_month, s.month_of_year, v_next);
    end loop;
    update public.subscriptions set next_date = v_next where id = s.id;
  end loop;
end;
$$;

-- Novos utilizadores: «Subscrições» nasce como categoria de sistema.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.categories (user_id, name, icon, type, sort_order, is_system) values
    (new.id, 'Supermercado', 'shopping-cart', 'expense', 0, false),
    (new.id, 'Restauração', 'utensils', 'expense', 1, false),
    (new.id, 'Transportes', 'car', 'expense', 2, false),
    (new.id, 'Casa', 'house', 'expense', 3, false),
    (new.id, 'Contas', 'lightbulb', 'expense', 4, false),
    (new.id, 'Subscrições', 'repeat', 'expense', 5, true),
    (new.id, 'Lazer', 'party-popper', 'expense', 6, false),
    (new.id, 'Saúde', 'stethoscope', 'expense', 7, false),
    (new.id, 'Compras', 'shirt', 'expense', 8, false),
    (new.id, 'Outros', 'package', 'expense', 9, false),
    (new.id, 'Salário', 'briefcase', 'income', 0, false),
    (new.id, 'Freelance', 'laptop', 'income', 1, false),
    (new.id, 'Presentes', 'gift', 'income', 2, false),
    (new.id, 'Investimentos', 'trending-up', 'income', 3, false),
    (new.id, 'Outros', 'package', 'income', 4, false);
  return new;
end;
$$;
