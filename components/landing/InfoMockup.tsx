/**
 * components/landing/InfoMockup.tsx
 *
 * Secções informativas da nova landing (mockup aprovado):
 * Problema, Funcionalidades e Como Funciona. Conforme o mockup
 * mobile, Problema e Como Funciona só aparecem em ecrãs médios/
 * grandes; Funcionalidades tem a versão condensada de 4 itens em
 * mobile e a grelha completa de 6 em desktop. Todos os textos são
 * os do mockup e descrevem funcionalidades reais do produto.
 */

const TAG =
  "inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#C8A96B]/[0.22] bg-[#C8A96B]/[0.06] text-[10px] lg:text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C8A96B]";
const H2 =
  "font-display font-bold text-[29px] lg:text-[clamp(34px,3.6vw,52px)] leading-[1.12] lg:leading-[1.1] mt-3.5 lg:mt-[18px] mb-2.5 lg:mb-3.5 text-[#F7F4EE]";
const LEAD = "text-[#A9B1C3] text-[14.5px] lg:text-[17px] leading-[1.6] max-w-[720px] mx-auto";
const SECTION = "py-12 lg:py-24 border-t border-[#C8A96B]/[0.12] relative z-10";
const WRAP = "max-w-[1320px] mx-auto px-5 lg:px-10 text-center animate-fade-in-up";

/* ── Problema ─────────────────────────────────────────── */

const PROBLEMS = [
  { title: "O Instagram não organiza produtos", text: "Posts perdem-se no feed e os preços ficam por DM." },
  { title: "O cliente não encontra preços", text: "Sem informação clara, desiste ou vai à concorrência." },
  { title: "O WhatsApp fica perdido na bio", text: "Falta um link único que reúna tudo." },
];

export function ProblemMockup() {
  return (
    <section className={`${SECTION} hidden md:block`}>
      <div className={WRAP}>
        <span className={TAG}>O problema</span>
        <h2 className={H2}>
          Sem presença profissional, <span className="text-[#E6CB8C]">perde contactos.</span>
        </h2>
        <p className={LEAD}>Preços por mensagem, fotos perdidas no Instagram e nenhum catálogo atualizado.</p>
        <div className="grid md:grid-cols-3 gap-4 mt-11 text-left">
          {PROBLEMS.map((p) => (
            <div key={p.title} className="p-[22px] rounded-2xl border border-white/[0.08] bg-white/[0.02] text-[14.5px] text-[#d6dbe8] leading-[1.55]">
              <b className="block text-[#F7F4EE] text-[15.5px] mb-1.5">{p.title}</b>
              {p.text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Funcionalidades ──────────────────────────────────── */

const FEATURES = [
  { icon: "▦", title: "Montra personalizada", text: "Produtos, serviços, fotos e horários num endereço seu." },
  { icon: "✆", title: "Contactos diretos", text: "Botão de WhatsApp, chamadas e localização." },
  { icon: "◎", title: "Descoberta local", text: "Apareça no Explorar para quem procura perto de si." },
  { icon: "▤", title: "Catálogo PDF", text: "Gere um catálogo elegante, pronto a enviar (Pro)." },
  { icon: "⌘", title: "QR Code e link curto", text: "Para balcão, cartões de visita e redes sociais." },
  { icon: "✎", title: "Gestão simples", text: "Edite tudo no dashboard, sem programadores." },
];

const FEATURES_MOBILE = [
  { title: "Montra personalizada", text: "Produtos, serviços, fotos e horários." },
  { title: "Contactos diretos", text: "WhatsApp, chamadas e localização." },
  { title: "Descoberta local", text: "Seja encontrado perto de si." },
  { title: "Catálogo PDF · QR Code", text: "Prontos para enviar e partilhar." },
];

export function FeaturesMockup() {
  return (
    <section className={SECTION}>
      <div className={WRAP}>
        <span className={TAG}>
          <span className="md:hidden">Funcionalidades</span>
          <span className="hidden md:inline">Mais do que uma lista de negócios</span>
        </span>
        <h2 className={H2}>
          Tudo o que o seu negócio precisa, <span className="text-[#E6CB8C]">num só lugar.</span>
        </h2>
        <p className={`${LEAD} hidden md:block`}>Ferramentas simples para apresentar e divulgar o seu negócio.</p>

        {/* Desktop: grelha de 6 */}
        <div className="hidden md:grid md:grid-cols-3 xl:grid-cols-6 gap-3.5 mt-[46px] text-left">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="p-5 rounded-[18px] border border-[#C8A96B]/[0.22] bg-gradient-to-b from-[#101A33]/80 to-[#0B1224]/80"
            >
              <span className="grid place-items-center w-[46px] h-[46px] rounded-xl bg-[#C8A96B]/[0.12] text-[#E6CB8C] text-xl mb-4">
                {f.icon}
              </span>
              <h3 className="text-[15px] font-bold mb-2">{f.title}</h3>
              <p className="text-[12.5px] text-[#A9B1C3] leading-[1.6]">{f.text}</p>
            </div>
          ))}
        </div>

        {/* Mobile: lista condensada de 4 */}
        <div className="md:hidden grid gap-3 mt-6 text-left">
          {FEATURES_MOBILE.map((f) => (
            <div key={f.title} className="p-4 rounded-[14px] border border-[#C8A96B]/[0.22] bg-[#101A33]/60 text-[13px] text-[#A9B1C3] leading-[1.5]">
              <b className="block text-[#F7F4EE] text-[15px] mb-1">{f.title}</b>
              {f.text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Como funciona ────────────────────────────────────── */

const STEPS = [
  // A menção ao cartão foi removida (limpeza de repetições 21/10/2026):
  // a frase passa a viver num único sítio — a secção de Planos.
  { title: "Crie a conta", text: "Registo simplificado." },
  { title: "Adicione o negócio", text: "Nome, categoria, contactos e horários." },
  { title: "Publique produtos e serviços", text: "Fotos, descrições e preços." },
  { title: "Partilhe a sua Montra", text: "Link, QR Code e redes sociais." },
];

export function StepsMockup() {
  return (
    <section id="como" className={`${SECTION} hidden md:block`}>
      <div className={WRAP}>
        <span className={TAG}>Como funciona</span>
        <h2 className={H2}>
          Online em <span className="text-[#E6CB8C]">4 passos.</span>
        </h2>
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-[22px] mt-[50px] text-left">
          {STEPS.map((s, i) => (
            <div key={s.title} className="p-7 rounded-[18px] border border-[#C8A96B]/[0.22] bg-[#101A33]/55">
              <span className="grid place-items-center w-[38px] h-[38px] rounded-full bg-[#C8A96B] text-[#0A0D14] font-extrabold mb-4">
                {i + 1}
              </span>
              <h3 className="text-[17px] font-bold mb-2">{s.title}</h3>
              <p className="text-sm text-[#A9B1C3] leading-[1.6]">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
