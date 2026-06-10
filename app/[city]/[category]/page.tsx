import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getBusinessesByCityAndCategory } from "@/lib/business-actions";

interface CityPageProps {
  params: Promise<{ city: string; category: string }>;
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { city: citySlug, category: categorySlug } = resolvedParams;

  const { city, category, businesses } = await getBusinessesByCityAndCategory(citySlug, categorySlug);

  if (!city || !category) {
    return {
      title: "Página não encontrada | VitrinePro",
      description: "A página que procura não existe ou está inativa.",
    };
  }

  const name = category.name;
  const cityName = city.name;
  const count = businesses.length;
  const title = `Melhores ${name} em ${cityName} | VitrinePro`;
  const description = `Procura por ${name.toLowerCase()} em ${cityName}? Encontre ${count} profissional${count !== 1 ? "ais" : ""} e loja${count !== 1 ? "s" : ""} com contactos de WhatsApp directos, moradas e avaliações reais.`;
  const canonical = `https://vitrinepro.pt/${citySlug}/${categorySlug}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function CityCategoryPage({ params }: CityPageProps) {
  const resolvedParams = await params;
  const { city: citySlug, category: categorySlug } = resolvedParams;

  const { city, category, businesses } = await getBusinessesByCityAndCategory(citySlug, categorySlug);

  if (!city || !category) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="text-center p-6">
          <h1 className="text-3xl font-display text-[#0F172A] mb-4 font-bold">Página não encontrada</h1>
          <p className="text-slate-600 mb-6 max-w-sm mx-auto">A cidade ou categoria especificada não existe na nossa base de dados.</p>
          <Link href="/explorar" className="inline-block px-6 py-3 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] font-bold rounded-lg transition-colors">
            Voltar a Explorar
          </Link>
        </div>
      </div>
    );
  }

  const siteUrl = "https://vitrinepro.pt";
  const canonicalUrl = `${siteUrl}/${citySlug}/${categorySlug}`;

  // Localized Dynamic FAQ Questions & Answers
  const faqList = [
    {
      q: `Como posso entrar em contacto com um ${category.name} em ${city.name}?`,
      a: `Para contactar um profissional ou empresa de ${category.name.toLowerCase()} em ${city.name}, basta clicar em "Ver Vitrine" na ficha da empresa e carregar no botão do WhatsApp para falar directamente com o responsável, sem intermediários.`,
    },
    {
      q: `Qual é o preço de um serviço de ${category.name} em ${city.name}?`,
      a: `Os valores cobrados por profissionais de ${category.name.toLowerCase()} em ${city.name} variam bastante dependendo da especialidade, complexidade e experiência do prestador. Recomendamos entrar em contacto directo via WhatsApp para solicitar um orçamento personalizado.`,
    },
    {
      q: `Posso confiar nas avaliações das empresas de ${category.name} listadas em ${city.name}?`,
      a: `Sim, a VitrinePro recolhe ratings e comentários reais de utilizadores locais em Portugal. Além disso, destacamos profissionais com selo Premium verificado para maior segurança nas suas escolhas.`,
    },
  ];

  // Schema: BreadcrumbList JSON-LD
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Início", "item": siteUrl },
      { "@type": "ListItem", "position": 2, "name": "Explorar", "item": `${siteUrl}/explorar` },
      { "@type": "ListItem", "position": 3, "name": city.name, "item": `${siteUrl}/explorar` },
      { "@type": "ListItem", "position": 4, "name": category.name, "item": canonicalUrl }
    ]
  };

  // Schema: FAQPage JSON-LD
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqList.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a
      }
    }))
  };

  // Schema: ItemList for LocalBusinesses JSON-LD
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Melhores ${category.name} em ${city.name}`,
    "numberOfItems": businesses.length,
    "itemListElement": businesses.map((b, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "item": {
        "@type": b.type === "loja" ? "Store" : "LocalBusiness",
        "name": b.name,
        "description": b.description,
        "url": `${siteUrl}/${b.type === "loja" ? "loja" : "vitrine"}/${b.slug}`,
        "telephone": b.phone || b.whatsapp,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": b.city || city.name,
          "addressCountry": b.country || "PT"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": b.rating_average || 5.0,
          "reviewCount": b.rating_count || 1
        }
      }
    }))
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#0F172A]">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {businesses.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}

      {/* Header */}
      <header className="bg-[#0F172A] border-b border-[#1F2937] sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <img src="/logo-vitrinepro.png" alt="VitrinePro" className="h-10 w-auto object-contain" />
            </Link>
            <Link href="/explorar" className="text-[#E5E7EB] hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider">
              Ver todos os negócios
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-[#0F172A] py-16 md:py-20 text-center relative overflow-hidden bg-gradient-to-b from-[#0F172A] to-slate-950">
        <div className="container mx-auto px-4 space-y-4">
          <h1 className="font-display text-4xl md:text-6xl text-white font-bold tracking-tight">
            Melhores {category.name} em {city.name}
          </h1>
          <p className="text-[#E5E7EB] text-base md:text-lg max-w-xl mx-auto font-light leading-relaxed">
            Encontre profissionais e lojas de {category.name.toLowerCase()} em {city.name} com contactos directos de WhatsApp, localizações e opiniões verificadas.
          </p>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-[#E5E7EB] py-3 text-xs">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center gap-1.5 text-slate-500">
            <Link href="/" className="hover:text-[#C8A96B] transition-colors">Início</Link>
            <span>/</span>
            <Link href="/explorar" className="hover:text-[#C8A96B] transition-colors">Negócios</Link>
            <span>/</span>
            <span className="text-[#0F172A] font-medium">{city.name}</span>
            <span>/</span>
            <span className="text-[#0F172A] font-semibold">{category.name}</span>
          </div>
        </div>
      </div>

      {/* Results Listings Grid */}
      <div className="container mx-auto px-4 py-12">
        {businesses.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-xl font-bold font-display text-[#0F172A]">
              Encontrados <span className="text-[#C8A96B]">{businesses.length}</span> negócios de {category.name} em {city.name}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {businesses.map((business) => (
                <Link
                  key={business.id}
                  href={`/${business.type === "loja" ? "loja" : "vitrine"}/${business.slug}`}
                  className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden hover:border-[#C8A96B]/50 hover:shadow-[0_20px_50px_rgba(15,23,42,0.06)] transition-all group flex flex-col justify-between"
                >
                  <div>
                    {/* Cover Photo */}
                    <div className="relative h-44 bg-slate-900 overflow-hidden flex-shrink-0">
                      {business.cover_url ? (
                        <Image
                          src={business.cover_url}
                          alt={business.name}
                          fill
                          className="object-cover group-hover:scale-102 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0F172A] to-slate-800">
                          <span className="text-4xl text-[#C8A96B]">🏪</span>
                        </div>
                      )}
                      {business.is_verified_store && (
                        <span className="absolute top-3 left-3 px-2 py-0.5 bg-[#C8A96B] text-[#0F172A] text-[9px] font-bold rounded uppercase tracking-wider shadow">
                          ✓ Verificada
                        </span>
                      )}
                      {(business.plan === "pro" || business.plan === "premium" || business.plan === "business") && (
                        <span className="absolute top-3 right-3 px-2.5 py-0.5 bg-[#C8A96B] text-[#0F172A] text-[9px] font-bold rounded uppercase tracking-wider shadow">
                          Premium
                        </span>
                      )}
                    </div>

                    {/* Ficha Info */}
                    <div className="p-6 space-y-3">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden relative -mt-9 shadow-lg flex-shrink-0">
                          {business.logo_url ? (
                            <img src={business.logo_url} alt={`Logo de ${business.name}`} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm">🏪</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-display text-base font-bold text-[#0F172A] truncate leading-tight group-hover:text-[#C8A96B] transition-colors">
                            {business.name}
                          </h3>
                          <p className="text-[10px] text-slate-500">📍 {business.city}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {business.description || "Consulte a nossa vitrina oficial para ver fotos e solicitar informações."}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs mt-4">
                    <div className="flex items-center gap-1 text-[#C8A96B]">
                      <span>★</span>
                      <span className="font-bold text-[#0f172a]">{business.rating_average?.toFixed(1) || "5.0"}</span>
                      <span className="text-slate-400">({business.rating_count || 1})</span>
                    </div>
                    <span className="text-[#C8A96B] font-bold group-hover:underline">
                      Ver {business.type === "loja" ? "Loja" : "Vitrine"} →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl max-w-lg mx-auto space-y-6">
            <span className="text-5xl block">🏪</span>
            <div className="space-y-2 px-6">
              <h2 className="text-xl font-bold text-[#0F172A] font-display">Sem negócios de {category.name} cadastrados ainda</h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                Não existem empresas de {category.name.toLowerCase()} listadas em {city.name}. Seja o primeiro a criar a sua vitrina profissional e a destacar o seu negócio!
              </p>
            </div>
            <div className="pt-2">
              <Link href="/register" className="inline-block px-8 py-3 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] font-bold rounded-lg transition-colors shadow-md">
                Cadastrar o meu Negócio Grátis
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Portuguese FAQ Section */}
      <section className="bg-white border-y border-[#E5E7EB] py-16">
        <div className="container mx-auto px-4 max-w-3xl space-y-8">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-[#0F172A] text-center mb-10">
            Perguntas Frequentes sobre {category.name} em {city.name}
          </h2>
          <div className="space-y-6">
            {faqList.map((faq, index) => (
              <div key={index} className="bg-[#FAF7F2] p-6 rounded-xl border border-slate-100 space-y-2">
                <h3 className="font-semibold text-sm md:text-base text-[#0F172A] flex gap-2">
                  <span>Q:</span>
                  <span>{faq.q}</span>
                </h3>
                <p className="text-xs md:text-sm text-slate-600 pl-6 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programmatic SEO Text Section */}
      <section className="py-16 bg-[#FAF7F2]">
        <div className="container mx-auto px-4 max-w-3xl text-center space-y-6">
          <h2 className="font-display text-2xl text-[#0F172A] font-bold">
            Encontre {category.name} Verificados em {city.name}
          </h2>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-light">
            Na VitrinePro compilamos a listagem oficial dos melhores profissionais de {category.name.toLowerCase()} em {city.name}, organizados por classificação e proximidade. O nosso objectivo é apoiar a divulgação de negócios locais em Portugal e conectar clientes a fornecedores fiáveis directamente por WhatsApp, reduzindo custos de agenciamento.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#0F172A] border-t border-slate-900 text-center text-slate-500 text-xs">
        <div className="container mx-auto px-4 flex flex-col items-center gap-3">
          <Link href="/">
            <img src="/logo-vitrinepro.png" alt="VitrinePro" className="h-10 mx-auto object-contain bg-transparent mb-2" />
          </Link>
          <p>© 2026 VitrinePro. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
