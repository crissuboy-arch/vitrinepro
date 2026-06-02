import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getProductBySlug } from "@/lib/business-actions";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Produto Não Encontrado | VitrinePro",
    };
  }

  const businessName = product.businesses?.name || "VitrinePro";
  const title = `${product.name} | Comprar em ${businessName} | VitrinePro`;
  const description = product.description
    ? `${product.description.substring(0, 155)}${product.description.length > 155 ? "..." : ""} Compre directly no WhatsApp.`
    : `Veja detalhes de ${product.name} e faça o seu pedido na loja ${businessName} no VitrinePro.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://vitrinepro.pt/produto/${slug}`,
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const product = await getProductBySlug(slug);

  if (!product) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-center p-6 bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full">
          <h1 className="text-2xl text-white font-bold mb-4">Produto não encontrado</h1>
          <p className="text-slate-400 mb-6 text-sm">Este produto não existe, está inativo ou o link está incorreto.</p>
          <Link href="/marketplace/todas" className="inline-block px-6 py-3 bg-[#C8A96B] text-[#0F172A] font-bold rounded-lg hover:bg-[#D4BB82] transition-colors text-xs uppercase tracking-wider">
            Ver Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const business = product.businesses;
  const isDigital = product.type === "digital";
  const isFree = isDigital && (product.price === 0 || product.price === null || product.price === undefined);
  const whatsappNumber = business?.whatsapp || business?.phone || "";
  const cleanWhatsapp = whatsappNumber.replace(/\D/g, "");

  // Text message for WhatsApp purchase
  const productUrl = `https://vitrinepro.pt/produto/${slug}`;
  const whatsappText = `Olá! Vi o produto "${product.name}" no VitrinePro e gostaria de mais informações. Está disponível?\n\nLink: ${productUrl}`;
  const whatsappLink = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(whatsappText)}`;

  // Product schema for SEO
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.image_url || "",
    "description": product.description || "",
    "offers": {
      "@type": "Offer",
      "priceCurrency": "EUR",
      "price": product.price !== null ? product.price : 0,
      "availability": "https://schema.org/InStock",
      "url": productUrl
    },
    "brand": {
      "@type": "Brand",
      "name": business?.name || "VitrinePro"
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col font-sans select-none">
      
      {/* Schema LD JSON */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      {/* Header */}
      <nav className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/marketplace/todas" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors border border-slate-800 hover:border-slate-700 px-3 py-2 rounded-lg">
              🛍️ Marketplace
            </Link>
            {business?.slug && (
              <Link href={`/loja/${business.slug}`} className="text-xs font-semibold text-slate-400 hover:text-white transition-colors border border-slate-800 hover:border-slate-700 px-3 py-2 rounded-lg">
                🏪 Visitar Loja
              </Link>
            )}
          </div>
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <img src="/logo-vitrinepro.png" alt="VitrinePro" className="h-10 w-auto object-contain" />
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-8 md:py-12">
        
        {/* Breadcrumbs */}
        <div className="text-xs text-slate-400 mb-6 flex flex-wrap items-center gap-2">
          <Link href="/" className="hover:text-white transition-colors">Início</Link>
          <span>/</span>
          <Link href="/marketplace/todas" className="hover:text-white transition-colors">Marketplace</Link>
          <span>/</span>
          {business?.category && (
            <>
              <span className="text-slate-500">{business.category}</span>
              <span>/</span>
            </>
          )}
          <span className="text-[#C8A96B] font-medium truncate max-w-xs">{product.name}</span>
        </div>

        {/* Product Details Grid */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 bg-slate-900/30 border border-slate-800/80 rounded-3xl p-6 md:p-8 lg:p-10">
          
          {/* Left Column: Image Card */}
          <div className="flex flex-col justify-center">
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-950/80 border border-slate-800 flex items-center justify-center shadow-2xl group">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-contain p-4 group-hover:scale-[1.03] transition-transform duration-500"
                  priority
                />
              ) : (
                <div className="text-slate-700 flex flex-col items-center gap-2">
                  <span className="text-7xl">📦</span>
                  <span className="text-xs text-slate-500 font-light">Sem imagem disponível</span>
                </div>
              )}

              {/* Status Badges */}
              <div className="absolute top-4 left-4 flex gap-2">
                {isDigital ? (
                  <span className="px-2.5 py-1 bg-blue-600/90 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider shadow border border-blue-500/20">
                    💻 Digital
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-orange-600/90 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider shadow border border-orange-500/20">
                    🛍️ Físico
                  </span>
                )}
                {product.digital_type && (
                  <span className="px-2.5 py-1 bg-slate-800/90 text-[#C8A96B] text-[10px] font-bold rounded-lg uppercase tracking-wider shadow border border-slate-700">
                    📂 {product.digital_type}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Information & CTAs */}
          <div className="flex flex-col justify-between space-y-6">
            
            {/* Header info */}
            <div className="space-y-4">
              
              {/* Product Name */}
              <h1 className="text-2xl md:text-3.5xl font-bold font-display text-white tracking-tight leading-tight">
                {product.name}
              </h1>

              {/* Business Owner Section */}
              {business && (
                <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800/60 rounded-2xl p-3 max-w-fit">
                  {business.logo_url ? (
                    <img
                      src={business.logo_url}
                      alt={business.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-slate-850 flex items-center justify-center text-lg border border-slate-800">
                      🏪
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Link href={`/loja/${business.slug}`} className="text-xs font-bold text-white hover:text-[#C8A96B] transition-colors">
                        {business.name}
                      </Link>
                      {business.is_verified_store && (
                        <span className="text-[#C8A96B] text-xs" title="Loja Verificada">✓</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      📍 {business.city || "Portugal"} · {business.category}
                    </p>
                  </div>
                </div>
              )}

              {/* Pricing Display */}
              <div className="pt-2 flex items-baseline gap-2">
                {product.price !== null && product.price > 0 ? (
                  <>
                    <span className="text-3xl md:text-4.5xl font-extrabold text-[#C8A96B] font-display">
                      €{product.price.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400 font-light">Preço único</span>
                  </>
                ) : (
                  <span className="text-3xl md:text-4.5xl font-extrabold text-emerald-400 font-display">
                    Grátis
                  </span>
                )}
              </div>

              {/* Status Stock */}
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Disponível para Encomenda
              </div>

            </div>

            {/* Description Card */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 md:p-6 space-y-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800/80 pb-2">
                Descrição do Artigo
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line font-light">
                {product.description || "Este parceiro comercial ainda não adicionou uma descrição detalhada para este produto. Clique no botão abaixo para tirar dúvidas directamente."}
              </p>
            </div>

            {/* Action CTAs */}
            <div className="space-y-3 pt-4">
              
              {/* WhatsApp Purchase Button */}
              {(!isFree && cleanWhatsapp) && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full py-4 bg-[#25D366] text-white rounded-2xl font-bold hover:bg-[#20BD5A] active:scale-[0.98] transition-all text-sm shadow-lg shadow-[#25D366]/10"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.019-5.116-2.875-6.973-1.857-1.857-4.335-2.875-6.977-2.875-5.438 0-9.863 4.42-9.867 9.864-.001 1.73.457 3.418 1.32 4.933l-.994 3.635 3.729-.976zM17.487 14.4c-.27-.136-1.6-.79-1.847-.88-.249-.09-.43-.136-.61.136-.18.27-.7.88-.857 1.058-.157.18-.314.204-.585.068-.27-.136-1.14-.42-2.172-1.34-1.03-.92-1.724-2.056-1.926-2.396-.202-.34-.022-.523.148-.692.153-.153.34-.396.51-.595.17-.198.227-.34.34-.567.113-.227.056-.425-.028-.593-.084-.17-.61-1.47-.837-2.013-.22-.53-.443-.46-.61-.468-.156-.008-.336-.01-.516-.01a.99.99 0 0 0-.717.336c-.246.27-.94.92-.94 2.24 0 1.32.96 2.59 1.09 2.77.135.18 1.89 2.88 4.58 4.05.64.28 1.14.44 1.53.57.64.2 1.23.17 1.69.1.51-.08 1.6-.65 1.82-1.28.23-.63.23-1.18.16-1.29-.07-.11-.27-.18-.54-.316z"/>
                  </svg>
                  <span>Comprar pelo WhatsApp</span>
                </a>
              )}

              {/* Direct Download (If free digital product) */}
              {(isFree && product.download_url) && (
                <a
                  href={product.download_url}
                  download
                  className="flex items-center justify-center gap-3 w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-500 active:scale-[0.98] transition-all text-sm shadow-lg shadow-blue-600/10"
                >
                  <svg className="w-5 h-5 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  <span>Descarregar Arquivo Grátis</span>
                </a>
              )}

              {/* Purchase Digital (If premium digital product) */}
              {(isDigital && !isFree && cleanWhatsapp) && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-550 active:scale-[0.98] transition-all text-sm shadow-lg shadow-blue-600/10"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                  </svg>
                  <span>Adquirir Produto Digital</span>
                </a>
              )}

              {/* Contact Seller Fallback */}
              {!cleanWhatsapp && (
                <div className="text-center py-3 px-4 bg-slate-900/50 border border-slate-800 rounded-xl text-xs text-slate-400">
                  ⚠️ Dados de contacto não configurados para este negócio.
                </div>
              )}

              {/* Go Back to Shop */}
              {business?.slug && (
                <Link
                  href={`/loja/${business.slug}`}
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-2xl font-semibold hover:bg-slate-850 hover:text-white active:scale-[0.98] transition-all text-xs"
                >
                  🛍️ Ver Todos os Produtos da Loja
                </Link>
              )}

            </div>

          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12 text-center text-slate-500 text-xs mt-16">
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center gap-3">
          <Link href="/">
            <img src="/logo-vitrinepro.png" alt="VitrinePro" className="h-10 mx-auto object-contain bg-transparent mb-2" />
          </Link>
          <p className="text-slate-400">VitrinePro - Marketplace Local & Digital em Portugal</p>
          <p>© 2026 VitrinePro. Todos os direitos reservados.</p>
        </div>
      </footer>

    </div>
  );
}
