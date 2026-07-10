-- MyVault — schema Supabase
-- Colar integralmente no SQL Editor do projeto e executar uma vez.

-- ─────────────────────────────────────────────────────────────
-- Tabelas
-- ─────────────────────────────────────────────────────────────

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  -- Nome de ícone lucide em kebab-case (ex.: 'shopping-cart')
  icon text not null default 'tag',
  type text not null check (type in ('expense', 'income')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type text not null check (type in ('expense', 'income')),
  amount_cents int not null check (amount_cents > 0),
  description text not null check (char_length(description) between 1 and 200),
  category_id uuid references public.categories (id) on delete set null,
  date date not null,
  source text not null default 'manual' check (source in ('manual', 'wallet')),
  -- 'pending' = veio do Atalho da Wallet e aguarda confirmação na app
  status text not null default 'confirmed' check (status in ('confirmed', 'pending')),
  created_at timestamptz not null default now()
);

create table public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  person text,
  direction text not null check (direction in ('owe', 'owed')),
  total_cents int not null check (total_cents > 0),
  due_date date,
  created_at timestamptz not null default now()
);

create table public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  debt_id uuid not null references public.debts (id) on delete cascade,
  amount_cents int not null check (amount_cents > 0),
  date date not null default current_date
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  target_cents int not null check (target_cents > 0),
  deadline date,
  created_at timestamptz not null default now()
);

create table public.goal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  goal_id uuid not null references public.goals (id) on delete cascade,
  -- positivo = guardar na meta; negativo = retirar da meta
  amount_cents int not null check (amount_cents <> 0),
  date date not null default current_date
);

-- Token secreto que autoriza o Atalho da Wallet a inserir despesas pendentes.
create table public.wallet_tokens (
  token uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index transactions_user_date_idx on public.transactions (user_id, date desc);
create index transactions_user_status_idx on public.transactions (user_id, status);
create index debt_payments_debt_idx on public.debt_payments (debt_id);
create index goal_entries_goal_idx on public.goal_entries (goal_id);

-- ─────────────────────────────────────────────────────────────
-- RLS: cada utilizador só vê e altera as suas próprias linhas
-- ─────────────────────────────────────────────────────────────

alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.debts enable row level security;
alter table public.debt_payments enable row level security;
alter table public.goals enable row level security;
alter table public.goal_entries enable row level security;
alter table public.wallet_tokens enable row level security;

do $$
declare t text;
begin
  foreach t in array array['categories','transactions','debts','debt_payments','goals','goal_entries','wallet_tokens'] loop
    execute format($f$
      create policy "own rows select" on public.%I for select to authenticated
        using (user_id = (select auth.uid()));
      create policy "own rows insert" on public.%I for insert to authenticated
        with check (user_id = (select auth.uid()));
      create policy "own rows update" on public.%I for update to authenticated
        using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
      create policy "own rows delete" on public.%I for delete to authenticated
        using (user_id = (select auth.uid()));
    $f$, t, t, t, t);
  end loop;
end $$;

-- Sem acesso anónimo às tabelas (o anon só pode chamar a função wallet_add).
revoke all on all tables in schema public from anon;

-- ─────────────────────────────────────────────────────────────
-- Categorias por omissão para cada novo utilizador
-- ─────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.categories (user_id, name, icon, type, sort_order) values
    (new.id, 'Supermercado', 'shopping-cart', 'expense', 0),
    (new.id, 'Restauração', 'utensils', 'expense', 1),
    (new.id, 'Transportes', 'car', 'expense', 2),
    (new.id, 'Casa', 'house', 'expense', 3),
    (new.id, 'Contas', 'lightbulb', 'expense', 4),
    (new.id, 'Subscrições', 'smartphone', 'expense', 5),
    (new.id, 'Lazer', 'party-popper', 'expense', 6),
    (new.id, 'Saúde', 'stethoscope', 'expense', 7),
    (new.id, 'Compras', 'shirt', 'expense', 8),
    (new.id, 'Outros', 'package', 'expense', 9),
    (new.id, 'Salário', 'briefcase', 'income', 0),
    (new.id, 'Freelance', 'laptop', 'income', 1),
    (new.id, 'Presentes', 'gift', 'income', 2),
    (new.id, 'Investimentos', 'trending-up', 'income', 3),
    (new.id, 'Outros', 'package', 'income', 4);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- RPC para o Atalho da Wallet (chamada com a anon key + token secreto)
-- Insere uma despesa 'pending' para o dono do token, em background.
-- ─────────────────────────────────────────────────────────────

-- Os nomes dos parâmetros têm de coincidir com os campos do JSON enviado
-- pelo Atalho: {"token": …, "amount": …, "merchant": …}.
create or replace function public.wallet_add(token uuid, amount text, merchant text)
returns text
language plpgsql
security definer set search_path = ''
as $$
declare
  v_user uuid;
  v_clean text;
  v_cents int;
begin
  select t.user_id into v_user
  from public.wallet_tokens t
  where t.token = wallet_add.token;
  if v_user is null then
    raise exception 'token inválido';
  end if;

  -- "12,50 €" / "1 234.56" → cêntimos (o separador mais à direita é o decimal)
  v_clean := regexp_replace(coalesce(amount, ''), '[^0-9.,]', '', 'g');
  v_clean := replace(v_clean, ',', '.');
  if v_clean ~ '\..*\.' then
    v_clean := regexp_replace(v_clean, '\.(?=.*\.)', '', 'g');
  end if;
  if v_clean = '' or v_clean !~ '^[0-9]*\.?[0-9]+$' then
    raise exception 'valor inválido: %', amount;
  end if;
  v_cents := round(v_clean::numeric * 100)::int;
  if v_cents <= 0 then
    raise exception 'valor inválido: %', amount;
  end if;

  insert into public.transactions (user_id, type, amount_cents, description, date, source, status)
  values (v_user, 'expense', v_cents, coalesce(nullif(trim(merchant), ''), 'Pagamento Wallet'), current_date, 'wallet', 'pending');

  return 'ok';
end;
$$;

-- Só o anon (o Atalho) e o próprio utilizador podem chamar a função.
revoke execute on function public.wallet_add(uuid, text, text) from public;
grant execute on function public.wallet_add(uuid, text, text) to anon, authenticated;
