/**
 * components/vitrine/PortalMontra.tsx — wrapper de servidor da montra
 * multiloja do Portal de Ofertas.
 *
 * Carrega a empresa (publicada), as definições da integração e o feed
 * do Portal no servidor; a interatividade (pesquisa/categorias) vive
 * em PortalMontraClient. Enquanto a migration 029 não estiver aplicada,
 * business_kind não existe e este componente nunca é invocado.
 */
import { supabase } from "@/app/lib/supabase";
import { fetchPortalFeed, portalCategories } from "@/lib/portal";
import { getPortalSettings } from "@/lib/portal-server";
import PortalMontraClient from "./PortalMontraClient";

export default async function PortalMontra({ slug }: { slug: string }) {
  const { data } = await supabase
    .from("businesses")
    .select("id, name, description, logo_url, cover_url, city")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-4 text-center text-white">
        <p>Montra não encontrada ou ainda não publicada.</p>
      </main>
    );
  }

  const { ready, settings } = await getPortalSettings();
  const enabled = ready && settings.enabled;
  const feed = enabled ? await fetchPortalFeed() : null;
  const allowed = new Set(settings.categories);
  const products =
    feed && !feed.error
      ? allowed.size === 0
        ? feed.products
        : feed.products.filter((p) => allowed.has(p.category))
      : [];

  return (
    <PortalMontraClient
      business={{
        id: data.id,
        name: data.name,
        description: data.description,
        logoUrl: data.logo_url,
        coverUrl: data.cover_url,
        city: data.city,
      }}
      products={products}
      categories={feed && !feed.error ? portalCategories(feed.products) : []}
      portalUrl={settings.portalUrl}
      integrationEnabled={enabled && !!feed && !feed.error}
    />
  );
}
