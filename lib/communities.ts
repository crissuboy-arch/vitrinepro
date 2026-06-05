export interface Community {
  slug: string;
  name: string;
  icon: string;
  country: string;
  color: string;
  description: string;
}

export const COMMUNITIES: Community[] = [
  {
    slug: "brasileira",
    name: "Brasileira",
    icon: "🇧🇷",
    country: "Brasil",
    color: "#22C55E",
    description: "Empreendedores brasileiros a construir negócios em Portugal",
  },
  {
    slug: "angolana",
    name: "Angolana",
    icon: "🇦🇴",
    country: "Angola",
    color: "#EF4444",
    description: "Empresários angolanos com raízes fortes e ambição crescente",
  },
  {
    slug: "cabo-verdiana",
    name: "Cabo-Verdiana",
    icon: "🇨🇻",
    country: "Cabo Verde",
    color: "#3B82F6",
    description: "Negócios cabo-verdianos que enriquecem a comunidade local",
  },
  {
    slug: "francesa",
    name: "Francesa",
    icon: "🇫🇷",
    country: "França",
    color: "#6366F1",
    description: "Empreendedores franceses com visão europeia e qualidade",
  },
  {
    slug: "portuguesa",
    name: "Portuguesa",
    icon: "🇵🇹",
    country: "Portugal",
    color: "#C8A96B",
    description: "Negócios portugueses que servem a comunidade local com orgulho",
  },
];

export function getCommunityBySlug(slug: string): Community | undefined {
  return COMMUNITIES.find((c) => c.slug === slug);
}

export function getCommunityByCountry(country: string): Community | undefined {
  if (!country) return undefined;
  const c = country.toLowerCase();
  return COMMUNITIES.find(
    (com) =>
      com.country.toLowerCase() === c ||
      c.includes(com.country.toLowerCase()) ||
      com.country.toLowerCase().includes(c)
  );
}
