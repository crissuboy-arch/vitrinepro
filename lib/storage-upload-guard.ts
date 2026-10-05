/**
 * lib/storage-upload-guard.ts — hardening do upload (Turma da Mônica)
 *
 * Puro (sem imports): a policy de Storage está correta e restritiva;
 * o que falhava era sessão/conta desencontrada no momento do upload.
 * Estes helpers tornam a falha acionável e previnem estado stale.
 */

/**
 * Traduz o erro críptico do Postgres ("new row violates row-level
 * security policy") para mensagem acionável em pt-BR.
 * A policy continua intacta — só a mensagem muda.
 */
export function mapStorageUploadError(bucketName: string, rawMessage: string): Error {
  if (/row.level security|rls|policy/i.test(rawMessage)) {
    return new Error(
      `Sem permissão para enviar imagens (bucket ${bucketName}). ` +
        `Isto costuma acontecer quando a sessão expirou ou iniciaste sessão com outra conta ` +
        `que não é a proprietária desta Montra. Faz logout, entra com a conta proprietária e tenta de novo.`
    );
  }
  return new Error(`Erro no upload para o bucket ${bucketName}: ${rawMessage}`);
}

/**
 * Defesa em profundidade contra estado stale: antes de cada upload, confirma
 * que a sessão ATUAL ainda pertence ao dono da business carregada.
 */
export function assertFreshUploadOwnership(
  sessionUserId: string | null | undefined,
  businessUserId: string | null | undefined
): void {
  if (!sessionUserId || !businessUserId || sessionUserId !== businessUserId) {
    throw new Error(
      "Sessão desatualizada ou conta sem permissão sobre esta Montra. " +
        "Faz logout, entra com a conta proprietária e tenta de novo."
    );
  }
}
