/**
 * app/api/portal/products/route.ts — produtos públicos do Portal.
 *
 * Só devolve produtos quando: migration aplicada + integração ATIVA +
 * montra do Portal PUBLICADA. Os produtos vêm do feed do Portal (fonte
 * principal) — nada é lido da tabela products, nada é duplicado.
 * Categorias selecionadas no painel limitam a lista (vazio = todas).
 */
import { NextResponse } from "next/server";
import { fetchPortalFeed, portalCategories } from "@/lib/portal";
import { getPortalBusiness, getPortalSettings } from "@/lib/portal-server";

export const runtime = "nodejs";

export async function GET() {
  const [{ ready, settings }, business] = await Promise.all([getPortalSettings(), getPortalBusiness()]);
  if (!ready || !settings.enabled || !business || !business.published) {
    return NextResponse.json({ ready: false, products: [], categories: [], business: null });
  }
  const feed = await fetchPortalFeed();
  if (feed.error) {
    return NextResponse.json(
      { ready: false, products: [], categories: [], business: { id: business.id, slug: business.slug }, error: feed.error },
      { status: 200 },
    );
  }
  const allowed = new Set(settings.categories);
  const products = allowed.size === 0 ? feed.products : feed.products.filter((p) => allowed.has(p.category));
  return NextResponse.json({
    ready: true,
    products,
    categories: portalCategories(feed.products),
    portalUrl: settings.portalUrl,
    business: { id: business.id, slug: business.slug },
    fetchedAt: feed.fetchedAt,
  });
}
