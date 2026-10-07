/**
 * lib/jsonld.ts — A10.1 CRITICAL 6
 *
 * Helper central para JSON-LD seguro.
 *
 * Problema: JSON.stringify() + dangerouslySetInnerHTML sem neutralizar "</"
 * permite que campos controlados pelo comerciante quebrem o
 * <script type="application/ld+json"> e injetem HTML/JS.
 *
 * Solução: escapar "<", ">", "&" e U+2028/U+2029 no JSON antes de injetar.
 * Isso neutraliza </script> sem alterar a semântica do JSON-LD.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
