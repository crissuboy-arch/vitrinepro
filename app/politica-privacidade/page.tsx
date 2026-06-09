import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade | VitrinePro",
  description: "Política de privacidade e tratamento de dados pessoais da VitrinePro, em conformidade com o RGPD e a Lei n.º 58/2019.",
  robots: { index: true, follow: true },
};

export default function PoliticaPrivacidadePage() {
  const lastUpdated = "9 de junho de 2026";

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <img src="/logo-vitrinepro.png" alt="VitrinePro" className="h-10 object-contain" />
          </Link>
          <Link href="/" className="text-sm text-[#1F2937] hover:text-[#C8A96B] transition-colors">
            ← Voltar ao início
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 md:p-12 space-y-10">

          {/* Title */}
          <div className="space-y-2 border-b border-[#E5E7EB] pb-8">
            <h1 className="text-3xl font-display font-bold text-[#0F172A]">Política de Privacidade</h1>
            <p className="text-sm text-[#6B7280]">Última atualização: {lastUpdated}</p>
            <p className="text-sm text-[#1F2937] leading-relaxed pt-2">
              A VitrinePro está comprometida com a proteção dos seus dados pessoais. Esta política descreve como recolhemos, tratamos e protegemos os seus dados, em conformidade com o Regulamento (UE) 2016/679 (RGPD) e a Lei n.º 58/2019, de 8 de agosto.
            </p>
          </div>

          {/* 1. Responsável pelo Tratamento */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-[#0F172A]">1. Responsável pelo Tratamento</h2>
            <div className="bg-[#FAF7F2] rounded-xl p-4 space-y-1 text-sm text-[#1F2937]">
              <p><strong>Denominação:</strong> VitrinePro</p>
              <p><strong>Endereço:</strong> Portugal</p>
              <p><strong>Email de contacto:</strong> <a href="mailto:privacidade@vitrinepro.pt" className="text-[#C8A96B] hover:underline">privacidade@vitrinepro.pt</a></p>
            </div>
            <p className="text-sm text-[#1F2937] leading-relaxed">
              Para questões relacionadas com o tratamento dos seus dados pessoais, pode contactar-nos através do endereço acima indicado.
            </p>
          </section>

          {/* 2. Dados recolhidos */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-[#0F172A]">2. Dados Pessoais Recolhidos</h2>
            <p className="text-sm text-[#1F2937]">Recolhemos os seguintes dados pessoais:</p>
            <div className="space-y-3">
              {[
                {
                  titulo: "Dados de conta",
                  itens: ["Endereço de email", "Palavra-passe (armazenada de forma cifrada)", "Nome de utilizador"]
                },
                {
                  titulo: "Dados do perfil do negócio",
                  itens: ["Nome do negócio, descrição e categoria", "Morada e cidade", "Número de telefone e WhatsApp", "Imagens (logótipo, capa, galeria)", "Horários de funcionamento", "Redes sociais (se fornecidas voluntariamente)"]
                },
                {
                  titulo: "Dados de pagamento",
                  itens: ["Informações de faturação processadas pela Stripe, Inc.", "Histórico de subscrições", "Nota: os dados de cartão de crédito não são armazenados na VitrinePro — são tratados exclusivamente pela Stripe"]
                },
                {
                  titulo: "Dados de utilização",
                  itens: ["Endereço IP", "Tipo de browser e dispositivo", "Páginas visitadas e ações realizadas na plataforma", "Data e hora de acesso"]
                },
                {
                  titulo: "Dados de leads (formulários de contacto)",
                  itens: ["Nome, email e número de WhatsApp dos potenciais clientes que preencham formulários de contacto nas vitrines"]
                }
              ].map(({ titulo, itens }) => (
                <div key={titulo} className="border border-[#E5E7EB] rounded-xl p-4">
                  <p className="text-sm font-semibold text-[#0F172A] mb-2">{titulo}</p>
                  <ul className="space-y-1">
                    {itens.map(item => (
                      <li key={item} className="text-sm text-[#1F2937] flex items-start gap-2">
                        <span className="text-[#C8A96B] mt-0.5 flex-shrink-0">—</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Base Legal */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-[#0F172A]">3. Base Legal para o Tratamento</h2>
            <p className="text-sm text-[#1F2937]">O tratamento dos seus dados pessoais assenta nas seguintes bases legais previstas no artigo 6.º do RGPD:</p>
            <div className="space-y-2">
              {[
                { base: "Execução de contrato (art. 6.º, n.º 1, al. b))", desc: "Prestação do serviço VitrinePro, incluindo criação de conta, gestão de vitrines e processamento de pagamentos." },
                { base: "Interesses legítimos (art. 6.º, n.º 1, al. f))", desc: "Melhoria do serviço, prevenção de fraude e segurança da plataforma." },
                { base: "Consentimento (art. 6.º, n.º 1, al. a))", desc: "Envio de comunicações de marketing ou newsletters, quando aplicável. Pode revogar o consentimento a qualquer momento." },
                { base: "Cumprimento de obrigação legal (art. 6.º, n.º 1, al. c))", desc: "Conservação de registos financeiros e fiscais conforme a legislação aplicável." },
              ].map(({ base, desc }) => (
                <div key={base} className="bg-[#FAF7F2] rounded-lg p-4 text-sm">
                  <p className="font-semibold text-[#0F172A] mb-1">{base}</p>
                  <p className="text-[#1F2937]">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Finalidades */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-[#0F172A]">4. Finalidades do Tratamento</h2>
            <ul className="space-y-2">
              {[
                "Criar e gerir a sua conta de utilizador",
                "Publicar e gerir a sua vitrine digital",
                "Processar pagamentos de subscrições",
                "Prestar suporte técnico e responder a questões",
                "Enviar notificações essenciais ao serviço (por ex.: confirmação de conta, renovação de subscrição)",
                "Melhorar a plataforma através da análise de utilização",
                "Prevenir fraude, abusos e violações dos termos de serviço",
                "Cumprir obrigações legais e fiscais",
              ].map(item => (
                <li key={item} className="text-sm text-[#1F2937] flex items-start gap-2">
                  <span className="text-[#C8A96B] font-bold flex-shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* 5. Partilha com Terceiros */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-[#0F172A]">5. Partilha com Subcontratantes e Terceiros</h2>
            <p className="text-sm text-[#1F2937]">
              A VitrinePro não vende nem partilha os seus dados pessoais com terceiros para fins comerciais. Recorremos a subcontratantes que tratam dados em nosso nome, sob as devidas garantias contratuais:
            </p>
            <div className="space-y-2">
              {[
                {
                  nome: "Supabase, Inc. (EUA)",
                  papel: "Alojamento da base de dados e autenticação",
                  garantia: "Cláusulas Contratuais Padrão (SCCs) — RGPD Art. 46.º",
                  site: "https://supabase.com/privacy"
                },
                {
                  nome: "Stripe, Inc. (EUA)",
                  papel: "Processamento de pagamentos",
                  garantia: "Certificação PCI DSS Level 1 + SCCs",
                  site: "https://stripe.com/privacy"
                },
                {
                  nome: "Vercel, Inc. (EUA)",
                  papel: "Alojamento e infraestrutura da aplicação",
                  garantia: "Cláusulas Contratuais Padrão (SCCs)",
                  site: "https://vercel.com/legal/privacy-policy"
                },
              ].map(({ nome, papel, garantia, site }) => (
                <div key={nome} className="border border-[#E5E7EB] rounded-xl p-4 text-sm">
                  <p className="font-semibold text-[#0F172A]">{nome}</p>
                  <p className="text-[#1F2937] mt-1"><strong>Papel:</strong> {papel}</p>
                  <p className="text-[#1F2937]"><strong>Garantia:</strong> {garantia}</p>
                  <a href={site} target="_blank" rel="noopener noreferrer" className="text-[#C8A96B] hover:underline text-xs mt-1 inline-block">
                    Política de privacidade →
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* 6. Transferências Internacionais */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-[#0F172A]">6. Transferências Internacionais de Dados</h2>
            <p className="text-sm text-[#1F2937] leading-relaxed">
              Alguns dos nossos subcontratantes (Supabase, Stripe, Vercel) têm servidores nos Estados Unidos da América. Estas transferências são realizadas ao abrigo de Cláusulas Contratuais Padrão aprovadas pela Comissão Europeia, nos termos do artigo 46.º do RGPD, garantindo um nível de proteção equivalente ao exigido na União Europeia.
            </p>
          </section>

          {/* 7. Prazo de Conservação */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-[#0F172A]">7. Prazo de Conservação dos Dados</h2>
            <div className="space-y-2">
              {[
                { tipo: "Dados de conta e vitrine", prazo: "Enquanto a conta estiver ativa + 30 dias após eliminação" },
                { tipo: "Dados de pagamento e faturação", prazo: "10 anos (obrigação fiscal legal em Portugal)" },
                { tipo: "Dados de analytics e logs", prazo: "12 meses" },
                { tipo: "Dados de leads (formulários de contacto)", prazo: "12 meses a partir da data de submissão" },
              ].map(({ tipo, prazo }) => (
                <div key={tipo} className="flex items-start justify-between gap-4 text-sm border-b border-[#E5E7EB] py-2 last:border-0">
                  <span className="text-[#0F172A] font-medium">{tipo}</span>
                  <span className="text-[#1F2937] text-right shrink-0">{prazo}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 8. Direitos do Titular */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-[#0F172A]">8. Os Seus Direitos</h2>
            <p className="text-sm text-[#1F2937]">
              Nos termos do RGPD (artigos 15.º a 22.º), tem os seguintes direitos:
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              {[
                { direito: "Direito de acesso", desc: "Obter confirmação e cópia dos seus dados pessoais que tratamos." },
                { direito: "Direito de retificação", desc: "Corrigir dados inexatos ou incompletos." },
                { direito: "Direito ao apagamento", desc: "Solicitar a eliminação dos seus dados (\"direito a ser esquecido\")." },
                { direito: "Direito à portabilidade", desc: "Receber os seus dados num formato estruturado e legível por máquina." },
                { direito: "Direito de oposição", desc: "Opor-se ao tratamento para fins de marketing direto ou interesses legítimos." },
                { direito: "Direito de limitação", desc: "Restringir o tratamento em determinadas circunstâncias." },
                { direito: "Direito de não sujeição a decisões automatizadas", desc: "Não ser sujeito a decisões baseadas exclusivamente em tratamento automatizado com efeitos significativos." },
                { direito: "Direito de retirar consentimento", desc: "Retirar o consentimento a qualquer momento, sem prejuízo do tratamento já realizado." },
              ].map(({ direito, desc }) => (
                <div key={direito} className="bg-[#FAF7F2] rounded-xl p-3 text-sm border border-[#E5E7EB]">
                  <p className="font-semibold text-[#0F172A] text-xs uppercase tracking-wide mb-1">{direito}</p>
                  <p className="text-[#1F2937] text-xs">{desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-[#C8A96B]/10 border border-[#C8A96B]/30 rounded-xl p-4 text-sm text-[#0F172A]">
              <p>
                Para exercer qualquer um destes direitos, envie um pedido por escrito para{" "}
                <a href="mailto:privacidade@vitrinepro.pt" className="text-[#C8A96B] font-medium hover:underline">
                  privacidade@vitrinepro.pt
                </a>
                . Responderemos no prazo máximo de <strong>30 dias</strong> (art. 12.º, n.º 3 RGPD).
              </p>
            </div>
          </section>

          {/* 9. CNPD */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-[#0F172A]">9. Direito de Reclamação junto da CNPD</h2>
            <p className="text-sm text-[#1F2937] leading-relaxed">
              Sem prejuízo de qualquer outro recurso administrativo ou judicial, tem o direito de apresentar reclamação junto da autoridade de controlo competente em Portugal:
            </p>
            <div className="bg-[#FAF7F2] border border-[#E5E7EB] rounded-xl p-4 text-sm space-y-1">
              <p className="font-semibold text-[#0F172A]">Comissão Nacional de Proteção de Dados (CNPD)</p>
              <p className="text-[#1F2937]">Av. D. Carlos I, 134, 1.º — 1200-651 Lisboa</p>
              <p className="text-[#1F2937]">Tel.: +351 213 928 400</p>
              <a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer" className="text-[#C8A96B] hover:underline">
                www.cnpd.pt →
              </a>
            </div>
          </section>

          {/* 10. Cookies */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-[#0F172A]">10. Cookies e Tecnologias Semelhantes</h2>
            <p className="text-sm text-[#1F2937] leading-relaxed">
              Utilizamos cookies estritamente necessários para o funcionamento da plataforma (autenticação, sessão). Não utilizamos cookies de rastreamento de terceiros sem o seu consentimento expresso.
            </p>
            <div className="space-y-2">
              {[
                { nome: "sb-access-token / sb-refresh-token", tipo: "Estritamente necessário", finalidade: "Manter a sessão autenticada (Supabase Auth)", duracao: "Sessão / 7 dias" },
                { nome: "__stripe_mid / __stripe_sid", tipo: "Estritamente necessário", finalidade: "Prevenção de fraude no checkout (Stripe)", duracao: "1 ano / sessão" },
              ].map(({ nome, tipo, finalidade, duracao }) => (
                <div key={nome} className="border border-[#E5E7EB] rounded-xl p-3 text-xs space-y-0.5">
                  <p className="font-semibold text-[#0F172A]">{nome}</p>
                  <p className="text-[#6B7280]"><strong>Tipo:</strong> {tipo}</p>
                  <p className="text-[#6B7280]"><strong>Finalidade:</strong> {finalidade}</p>
                  <p className="text-[#6B7280]"><strong>Duração:</strong> {duracao}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 11. Segurança */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-[#0F172A]">11. Segurança dos Dados</h2>
            <p className="text-sm text-[#1F2937] leading-relaxed">
              Implementamos medidas técnicas e organizacionais adequadas para proteger os seus dados pessoais contra acesso não autorizado, perda, destruição ou divulgação acidental, incluindo: transmissão via HTTPS/TLS, autenticação segura, controlo de acesso baseado em funções (RLS) e armazenamento cifrado de palavras-passe.
            </p>
          </section>

          {/* 12. Alterações */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-[#0F172A]">12. Alterações a Esta Política</h2>
            <p className="text-sm text-[#1F2937] leading-relaxed">
              Podemos atualizar esta política periodicamente. Quando o fizermos, atualizaremos a data de "última atualização" no topo desta página. Alterações materiais serão comunicadas por email com pelo menos 30 dias de antecedência.
            </p>
          </section>

          {/* Footer links */}
          <div className="border-t border-[#E5E7EB] pt-6 flex flex-wrap gap-4 text-sm">
            <Link href="/termos-de-servico" className="text-[#C8A96B] hover:underline">
              Termos de Serviço
            </Link>
            <Link href="/" className="text-[#1F2937] hover:text-[#C8A96B] transition-colors">
              VitrinePro
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
