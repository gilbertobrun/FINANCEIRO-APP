# Publicar Online

## 1. Supabase

1. Abra o projeto no Supabase.
2. Va em SQL Editor.
3. Cole e execute o conteudo de `supabase-schema.sql`.
4. Va em Project Settings > API.
5. Copie:
   - Project URL
   - anon public key

## 2. GitHub

1. Crie um repositorio novo.
2. Suba somente os arquivos desta pasta `app-financeiro-consignado`.
3. Nao suba `recovery-state.js`.

## 3. Vercel

1. Clique em Add New Project.
2. Importe o repositorio do GitHub.
3. Framework: Other.
4. Root directory: a pasta onde esta `index.html`.
5. Deploy.

## Observacao importante

Esta versao remove o carregamento automatico do arquivo de recuperacao local. Para sincronizar dados em nuvem, o proximo passo e ligar o app ao Supabase usando a URL e a anon key do seu projeto.
