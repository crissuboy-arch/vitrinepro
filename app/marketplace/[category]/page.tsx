import type { Metadata } from "next";
import Link from "next/link";
import { getMarketplaceProducts, getDbCategories } from "@/lib/business-actions";
import MarketplaceGrid from "../MarketplaceGrid";

interface MarketplacePageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: MarketplacePageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { category: categorySlug } = resolvedParams;

  const categories = await getDbCategories();
  const currentCat = categories.find((c) => c.slug === categorySlug);

  const title = currentCat 
    ? `Marketplace: Comprar ${currentCat.name} em Portugal | VitrinePro` 
    : "Marketplace de Produtos Locais e Digitais | VitrinePro";
  
  const description = currentCat
    ? `Encontre os melhores produtos de ${currentCat.name.toLowerCase()} no Marketplace do VitrinePro. Compre diretamente no WhatsApp e apoie negócios locais.`
    : "Explore o nosso marketplace híbrido com eletrónicos, moda, artesanato, cursos, ebooks e templates em Portugal.";

  return {
    title,
    description,
    alternates: {
      canonical: `https://vitrinepro.pt/marketplace/${categorySlug}`,
    },
  };
}

export default async function MarketplaceCategoryPage({ params }: MarketplacePageProps) {
  const resolvedParams = await params;
  const { category: categorySlug } = resolvedParams;

  // Parallel fetch products and categories (first page only)
  const [{ products, hasMore }, categories] = await Promise.all([
    getMarketplaceProducts(categorySlug, 24, 0),
    getDbCategories(),
  ]);

  const currentCat = categories.find((c) => c.slug === categorySlug);

  // Filter only categories belonging to Marketplace (c1...) or Digital (c2...)
  const marketplaceCategories = categories.filter(
    (c) => c.parent_id === "c1000000-0000-4000-a000-000000000000" || c.parent_id === "c2000000-0000-4000-a000-000000000000"
  );

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col font-sans">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-slate-400 hover:text-white transition-colors border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg">
              ← Voltar ao Início
            </Link>
            <Link href="/explorar" className="text-xs text-[#C8A96B] hover:text-[#D4BB82] transition-colors border border-[#C8A96B]/20 px-3 py-1.5 rounded-lg">
              🔍 Explorar Empresas
            </Link>
          </div>
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <img src="/logo-vitrinepro.png" alt="VitrinePro" className="h-10 w-auto object-contain" />
          </Link>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 py-16 text-center border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <span className="px-3 py-1 text-[10px] font-bold text-[#0F172A] bg-[#C8A96B] rounded-full uppercase tracking-wider">
            Marketplace Híbrido
          </span>
          <h1 className="text-3xl md:text-5xl font-bold font-display text-white tracking-tight">
            {currentCat ? `Produtos: ${currentCat.name}` : "Marketplace Local & Digital"}
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto font-light leading-relaxed">
            Compre produtos físicos e arquivos digitais diretamente de lojistas, artesãos e criadores imigrantes em Portugal. Sem taxas adicionais, sem intermediários.
          </p>
        </div>
      </div>

      {/* Layout Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-10 flex flex-col md:flex-row gap-8">
        
        {/* Left Sidebar: Categories Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0 space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Categorias</h2>
          <div className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
            <Link
              href="/marketplace/todas"
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border block ${
                categorySlug === "todas"
                  ? "bg-[#C8A96B] text-[#0F172A] border-transparent"
                  : "bg-slate-900/40 border-slate-800 text-slate-350 hover:text-white hover:border-slate-700"
              }`}
            >
              🌐 Todos os Produtos
            </Link>
            {marketplaceCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/marketplace/${cat.slug}`}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border block ${
                  categorySlug === cat.slug
                    ? "bg-[#C8A96B] text-[#0F172A] border-transparent"
                    : "bg-slate-900/40 border-slate-800 text-slate-350 hover:text-white hover:border-slate-700"
                }`}
              >
                <span>{cat.icon || "📦"} </span>
                <span>{cat.name}</span>
              </Link>
            ))}
          </div>
        </aside>

        {/* Right Content: Product Grid */}
        <section className="flex-grow space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white font-display">
              {currentCat ? currentCat.name : "Todos os Produtos"}
            </h3>
          </div>

          <MarketplaceGrid
            initialProducts={products}
            initialHasMore={hasMore}
            categorySlug={categorySlug}
          />
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12 text-center text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-3">
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
