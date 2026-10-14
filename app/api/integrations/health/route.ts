import { NextResponse } from "next/server";
import {
  PLATFORM_NAME,
  PLATFORM_VERSION,
  INTEGRATION_CONTRACT_VERSION,
  ATHENA_SCOPES,
  type IntegrationsHealthResponse,
} from "../../../../lib/integrations/athena";

/**
 * GET /api/integrations/health
 *
 * Health check OFICIAL da integração VitrinePro <-> Athena Control.
 *
 * Garantias:
 * - Sem autenticação (teste básico de conectividade).
 * - Sem acesso ao Supabase — não consulta nem expõe dados de clientes.
 * - Sem escrita, sem efeitos colaterais.
 * - Resposta 100% estática: identifica a plataforma e confirma
 *   que a API está operacional.
 */
export async function GET() {
  const body: IntegrationsHealthResponse = {
    platform: PLATFORM_NAME,
    status: "operational",
    version: PLATFORM_VERSION,
    contract: INTEGRATION_CONTRACT_VERSION,
    capabilities: [...ATHENA_SCOPES],
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    status: 200,
    headers: {
      // Nunca cachear: o Athena Connect precisa do estado real a cada sonda.
      "Cache-Control": "no-store",
    },
  });
}
