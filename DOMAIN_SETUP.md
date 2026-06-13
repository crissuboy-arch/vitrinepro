# Configurar vitrinepro.com no Vercel

> Os URLs públicos do catálogo usam `process.env.NEXT_PUBLIC_APP_URL`
> (fallback: `https://vitrinepro.com`). Define essa variável no Vercel para o
> domínio aparecer correto em todo o lado (catálogo, sitemap, robots, vitrine).

## Passo 0 — Definir a variável de ambiente no Vercel
1. Vercel → projecto VitrinePro → **Settings → Environment Variables**
2. Add: **`NEXT_PUBLIC_APP_URL`** = `https://vitrinepro.com`
3. Aplica a **Production** (e Preview se quiseres testar com o domínio)
4. **Redeploy** para a variável entrar no build (variáveis `NEXT_PUBLIC_*` são
   inseridas no momento do build).

## Passo 1 — Adicionar domínio no Vercel
1. Abre https://vercel.com/dashboard
2. Clica no projecto VitrinePro
3. Settings → Domains
4. Clica "Add Domain"
5. Escreve: `vitrinepro.com`
6. Clica "Add"
7. O Vercel mostra os registos DNS necessários

## Passo 2 — Configurar DNS no registo do domínio
No painel onde compraste o domínio `vitrinepro.com`, adiciona estes registos:

**Tipo A:**
- Name: `@`
- Value: `76.76.21.21`
- TTL: `3600`

**Tipo CNAME:**
- Name: `www`
- Value: `cname.vercel-dns.com`
- TTL: `3600`

## Passo 3 — Aguardar propagação
A propagação DNS demora entre 5 minutos e 48 horas.
Verifica em: https://dnschecker.org/#A/vitrinepro.com

## Passo 4 — Confirmar SSL
O Vercel gera o certificado SSL automaticamente.
Após a propagação, `https://vitrinepro.com` deve abrir a aplicação.

## Enquanto o domínio não propaga
O catálogo está acessível no URL de preview/produção da Vercel:

```
https://[nome-do-projecto].vercel.app/catalogo/[slug]
```

Exemplo (preview atual):
```
https://vitrinepro-git-fix-catalog-pdf-image-crissuboy-9102s-projects.vercel.app/catalogo/cantinho-da-lu-d6fd14
```
