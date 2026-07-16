# Financeira

Aplicativo de controle de vendas, comissoes, despesas, caixa da firma e giro de capital.

## Desenvolvimento local

```powershell
node server.js
```

Acesse `http://127.0.0.1:8765/`.

## Publicacao

O projeto esta preparado para hospedagem estatica no Vercel. Antes de disponibilizar para usuarios reais, a autenticacao e os dados financeiros devem ser migrados do navegador para um backend com banco de dados, controle de acesso e senhas armazenadas com hash.

