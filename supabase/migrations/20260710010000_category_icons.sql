-- Categorias passam de emoji para ícones (nomes lucide, kebab-case).

-- Rename com guarda: permite correr quer a coluna já tenha sido migrada quer não.
do $$
begin
  if exists (
    select from information_schema.columns
    where table_schema = 'public' and table_name = 'categories' and column_name = 'emoji'
  ) then
    alter table public.categories rename column emoji to icon;
  end if;
end $$;

alter table public.categories alter column icon set default 'tag';

-- Categorias iniciais de TODOS os utilizadores existentes → ícone adequado.
update public.categories c
set icon = m.icon
from (values
  ('Supermercado', 'shopping-cart'),
  ('Restauração', 'utensils'),
  ('Transportes', 'car'),
  ('Casa', 'house'),
  ('Contas', 'lightbulb'),
  ('Subscrições', 'smartphone'),
  ('Lazer', 'party-popper'),
  ('Saúde', 'stethoscope'),
  ('Compras', 'shirt'),
  ('Outros', 'package'),
  ('Salário', 'briefcase'),
  ('Freelance', 'laptop'),
  ('Presentes', 'gift'),
  ('Investimentos', 'trending-up')
) as m(name, icon)
where c.name = m.name;

-- Qualquer categoria personalizada que ainda tenha emoji → ícone genérico.
update public.categories set icon = 'tag' where icon !~ '^[a-z0-9-]+$';

-- Novos utilizadores nascem já com ícones.
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
