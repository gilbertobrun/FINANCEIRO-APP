-- ETAPA 3 - Fechar acesso anonimo ao estado financeiro
-- Execute somente depois de confirmar que o login online esta funcionando.
-- Nao apaga dados. Apenas troca as politicas RLS da tabela principal.

alter table financeiro_app_state enable row level security;

create or replace function is_app_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_profiles
    where user_id = auth.uid()
      and (
        role in ('socio_adm', 'socio_mm', 'admin')
        or 'admin' = any(permissions)
      )
  );
$$;

create or replace function can_manage_payments()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_profiles
    where user_id = auth.uid()
      and (
        'payments' = any(permissions)
        or role in ('socio_adm', 'socio_mm', 'financeiro', 'admin')
      )
  );
$$;

drop policy if exists "authenticated_read_financeiro_state" on financeiro_app_state;
drop policy if exists "authenticated_write_financeiro_state" on financeiro_app_state;
drop policy if exists "authenticated_update_financeiro_state" on financeiro_app_state;
drop policy if exists "app_read_financeiro_state" on financeiro_app_state;
drop policy if exists "app_insert_financeiro_state" on financeiro_app_state;
drop policy if exists "app_update_financeiro_state" on financeiro_app_state;

-- Todos os usuarios logados podem visualizar o app.
-- Exemplo: universo, mm e wg.
create policy "app_read_financeiro_state_auth"
on financeiro_app_state
for select
to authenticated
using (id = 'main');

-- Somente usuarios com permissao financeira podem criar o registro principal.
-- Na pratica isso fica restrito aos socios/admin e usuarios com permissao payments.
create policy "app_insert_financeiro_state_admin"
on financeiro_app_state
for insert
to authenticated
with check (
  id = 'main'
  and (is_app_admin() or can_manage_payments())
);

-- Somente socios/admin e financeiro autorizado podem alterar valores.
-- Usuario WG visualizador nao consegue alterar pelo banco.
create policy "app_update_financeiro_state_admin"
on financeiro_app_state
for update
to authenticated
using (
  id = 'main'
  and (is_app_admin() or can_manage_payments())
)
with check (
  id = 'main'
  and (is_app_admin() or can_manage_payments())
);
