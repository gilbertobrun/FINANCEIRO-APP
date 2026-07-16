# Etapa 2 - Seguranca Supabase

Este app agora usa Supabase Auth como login principal.
As senhas antigas foram removidas do JavaScript do frontend.

## Ordem segura

1. No Supabase, abra Authentication > Users.
2. Crie os usuarios reais com e-mail/senha.
3. Rode o arquivo `supabase-schema.sql` no SQL Editor.
4. Preencha `app_profiles` ligando cada usuario Auth ao perfil correto.
5. Teste login/permissao em ambiente online.
6. Somente depois restrinja `financeiro_app_state` para usuarios autenticados.

## Como cadastrar perfil

Depois de criar cada usuario em Authentication, copie o `id` do usuario e rode um insert parecido:

```sql
insert into app_profiles (user_id, username, role, label, permissions)
values
  ('UUID_DO_USUARIO_UNIVERSO', 'universo', 'socio_adm', 'Socio ADM', array['admin','payments','view']),
  ('UUID_DO_USUARIO_MM', 'mm', 'socio_mm', 'Socio MM', array['admin','payments','view']),
  ('UUID_DO_USUARIO_FINANCEIRO', 'financeiro', 'financeiro', 'Financeiro', array['payments','view']),
  ('UUID_DO_USUARIO_WG', 'wg', 'visualizador', 'Visualizador', array['view','receipts'])
on conflict (user_id) do update set
  username = excluded.username,
  role = excluded.role,
  label = excluded.label,
  permissions = excluded.permissions,
  updated_at = now();
```

## Login nesta etapa

O app aceita:

- e-mail cadastrado em Authentication
- apelido curto que vira e-mail internamente: `universo`, `mm`, `wg`

Quando o usuario entra, o app autentica pelo Supabase Auth e busca o perfil na tabela `app_profiles`.
Se o e-mail existir mas nao tiver perfil, o acesso e bloqueado.

## Perfis

| Usuario | Role | Permissoes |
| --- | --- | --- |
| universo | socio_adm | admin, payments, view |
| mm | socio_mm | admin, payments, view |
| financeiro | financeiro | payments, view |
| wg | visualizador | view, receipts |

## Importante

Ainda nao feche a policy `financeiro_app_state` antes de testar a versao online com Auth.
Depois do teste online, a proxima etapa e restringir leitura/escrita para usuarios autenticados.
