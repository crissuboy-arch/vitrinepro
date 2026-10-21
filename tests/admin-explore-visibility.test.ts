/**
 * tests/admin-explore-visibility.test.ts
 *
 * Controlo administrativo "Mostrar/Ocultar do Explorar"
 * (migration 20261021000021_businesses_show_in_explore).
 *
 * REGRA PROTEGIDA: ocultar ≠ despublicar. `show_in_explore` governa só a
 * DESCOBERTA pública; o acesso direto (página da Montra, /loja, APIs por
 * slug/id) NÃO pode ganhar este filtro.
 *
 * Testes estáticos de contrato sobre o código-fonte:
 *  1. A migration existe, é aditiva, default visível, com guarda admin-only.
 *  2. A API admin aceita o campo (whitelist) e a lista devolve o estado.
 *  3. A UI do admin tem o controlo (toggle + botão de olho nas Ações).
 *  4. TODAS as superfícies de descoberta filtram show_in_explore.
 *  5. As superfícies de acesso direto NÃO filtram show_in_explore.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

const MIGRATION = "supabase/migrations/20261021000021_businesses_show_in_explore.sql";

describe("Admin explore visibility — migration", () => {
  it("1. migration exists and adds the column additively, default visible", () => {
    assert.ok(existsSync(join(root, MIGRATION)), "migration file must exist");
    const sql = read(MIGRATION);
    assert.match(sql, /ADD COLUMN IF NOT EXISTS show_in_explore BOOLEAN NOT NULL DEFAULT true/);
  });

  it("2. migration guards the column: only service_role may change it", () => {
    const sql = read(MIGRATION);
    assert.match(sql, /BEFORE UPDATE OF show_in_explore ON public\.businesses/);
    assert.match(sql, /BEFORE INSERT ON public\.businesses/);
    assert.match(sql, /auth\.role\(\) IS DISTINCT FROM 'service_role'/);
    assert.match(sql, /RAISE EXCEPTION/);
  });

  it("3. migration never hides anyone by default (no executable backfill to false)", () => {
    const sql = read(MIGRATION);
    // Só SQL executável conta — o bloco de VERIFICAÇÃO comentado descreve
    // tentativas que devem FALHAR, não é código aplicado.
    const executable = sql
      .split("\n")
      .filter((l) => !l.trimStart().startsWith("--"))
      .join("\n");
    assert.doesNotMatch(executable, /SET show_in_explore\s*=\s*false/i);
    assert.doesNotMatch(executable, /UPDATE\s+public\.businesses/i);
  });
});

describe("Admin explore visibility — admin API + UI", () => {
  it("4. PATCH whitelist accepts show_in_explore (admin API)", () => {
    const route = read("app/api/admin/businesses/[id]/route.ts");
    assert.match(route, /"show_in_explore"/);
    // A escrita continua a exigir requireAdmin (service_role só no servidor).
    assert.match(route, /requireAdmin\(\)/);
  });

  it("5. admin list API returns show_in_explore (with pre-migration fallback)", () => {
    const route = read("app/api/admin/businesses/route.ts");
    assert.match(route, /show_in_explore/);
  });

  it("6. admin UI wires the toggle and the eye control in the actions column", () => {
    const page = read("app/admin/page.tsx");
    assert.match(page, /toggleExploreVisible/);
    assert.match(page, /show_in_explore: next/);
    assert.match(page, /Visível|Oculta/);
  });
});

describe("Admin explore visibility — discovery surfaces filter", () => {
  const discovery: Array<[string, RegExp]> = [
    ["app/explorar/page.tsx", /show_in_explore/],
    ["app/sitemap.ts", /show_in_explore/],
    ["lib/business-actions.ts", /show_in_explore/],
    ["app/marketplace/MarketplaceGrid.tsx", /businesses\.show_in_explore/],
    ["app/api/intelligence/search/route.ts", /show_in_explore/],
    ["app/comunidade/[slug]/page.tsx", /show_in_explore/],
    ["app/businesses/page.tsx", /show_in_explore/],
  ];
  for (const [file, pattern] of discovery) {
    it(`7. discovery surface filters: ${file}`, () => {
      assert.match(read(file), pattern, `${file} must filter show_in_explore`);
    });
  }
});

describe("Admin explore visibility — direct access is NOT filtered", () => {
  const direct = [
    "app/api/business-by-slug/route.ts",
    "app/vitrine/[slug]/VitrineClient.tsx",
    "app/loja/[slug]/page.tsx",
  ];
  for (const file of direct) {
    it(`8. direct surface keeps working untouched: ${file}`, () => {
      assert.doesNotMatch(
        read(file),
        /show_in_explore/,
        `${file} is direct access — hiding must never close the direct page/QR`
      );
    });
  }

  it("9. the published rule itself is untouched in lib/visibility.ts", () => {
    const vis = read("lib/visibility.ts");
    assert.match(vis, /b\?\.published === true/);
    assert.doesNotMatch(vis, /show_in_explore/);
  });
});
