# Guia de Migração para o Novo Supabase - VitrinePro

Siga estas instruções simples para configurar a estrutura de base de dados e armazenamento no seu novo projeto Supabase.

---

### Passo a Passo no Painel do Supabase

1. Vá ao **Supabase Dashboard** do seu novo projeto: `https://supabase.com/dashboard/project/seu-projeto`
2. No menu lateral esquerdo, clique em **SQL Editor** (ícone `SQL`).
3. Clique em **New query** para abrir uma nova aba de comandos.
4. Execute os ficheiros SQL na seguinte ordem:

#### 1. Rodar `schema.sql`
- Abra o ficheiro [supabase/schema.sql](file:///c:/Users/Evand/vitrinepro/supabase/schema.sql) no seu editor local.
- Copie todo o conteúdo.
- Cole no editor SQL do Supabase e clique em **Run**.

#### 2. Rodar `storage_setup.sql`
- Abra o ficheiro [supabase/storage_setup.sql](file:///c:/Users/Evand/vitrinepro/supabase/storage_setup.sql) local.
- Copie todo o conteúdo.
- Cole numa nova query no Supabase e clique em **Run**.

#### 3. Rodar `fix_rls_policies.sql`
- Abra o ficheiro [supabase/fix_rls_policies.sql](file:///c:/Users/Evand/vitrinepro/supabase/fix_rls_policies.sql) local.
- Copie todo o conteúdo.
- Cole no Supabase e clique em **Run**.

#### 4. Rodar `seed.sql`
- Abra o ficheiro [supabase/seed.sql](file:///c:/Users/Evand/vitrinepro/supabase/seed.sql) local.
- Copie todo o conteúdo.
- Cole no Supabase e clique em **Run**.

---

### Após a Execução dos Scripts

Forneça-me as credenciais do seu novo projeto:
- **`NEXT_PUBLIC_SUPABASE_URL`**
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
- **`SUPABASE_SERVICE_ROLE_KEY`** (se necessário para operações administrativas)

Vou atualizar o ficheiro `.env.local` automaticamente e iniciar o servidor local para validar o funcionamento do site (homepage, cidades, categorias, cadastro de negócios e carregamento de imagens).
