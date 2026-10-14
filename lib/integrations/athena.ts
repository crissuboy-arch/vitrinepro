/**
 * lib/integrations/athena.ts
 *
 * Ponto oficial de integração entre a VitrinePro (plataforma SaaS)
 * e a Athena Control (central de gestão por IA).
 *
 * FASE 1 (implementada): health check público, sem autenticação,
 * sem acesso a dados de clientes, sem escrita, sem Supabase.
 *
 * FASE 2 (arquitetura preparada, NÃO implementada):
 * integração autenticada máquina-a-máquina. Requisitos registados
 * aqui para que a implementação futura os cumpra desde o dia um:
 *   - chaves de integração por plataforma (nunca credenciais de utilizador);
 *   - scopes granulares (ex.: integrations:health < integrations:stores:read);
 *   - isolamento por tenant/empresa: uma chave só enxerga a sua empresa;
 *   - sem acesso cruzado entre empresas, sem ações administrativas;
 *   - auditoria de cada chamada autenticada.
 *
 * Nada neste ficheiro altera autenticação existente, Supabase ou RLS.
 */

/** Identidade pública da plataforma (usada no /api/integrations/health). */
export const PLATFORM_ID = "vitrinepro" as const;
export const PLATFORM_NAME = "VitrinePro" as const;

/**
 * Versão da plataforma reportada no health check.
 * Manter sincronizada com `version` em package.json
 * (o teste tests/integrations-health.test.ts valida isso).
 */
export const PLATFORM_VERSION = "0.1.0";

/** Versão do contrato de integração (para evolução futura sem quebrar clientes). */
export const INTEGRATION_CONTRACT_VERSION = "v1" as const;

/** Scopes planeados para a fase 2. Apenas `integrations:health` existe hoje. */
export const ATHENA_SCOPES = [
  "integrations:health",
  // Fase 2 (não implementar sem autorização explícita):
  // "integrations:stores:read",
  // "integrations:products:read",
] as const;

export type AthenaScope = (typeof ATHENA_SCOPES)[number];

/** Formato da resposta do health check (contrato v1). */
export interface IntegrationsHealthResponse {
  platform: typeof PLATFORM_NAME;
  status: "operational" | "degraded";
  version: string;
  contract: typeof INTEGRATION_CONTRACT_VERSION;
  /** Capacidades ativas nesta fase — leitura pública apenas. */
  capabilities: AthenaScope[];
  timestamp: string;
}

/**
 * Envelope previsto para a fase 2 autenticada (tipo apenas, sem implementação).
 * Cada pedido autenticado terá de identificar a plataforma chamadora,
 * o tenant/empresa alvo e os scopes concedidos — nunca dados de outro tenant.
 */
export interface AthenaAuthenticatedContext {
  caller: "athena-control";
  tenantId: string;
  scopes: AthenaScope[];
}
