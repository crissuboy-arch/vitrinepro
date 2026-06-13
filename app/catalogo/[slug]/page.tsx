import { createClient } from "@supabase/supabase-js"
import { notFound } from "next/navigation"
import { cache } from "react"
import type { Metadata } from "next"
import type { Catalog } from "@/types/catalog"
import CatalogPublicView from "./CatalogPublicView"

const getCatalog = cache(async (slug: string): Promise<Catalog | null> => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  )
  const { data } = await supabase
    .from("catalogs")
    .select("*")
    .eq("slug", slug)
    .eq("publico", true)
    .maybeSingle()
  return (data as Catalog | null)
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const catalog = await getCatalog(slug)
  if (!catalog) return { title: "Catálogo não encontrado — VitrinePro" }
  const desc = `${catalog.capa.categoria}${catalog.capa.cidade ? ` em ${catalog.capa.cidade}` : ""}`
  return {
    title: `Catálogo ${catalog.capa.nome} — VitrinePro`,
    description: desc,
    openGraph: {
      title: `Catálogo ${catalog.capa.nome}`,
      description: desc,
      url: `${process.env.NEXT_PUBLIC_CATALOG_URL || 'https://vitrine.vitriodigital.com'}/catalogo/${slug}`,
      images: catalog.capa.imagem ? [{ url: catalog.capa.imagem }] : [],
    },
  }
}

export default async function CatalogPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const catalog = await getCatalog(slug)
  if (!catalog) notFound()
  return <CatalogPublicView catalog={catalog} />
}
