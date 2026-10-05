/**
 * lib/explore-slices.ts — A6 fix (Problema 3)
 *
 * Divide a lista filtrada do /explorar em "Destaque" (premium, máx. 3)
 * e "Todos os Negócios". Negócios premium além do cap NÃO são
 * descartados: descem para a secção regular, para que a contagem
 * exibida ("Vitrinas Publicadas (N)") corresponda sempre aos cartões
 * realmente renderizados.
 *
 * Pura, sem React — testável e reutilizável.
 */
export interface Sliceable {
  premium?: boolean | null;
}

export function splitExploreSlices<T extends Sliceable>(
  list: T[],
  featuredCap: number = 3
): { featured: T[]; regular: T[] } {
  const premium = list.filter((b) => b.premium);
  const featured = premium.slice(0, featuredCap);
  const regular = list
    .filter((b) => !b.premium)
    .concat(premium.slice(featuredCap));
  return { featured, regular };
}

/** Invariante de honestidade: cartões renderizados === total filtrado. */
export function slicesCoverAll<T extends Sliceable>(
  list: T[],
  featuredCap: number = 3
): boolean {
  const { featured, regular } = splitExploreSlices(list, featuredCap);
  return featured.length + regular.length === list.length;
}
