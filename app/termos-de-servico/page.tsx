import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Serviço | VitrinePro",
  description: "Termos e condições gerais de utilização da plataforma VitrinePro.",
  robots: { index: true, follow: true },
};

export default function TermosDeServicoPag() {
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
            <h1 className="text-3xl font-display font-bold text-[#0F172A]">Termos de Serviço</h1>
            <p className="text-sm text-[#6B7280]">Última atualização: {lastUpdated}</p>
            <p className="text-sm text-[#1F2937] leading-relaxed pt-2">
              Ao criar uma conta ou utilizar a plataforma VitrinePro, aceita os presentes Termos de Serviço. Leia-os atentamente. Se não concordar com alguma disposição, não deve utilizar o serviço.
            </p>
          </div>

          {/* 1. Identificação */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-[#0F172A]">1. Identificação do Prestador</h2>
            <div className="bg-[#FAF7F2] rounded-xl p-4 space-y-1 text-sm text-[#1F2937]">
              <p><strong>Denominação:</strong> VitrinePro</p>
              <p><strong>País de estabelecimento:</strong> Portugal</p>
              <p><strong>Email:</strong> <a href="mailto:suporte@vitrinepro.pt" className="text-[#C8A96B] hover:underline">suporte@vitrinepro.pt</a></p>
              <p><strong>Website:</strong> <a href="https://vitrinepro.pt" className="text-[#C8A96B] hover:underline">vitrinepro.pt</a></p>
            </div>
          </section>

          {/* 2. Descrição */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-[#0F172A]">2. Descrição do Serviço</h2>
            <p className="text-sm text-[#1F2937] leading-relaxed">
              A VitrinePro é uma plataforma SaaS (<em>Software as a Service</em>) que permite a criação e gestão de vitrines digitais para pequenos negócios e profissionais. O serviço inclui:
            </p>
            <ul className="space-y-1.5">
              {[
                "Criação de uma página pública personalizada para o negócio (vitrine digital)",
                "Publicação no diretório/marketplace da VitrinePro",
                "Gestão de produtos, serviços, galeria de imagens e testemunhos",
                "Integração com WhatsApp para contacto direto de clientes",
                "Planos pagos com funcionalidades avançadas (analytics, destaque, chatbot IA)",
              ].map(item => (
                <li key={item} className="text-sm text-[#1F2937] flex items-start gap-2">
                  <span className="text-[#C8A96B] font-bold flex-shrink-0 mt-0.5">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* 3. Registo e Conta */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-[#0F172A]">3. Registo e Conta de Utilizador</h2>
            <div className="space-y-2 text-sm text-[#1F2937]">
              <p><strong>3.1</strong> Para utilizar o serviço, deve criar uma conta com um endereço de email válido e uma palavra-passe segura.</p>
              <p><strong>3.2</strong> É responsável pela confidencialidade das suas credenciais e por todas as atividades realizadas na sua conta.</p>
              <p><strong>3.3</strong> Deve ter pelo menos 18 anos de idade ou a maioridade legal aplicável no seu país de residência para criar uma conta.</p>
              <p><strong>3.4</strong> Não é permitida a criação de contas múltiplas para o mesmo negócio ou para contornar restrições do serviço.</p>
              <p><strong>3.5</strong> A VitrinePro reserva-se o direito de suspender ou encerrar contas que violem estes termos.</p>
            </div>
          </section>

          {/* 4. Planos e Preços */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-[#0F172A]">4. Planos de Subscrição e Pagamentos</h2>
            <div className="space-y-3">
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { plano: "Grátis", preco: "€0/mês", desc: "Acesso às funcionalidades base sem limite de tempo." },
                  { plano: "Premium", preco: "€12/mês", desc: "Analytics, destaque no marketplace, chatbot IA e galeria ilimitada." },
                  { plano: "Business", preco: "€29,90/mês", desc: "Todas as funcionalidades Premium mais destaque prioritário e link curto personalizado." },
                ].map(({ plano, preco, desc }) => (
                  <div key={plano} className="border border-[#E5E7EB] rounded-xl p-4 text-sm">
                    <p className="font-bold text-[#0F172A]">{plano}</p>
                    <p className="text-[#C8A96B] font-semibold mt-0.5">{preco}</p>
                    <p className="text-[#6B7280] text-xs mt-1">{desc}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-sm text-[#1F2937]">
                <p><strong>4.1</strong> Os pagamentos são processados pela Stripe, Inc. e cobrados com a periodicidade escolhida (mensal ou anual).</p>
                <p><strong>4.2</strong> As subscrições renovam-se automaticamente no final de cada período, salvo cancelamento antes da data de renovação.</p>
                <p><strong>4.3</strong> Os preços indicados incluem o IVA à taxa legal em vigor em Portugal (quando aplicável).</p>
                <p><strong>4.4</strong> Em caso de alteração de preços, os clientes existentes serão notificados com pelo menos 30 dias de antecedência.</p>
              </div>
            </div>
          </section>

          {/* 5. Direito de Resolução */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-[#0F172A]">5. Cancelamento e Direito de Resolução</h2>
            <div className="bg-[#C8A96B]/10 border border-[#C8A96B]/30 rounded-xl p-4 text-sm text-[#0F172A] mb-3">
              <p className="font-semibold mb-1">Direito de livre resolução (art. 10.º do DL n.º 24/2014, de 14 de fevereiro)</p>
              <p className="text-[#1F2937]">
                Os consumidores têm o direito de resolver o contrato no prazo de <strong>14 dias</strong> a contar da data de celebração, sem necessidade de indicar o motivo, salvo se o serviço tiver sido integralmente prestado antes do término desse prazo com o consentimento expresso do utilizador.
              </p>
            </div>
            <div className="space-y-2 text-sm text-[#1F2937]">
              <p><strong>5.1 Cancelamento pelo utilizador:</strong> Pode cancelar a sua subscrição a qualquer momento a partir do painel de controlo (Dashboard → Cancelar Assinatura). O cancelamento tem efeito no fim do período de faturação em curso, mantendo acesso às funcionalidades pagas até essa data.</p>
              <p><strong>5.2 Sem reembolso por período parcial:</strong> Salvo nos casos previstos no ponto 5.3, não são emitidos reembolsos por períodos de subscrição não utilizados após o cancelamento voluntário.</p>
              <p><strong>5.3 Exceções:</strong> Reembolso integral nos primeiros 14 dias (direito de resolução) ou em caso de falha técnica grave imputável à VitrinePro que impeça a utilização do serviço por mais de 72 horas consecutivas.</p>
              <p><strong>5.4 Cancelamento pela VitrinePro:</strong> A VitrinePro pode suspender ou encerrar a conta, com aviso prévio de 30 dias, em caso de violação dos presentes termos. Em caso de violação grave, a suspensão pode ser imediata. Nesses casos, é emitido reembolso proporcional ao período não utilizado.</p>
              <p><strong>5.5 Para exercer o direito de resolução</strong>, envie email para <a href="mailto:suporte@vitrinepro.pt" className="text-[#C8A96B] hover:underline">suporte@vitrinepro.pt</a> com o assunto "Resolução de Contrato" indicando o email da conta.</p>
            </div>
          </section>

          {/* 6. Obrigações do Utilizador */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-[#0F172A]">6. Obrigações e Conduta do Utilizador</h2>
            <p className="text-sm text-[#1F2937]">O utilizador compromete-se a não utilizar a plataforma para:</p>
            <ul className="space-y-1.5">
              {[
                "Publicar conteúdo falso, enganoso, difamatório ou que viole direitos de terceiros",
                "Comercializar produtos ou serviços ilegais ou que violem a legislação portuguesa e da União Europeia",
                "Carregar imagens, vídeos ou textos com conteúdo pornográfico, violento ou discriminatório",
                "Praticar spam, phishing ou qualquer forma de comunicação não solicitada",
                "Tentar aceder indevidamente a contas de outros utilizadores ou a sistemas da plataforma",
                "Efetuar engenharia reversa, descompilar ou copiar o código da plataforma",
                "Criar contas de forma automatizada ou usar bots para interagir com o serviço",
              ].map(item => (
                <li key={item} className="text-sm text-[#1F2937] flex items-start gap-2">
                  <span className="text-red-400 flex-shrink-0 mt-0.5">✗</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* 7. Conteúdos */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-[#0F172A]">7. Propriedade Intelectual e Conteúdos</h2>
            <div className="space-y-2 text-sm text-[#1F2937]">
              <p><strong>7.1</strong> O utilizador mantém todos os direitos sobre o conteúdo que publica (imagens, textos, logótipos do seu negócio).</p>
              <p><strong>7.2</strong> Ao publicar conteúdo na plataforma, concede à VitrinePro uma licença não exclusiva, gratuita e mundial para exibir esse conteúdo no âmbito da prestação do serviço.</p>
              <p><strong>7.3</strong> O código, design, marca e demais elementos da plataforma VitrinePro são propriedade exclusiva da VitrinePro e estão protegidos por direitos de autor e demais legislação aplicável.</p>
              <p><strong>7.4</strong> O utilizador declara que tem os direitos necessários sobre todo o conteúdo publicado, isentando a VitrinePro de qualquer responsabilidade por violação de direitos de terceiros.</p>
            </div>
          </section>

          {/* 8. Disponibilidade */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-[#0F172A]">8. Disponibilidade do Serviço</h2>
            <div className="space-y-2 text-sm text-[#1F2937]">
              <p><strong>8.1</strong> A VitrinePro enviada esforços comercialmente razoáveis para manter a plataforma disponível 24 horas por dia, 7 dias por semana.</p>
              <p><strong>8.2</strong> Podem ocorrer interrupções programadas para manutenção, anunciadas com antecedência sempre que possível.</p>
              <p><strong>8.3</strong> A VitrinePro não garante disponibilidade ininterrupta e não se responsabiliza por perdas resultantes de interrupções temporárias do serviço, salvo nos casos previstos no ponto 5.3.</p>
            </div>
          </section>

          {/* 9. Limitação de Responsabilidade */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-[#0F172A]">9. Limitação de Responsabilidade</h2>
            <div className="space-y-2 text-sm text-[#1F2937]">
              <p><strong>9.1</strong> A VitrinePro fornece a plataforma "tal como está" (<em>as is</em>) e não garante que o serviço satisfaça todos os requisitos específicos do utilizador.</p>
              <p><strong>9.2</strong> A VitrinePro não se responsabiliza por: (i) perda de dados causada por utilização incorreta da plataforma; (ii) lucros cessantes; (iii) danos indiretos ou consequentes.</p>
              <p><strong>9.3</strong> A responsabilidade total da VitrinePro perante qualquer utilizador, em qualquer período de 12 meses, não excederá o valor pago pelo utilizador durante esse período.</p>
              <p><strong>9.4</strong> Estas limitações não se aplicam a casos de dolo ou negligência grave da VitrinePro, nem a direitos irrenunciáveis ao abrigo da legislação de proteção do consumidor aplicável.</p>
            </div>
          </section>

          {/* 10. Proteção de Dados */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-[#0F172A]">10. Proteção de Dados Pessoais</h2>
            <p className="text-sm text-[#1F2937] leading-relaxed">
              O tratamento de dados pessoais realizado no âmbito da utilização da plataforma rege-se pela nossa{" "}
              <Link href="/politica-privacidade" className="text-[#C8A96B] hover:underline font-medium">
                Política de Privacidade
              </Link>
              , que faz parte integrante dos presentes termos e foi elaborada em conformidade com o RGPD e a Lei n.º 58/2019, de 8 de agosto.
            </p>
          </section>

          {/* 11. Comunicações */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-[#0F172A]">11. Comunicações Eletrónicas</h2>
            <div className="space-y-2 text-sm text-[#1F2937]">
              <p><strong>11.1</strong> Ao criar uma conta, aceita receber emails transacionais necessários ao funcionamento do serviço (confirmação de conta, faturas, notificações de segurança).</p>
              <p><strong>11.2</strong> Emails de marketing e newsletters são opcionais e pode cancelar a subscrição em qualquer momento através da hiperligação de cancelamento presente em cada email.</p>
              <p><strong>11.3</strong> Comunicações contratuais formais serão enviadas para o endereço de email associado à sua conta.</p>
            </div>
          </section>

          {/* 12. Alterações aos Termos */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-[#0F172A]">12. Alterações aos Termos</h2>
            <div className="space-y-2 text-sm text-[#1F2937]">
              <p><strong>12.1</strong> A VitrinePro pode alterar estes termos a qualquer momento. Alterações materiais serão notificadas por email com pelo menos 30 dias de antecedência.</p>
              <p><strong>12.2</strong> A continuação da utilização da plataforma após a data de entrada em vigor das alterações constitui aceitação dos novos termos.</p>
              <p><strong>12.3</strong> Se não concordar com as alterações, pode cancelar a conta antes da data de entrada em vigor sem penalização.</p>
            </div>
          </section>

          {/* 13. Resolução de Litígios */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-[#0F172A]">13. Resolução de Litígios</h2>
            <div className="space-y-2 text-sm text-[#1F2937]">
              <p><strong>13.1</strong> Em caso de litígio, o utilizador pode recorrer ao Centro de Arbitragem de Conflitos de Consumo (CACCL) ou a outro mecanismo de resolução alternativa de litígios (RAL) conforme a legislação em vigor.</p>
              <p><strong>13.2</strong> A Comissão Europeia disponibiliza uma plataforma de resolução de litígios em linha em:{" "}
                <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-[#C8A96B] hover:underline">
                  ec.europa.eu/consumers/odr
                </a>
              </p>
              <p><strong>13.3 Lei aplicável:</strong> Os presentes termos são regidos pela lei portuguesa. Os tribunais portugueses têm competência para dirimir quaisquer litígios resultantes da interpretação ou execução destes termos, sem prejuízo das normas imperativas de proteção do consumidor aplicáveis.</p>
            </div>
          </section>

          {/* 14. Disposições Gerais */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-[#0F172A]">14. Disposições Gerais</h2>
            <div className="space-y-2 text-sm text-[#1F2937]">
              <p><strong>14.1</strong> Se qualquer disposição destes termos for considerada inválida ou inaplicável, as restantes disposições mantêm-se em pleno vigor.</p>
              <p><strong>14.2</strong> A não exercício de qualquer direito pela VitrinePro não constitui renúncia a esse direito.</p>
              <p><strong>14.3</strong> Estes termos constituem o acordo integral entre o utilizador e a VitrinePro relativamente à utilização da plataforma, substituindo quaisquer acordos anteriores sobre o mesmo objeto.</p>
            </div>
          </section>

          {/* Footer links */}
          <div className="border-t border-[#E5E7EB] pt-6 flex flex-wrap gap-4 text-sm">
            <Link href="/politica-privacidade" className="text-[#C8A96B] hover:underline">
              Política de Privacidade
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
