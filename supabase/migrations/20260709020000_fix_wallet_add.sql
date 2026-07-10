-- Correção: renomear os parâmetros de wallet_add para coincidirem com o JSON
-- do Atalho ({"token", "amount", "merchant"}). Colar no SQL Editor e executar.

drop function if exists public.wallet_add(uuid, text, text);

create function public.wallet_add(token uuid, amount text, merchant text)
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

revoke execute on function public.wallet_add(uuid, text, text) from public;
grant execute on function public.wallet_add(uuid, text, text) to anon, authenticated;
