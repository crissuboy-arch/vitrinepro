"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface NewsItem {
  title: string;
  description: string;
  url: string;
  image: string;
  source: string;
  publishedAt: string;
}

const FALLBACK_NEWS: NewsItem[] = [
  {
    title: "PME portuguesas investem em transformação digital em 2025",
    description: "Pequenas e médias empresas em Portugal aceleram adoção de soluções digitais para competir no mercado.",
    url: "#",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop",
    source: "Economia PT",
    publishedAt: "18 de abril, 2025",
  },
  {
    title: "Setor do comércio em crescimento no Algarve",
    description: "Comércio local no Algarve regista aumento de 15% em vendas no primeiro trimestre do ano.",
    url: "#",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=250&fit=crop",
    source: "Jornal de Negócios",
    publishedAt: "17 de abril, 2025",
  },
  {
    title: "Novas linhas de financiamento para startups em Portugal",
    description: "Programas de apoio a pequenos negócios disponibilizam 50 milhões de euros.",
    url: "#",
    image: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&h=250&fit=crop",
    source: "Dinheiro Vivo",
    publishedAt: "16 de abril, 2025",
  },
];

export default function NewsSection() {
  const [news, setNews] = useState<NewsItem[]>(FALLBACK_NEWS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch(
          "https://gnews.io/api/v4/search?q=Portugal+neg%C3%B3cios+economia&lang=pt&max=3&apikey=demo"
        );

        if (response.ok) {
          const data = await response.json();
          if (data.articles && data.articles.length > 0) {
            const formattedNews = data.articles.map((article: any) => ({
              title: article.title,
              description: article.description?.slice(0, 100) + "...",
              url: article.url,
              image: article.image || "",
              source: article.source.name,
              publishedAt: new Date(article.publishedAt).toLocaleDateString("pt-PT", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }),
            }));
            setNews(formattedNews);
          }
        }
      } catch (error) {
        console.log("Using fallback news");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <section className="py-16 bg-white border-t border-[#E5E7EB]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-display text-xl md:text-2xl text-[#0F172A] mb-2">
            Últimas notícias sobre negócios em Portugal
          </h2>
          <p className="text-[#1F2937] text-sm">
            Mantenha-se informado sobre o mercado local
          </p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-[#E5E7EB] h-40 rounded-lg mb-4"></div>
                <div className="bg-[#E5E7EB] h-4 w-3/4 rounded mb-2"></div>
                <div className="bg-[#E5E7EB] h-3 w-1/2 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {news.map((item, index) => (
              <a
                key={index}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div className="relative h-40 bg-[#E5E7EB] rounded-lg overflow-hidden mb-3">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#1F2937]">
                      <svg
                        className="w-12 h-12"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <p className="text-xs text-[#C8A96B] font-medium mb-1">
                  {item.source} • {item.publishedAt}
                </p>
                <h3 className="font-medium text-[#0F172A] text-sm leading-snug group-hover:text-[#C8A96B] transition-colors line-clamp-2">
                  {item.title}
                </h3>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}