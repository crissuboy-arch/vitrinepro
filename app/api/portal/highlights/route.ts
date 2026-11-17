/**
 * app/api/portal/highlights/route.ts — "Ofertas em destaque" (homepage).
 *
 * Mistura, de forma intercalada e justa:
 *  - produtos em destaque do Portal de Ofertas (feed; só com a
 *    integração ativa e a montra publicada), e
 *  - promoções Flash ATIVAS dos comerciantes da VitrinePro
 *    (expiradas nunca entram — isPromotionVisibleNow).
 * Nenhuma fonte ocupa todos os lugares.
 */
import { NextResponse } from "next/server";
import { fetchPortalFeed, interleaveFair, type PortalProduct } from "@/lib/portal";
import { getPortalBusiness, getPortalSettings } from "@/lib/portal-server";
import { getServiceClient } from "@/lib/admin-auth";
import { loadPromotions, isPromotionVisibleNow, discountPercent } from "@/lib/promotions";

export const runtime = "nodejs";

export interface HighlightPortal {
  source: "portal";
  product: PortalProduct;
}
export interface HighlightPromo {
  source: "vitrine";
  id: string;
  title: string;
  imageUrl: string | null;
  price: number | null;
  originalPrice: number | null;
  discount: number | null;
  businessName: string | null;
  businessSlug: string | null;
  businessId: string | null;
}

const CAP = 12;

export async function GET() {
  const items: (HighlightPortal | HighlightPromo)[] = [];

  // --- Promoções Flash dos comerciantes (sempre elegíveis) ---
  let promos: HighlightPromo[] = [];
  const svc = getServiceClient();
  if (svc) {
    try {
      const rows = await loadPromotions(svc as never);
      const now = new Date();
      promos = rows
        .filter((r) => isPromotionVisibleNow(r, now) && r.businesses?.published !== false)
        .slice(0, CAP)
        .map((r) => ({
          source: "vitrine" as const,
          id: r.id,
          title: r.title,
          imageUrl: r.image_url ?? null,
          price: r.price != null ? Number(r.price) : null,
          originalPrice: r.original_price != null ? Number(r.original_price) : null,
          discount: discountPercent(r.original_price, r.price),
          businessName: r.businesses?.name ?? null,
          businessSlug: r.businesses?.slug ?? null,
          businessId: r.business_id ?? null,
        }));
    } catch {
      promos = [];
    }
  }

  // --- Produtos do Portal (só com integração ativa + montra publicada) ---
  let portalItems: HighlightPortal[] = [];
  let portalMeta: { businessId: string; businessSlug: string; portalUrl: string } | null = null;
  const [{ ready, settings }, business] = await Promise.all([getPortalSettings(), getPortalBusiness()]);
  if (ready && settings.enabled && business?.published) {
    const feed = await fetchPortalFeed();
    if (!feed.error) {
      const allowed = new Set(settings.categories);
      const inScope = allowed.size === 0 ? feed.products : feed.products.filter((p) => allowed.has(p.category));
      const chosen = new Set(settings.featuredIds);
      const ordered = [
        ...inScope.filter((p) => chosen.has(p.externalId)),
        ...inScope.filter((p) => p.featured && !chosen.has(p.externalId)),
        ...inScope.filter((p) => !p.featured && !chosen.has(p.externalId)),
      ];
      portalItems = ordered.slice(0, CAP).map((product) => ({ source: "portal" as const, product }));
      portalMeta = { businessId: business.id, businessSlug: business.slug, portalUrl: settings.portalUrl };
    }
  }

  const mixed = interleaveFair(portalItems, promos, CAP);
  void items;
  return NextResponse.json({ ready: true, items: mixed, portal: portalMeta });
}
