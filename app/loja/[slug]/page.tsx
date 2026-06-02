import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getBusinessBySlug } from "@/lib/business-actions";

interface StorePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const business = await getBusinessBySlug(slug);

  if (!business || business.type !== "loja") {
    return {
      title: "Loja Não Encontrada | VitrinePro",
    };
  }

  const title = `${business.name} | Loja Virtual em ${business.city} | VitrinePro`;
  const description = `Visite a loja virtual oficial de ${business.name} em ${business.city}. Veja a galeria de produtos, preços e faça o seu pedido directamente no WhatsApp.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://vitrinepro.pt/loja/${slug}`,
    },
  };
}

export default async function StoreDetailPage({ params }: StorePageProps) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const business = await getBusinessBySlug(slug);

  if (!business || business.type !== "loja") {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-center p-6 bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full">
          <h1 className="text-2xl text-white font-bold mb-4">Loja não encontrada</h1>
          <p className="text-slate-400 mb-6 text-sm">Esta página não existe, está inativa ou a empresa não está configurada como uma Loja.</p>
          <Link href="/explorar" className="inline-block px-6 py-3 bg-[#C8A96B] text-[#0F172A] font-bold rounded-lg hover:bg-[#D4BB82] transition-colors text-xs uppercase tracking-wider">
            Explorar Negócios
          </Link>
        </div>
      </div>
    );
  }

  const products = business.products || [];
  const siteUrl = "https://vitrinepro.pt";
  const canonicalUrl = `${siteUrl}/loja/${slug}`;

  // LocalBusiness schema for structured SEO
  const businessSchema = {
    "@context": "https://schema.org",
    "@type": "Store",
    "name": business.name,
    "description": business.description,
    "url": canonicalUrl,
    "image": business.logo_url || business.cover_url,
    "telephone": business.phone || business.whatsapp,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": business.city,
      "addressCountry": business.country || "PT"
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col font-sans select-none">
      
      {/* Schema LD JSON */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
      />

      {/* Header */}
      <nav className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/explorar" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors border border-slate-800 hover:border-slate-700 px-3 py-2 rounded-lg">
              🔍 Explorar
            </Link>
            <Link href="/marketplace/todas" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors border border-slate-800 hover:border-slate-700 px-3 py-2 rounded-lg">
              🛍️ Marketplace
            </Link>
          </div>
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <img src="/logo-vitrinepro.png" alt="VitrinePro" className="h-10 w-auto object-contain" />
          </Link>
        </div>
      </nav>

      {/* Full-width Cover Header */}
      <div className="relative h-60 sm:h-72 md:h-80 w-full bg-[#1b253b]">
        {business.cover_url ? (
          <Image
            src={business.cover_url}
            alt={business.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-slate-950 to-slate-900"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/50 to-transparent" />
      </div>

      {/* Profile Summary Overlay */}
      <div className="relative max-w-6xl mx-auto w-full px-4 -mt-20 sm:-mt-24 pb-8 flex flex-col items-center sm:items-start text-center sm:text-left sm:flex-row sm:gap-6 border-b border-slate-800">
        
        {/* Overlay Logo */}
        <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-2xl border-4 border-[#0F172A] bg-slate-900 shadow-2xl overflow-hidden flex-shrink-0 flex items-center justify-center">
          {business.logo_url ? (
            <img
              src={business.logo_url}
              alt={`Logo ${business.name}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-5xl text-[#C8A96B]">🏪</span>
          )}
        </div>

        {/* Business details */}
        <div className="mt-4 sm:mt-20 flex-grow">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <h1 className="text-3xl sm:text-4xl font-bold font-display text-white leading-tight">{business.name}</h1>
            {business.is_verified_store && (
              <span className="px-2.5 py-1 text-[9px] font-bold text-[#0F172A] bg-[#C8A96B] rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1">
                ⭐ Loja Verificada
              </span>
            )}
          </div>
          <p className="text-[#C8A96B] font-medium text-sm mt-1 sm:mt-0">
            {business.category || "Eletrónicos"} · 📍 {business.city} · {business.owner_origin_country && `🌍 Fundador: ${business.owner_origin_country}`}
          </p>
        </div>
      </div>

      {/* Content Layout */}
      <div className="max-w-6xl mx-auto w-full px-4 py-8 flex-grow">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Showcase (Description + Catalog Grid) */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* About */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 md:p-8 space-y-4">
              <h2 className="text-lg font-bold font-display text-white border-b border-slate-800 pb-2">Sobre a Loja</h2>
              <p className="text-slate-350 text-sm leading-relaxed whitespace-pre-line font-light">
                {business.description || "Bem-vindo ao nosso catálogo oficial. Conecte-se connosco por um dos canais disponíveis."}
              </p>
            </div>

            {/* Catalog Grid */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold font-display text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                <span>🛍️</span> Catálogo de Artigos ({products.length})
              </h2>

              {products.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-6">
                  {products.map((prod) => {
                    const isDigital = prod.type === "digital";
                    return (
                      <Link
                        key={prod.id}
                        href={`/produto/${prod.slug || prod.id}`}
                        className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden hover:border-[#C8A96B]/50 transition-all duration-300 flex flex-col justify-between group"
                      >
                        <div>
                          <div className="relative h-44 bg-slate-950 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {prod.image_url ? (
                              <Image
                                src={prod.image_url}
                                alt={prod.name}
                                fill
                                className="object-cover group-hover:scale-102 transition-transform"
                              />
                            ) : (
                              <div className="text-slate-700 flex flex-col items-center gap-1">
                                <span className="text-4xl">📦</span>
                              </div>
                            )}
                            {isDigital && (
                              <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-blue-600 text-white text-[8px] font-bold rounded uppercase">
                                Digital
                              </span>
                            )}
                            {prod.price !== null && prod.price !== undefined && (
                              <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-[#C8A96B]/90 text-[#0F172A] text-xs font-bold rounded border border-[#C8A96B]/30">
                                €{prod.price.toFixed(2)}
                              </span>
                            )}
                          </div>

                          <div className="p-5 space-y-2">
                            <h3 className="font-bold text-white text-sm font-display group-hover:text-[#C8A96B] transition-colors leading-tight truncate">
                              {prod.name}
                            </h3>
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                              {prod.description}
                            </p>
                          </div>
                        </div>

                        <div className="px-5 pb-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs mt-3">
                          <span className="text-slate-500">Ver Produto</span>
                          <span className="text-[#C8A96B] font-bold group-hover:underline">
                            Detalhes →
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-900/20 border border-slate-800 rounded-xl">
                  <span className="text-4xl block mb-2">📦</span>
                  <p className="text-xs text-slate-500">Nenhum produto cadastrado nesta loja no momento.</p>
                </div>
              )}
            </div>

          </div>

          {/* Right Sidebar: Contact details */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 space-y-4">
              <h3 className="text-md font-bold text-white border-b border-slate-800 pb-2">Canais de Atendimento</h3>
              
              {/* WhatsApp Button */}
              {business.whatsapp && (
                <a
                  href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-[#25D366] text-white rounded-xl font-bold hover:bg-[#20BD5A] active:scale-95 transition-all text-sm"
                >
                  Falar no WhatsApp
                </a>
              )}

              {/* Calls */}
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 active:scale-95 transition-all text-sm"
                >
                  Ligar para a Loja
                </a>
              )}

              {/* Instagram */}
              {business.instagram && (
                <a
                  href={business.instagram.startsWith("http") ? business.instagram : `https://instagram.com/${business.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] text-white rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all text-sm"
                >
                  Seguir no Instagram
                </a>
              )}

              {/* Website */}
              {business.website && (
                <a
                  href={business.website.startsWith("http") ? business.website : `https://${business.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full py-3 bg-slate-950 border border-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 active:scale-95 transition-all text-sm"
                >
                  Visitar Website
                </a>
              )}

              {/* Email details */}
              {business.email && (
                <div className="border-t border-slate-800 pt-4 space-y-1">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">E-mail Comercial</p>
                  <p className="text-xs text-slate-300 break-all">{business.email}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12 text-center text-slate-500 text-xs mt-16">
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center gap-3">
          <Link href="/">
            <img src="/logo-vitrinepro.png" alt="VitrinePro" className="h-10 mx-auto object-contain bg-transparent mb-2" />
          </Link>
          <p className="text-slate-400">O maior Pinterest de negócios locais em Portugal.</p>
          <p>© 2026 VitrinePro. Todos os direitos reservados.</p>
        </div>
      </footer>

    </div>
  );
}
