-- Migration: PROPOSTA — NÃO APLICAR sem revisão
-- A10.1D: vp_posts_select sem self-recursion
--
-- Usa diretamente as colunas da linha corrente (business_posts.*),
-- sem subquery em public.business_posts dentro da própria policy.

DROP POLICY IF EXISTS "vp_posts_select" ON public.business_posts;

CREATE POLICY "vp_posts_select" ON public.business_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = business_posts.business_id
        AND (
          -- OWNER: vê todos os próprios posts (inativos, futuros, expirados)
          b.user_id = auth.uid()
          OR (
            -- PÚBLICO: só negócio publicado + post ativo e vigente
            b.published = true
            AND business_posts.is_active = true
            AND (business_posts.starts_at IS NULL OR business_posts.starts_at <= now())
            AND (business_posts.expires_at IS NULL OR business_posts.expires_at > now())
          )
        )
    )
  );
