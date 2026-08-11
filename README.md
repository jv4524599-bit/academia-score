# Academia Score — Backend

Este é o projeto migrado do protótipo (arquivo HTML único) para uma
aplicação de verdade: **Next.js + Postgres (Supabase) + Prisma**.

## O que já está pronto

- ✅ Schema do banco de dados (`prisma/schema.prisma`) com todas as
  tabelas: academias, avaliações, leads, favoritos, formulário de parceria.
- ✅ Dados reais das 25 academias já cadastradas (`prisma/seed-data.json`)
  prontos para popular o banco.
- ✅ Todas as fotos e logos já extraídos do base64 e salvos como arquivos
  de verdade em `public/images/` (antes: ~5,6MB embutidos no código;
  agora: arquivos separados, carregam sob demanda).
- ✅ Página inicial (listagem) e perfil de cada academia, já buscando do
  banco de dados e com **URLs próprias e indexáveis pelo Google**
  (isso resolve o problema de SEO que a gente conversou).
- ✅ Formulário de avaliação funcionando de verdade (Server Action),
  incluindo a fila de moderação (toda avaliação nova entra como
  `PENDING` e só fica pública depois de aprovada).

## O que falta portar (próximos passos)

Ainda não portei do protótipo original (posso fazer a seguir, é só pedir):
- Sistema de avaliação por categoria completo (o form aqui está simplificado)
- Painel de administração (aprovar/rejeitar/excluir avaliações)
- Comparador de academias
- Perfil Premium de demonstração
- Página "Como funciona" e página da cidade
- Botão de favoritos

## Como colocar no ar

### 1. Criar o banco de dados (Supabase — gratuito)

1. Crie uma conta em [supabase.com](https://supabase.com) e um novo projeto.
2. Vá em **Project Settings → Database → Connection string** e copie a URL.
3. Copie `.env.example` para `.env` e cole a URL em `DATABASE_URL`.

### 2. Instalar e rodar localmente

```bash
npm install
npm run db:push      # cria as tabelas no banco a partir do schema
npm run db:seed      # popula com as 25 academias reais
npm run dev          # abre em http://localhost:3000
```

### 3. Subir pro GitHub

```bash
git init
git add .
git commit -m "Primeira versão do backend"
# crie um repositório no GitHub e depois:
git remote add origin <url-do-seu-repositorio>
git push -u origin main
```

### 4. Deploy (Vercel — gratuito)

1. Entre em [vercel.com](https://vercel.com), conecte sua conta do GitHub.
2. Importe o repositório.
3. Nas variáveis de ambiente do projeto na Vercel, adicione `DATABASE_URL`
   (a mesma do Supabase).
4. Deploy. Pronto, site no ar com domínio próprio da Vercel (e dá pra
   apontar um domínio comprado, tipo academiascore.com.br, depois).

## Estrutura de pastas

```
app/
  page.tsx                  → página inicial (listagem)
  academia/[slug]/page.tsx  → perfil de cada academia
  academia/[slug]/actions.ts→ lógica de salvar avaliação (server action)
lib/
  db.ts                     → conexão com o banco (Prisma)
prisma/
  schema.prisma             → estrutura do banco de dados
  seed.ts                   → script que popula o banco
  seed-data.json            → dados reais das 25 academias
public/images/               → fotos e logos reais (extraídos do protótipo)
```
