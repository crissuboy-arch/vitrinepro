/**
 * components/landing/SectorsMockup.tsx
 *
 * "Negócios reais. Todos os setores." (mockup aprovado): 6 cartões de
 * setor com as fotografias ilustrativas que o próprio mockup usa (já
 * usadas no site), faixa de factos do produto (sem números inventados)
 * e o bloco de demonstração do exemplo real Cantinho da Lu.
 *
 * CORREÇÃO VISUAL (21/10/2026, tarde): a demonstração passa a ser a
 * peça central desta secção (2.ª dobra), em todos os ecrãs, com o
 * MOCKUP DO TELEMÓVEL APROVADO pela Cristiane — ficheiro exato
 * `public/mockup-cantinho-da-lu.png` (byte a byte do asset que ela
 * forneceu; transparência preservada, sem cortes nem distorção). O
 * telemóvel desenhado em CSS que aqui estava foi removido. O bloco é
 * uma representação publicitária aprovada pela proprietária — a nota
 * junto ao link diz-lo, sem afirmar que é uma captura literal da
 * interface. Nome e link são os da Montra pública verdadeira dela
 * (publicada — presente no sitemap live). Sem avaliações nem
 * estatísticas inventadas.
 */

import Link from "next/link";
import Image from "next/image";

const CANTINHO_URL = "https://vitrinepro.digital/vitrine/cantinho-da-lu-1780338635504";

const SECTORS: { icon: string; name: string; text: string; q: string; img?: string }[] = [
  {
    icon: "🍴",
    name: "Restaurantes e Cafés",
    text: "Mostre o menu, horários e contactos.",
    q: "restaurante",
    img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=700&q=70",
  },
  {
    icon: "✂",
    name: "Salões de Beleza",
    text: "Apresente serviços e preços.",
    q: "salão de beleza",
    img: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=700&q=70",
  },
  {
    icon: "💈",
    name: "Barbearias",
    text: "Divulgue serviços e horários.",
    q: "barbearia",
    img: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=700&q=70",
  },
  {
    icon: "🛍",
    name: "Lojas e Comércio",
    text: "Catálogo online sempre atualizado.",
    q: "loja",
    img: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=700&q=70",
  },
  {
    icon: "🏋",
    name: "Ginásios e Fitness",
    text: "Planos, aulas e contactos.",
    q: "ginásio",
  },
  {
    icon: "✚",
    name: "Saúde e Bem-estar",
    text: "Serviços, horários e localização.",
    q: "saúde",
  },
];

const FACTS: { big: string; full: string; short: string }[] = [
  { big: "€0", full: "Plano Grátis para sempre", short: "Plano Grátis" },
  { big: "~5 min", full: "Para criar a sua Montra", short: "Para criar" },
  { big: "QR + Link", full: "Prontos para partilhar", short: "Para partilhar" },
  { big: "WhatsApp", full: "Contacto direto com clientes", short: "Contacto direto" },
];

export default function SectorsMockup() {
  return (
    <section id="setores" className="py-12 lg:py-24 border-t border-[#C8A96B]/[0.12] relative z-10">
      <div className="max-w-[1320px] mx-auto px-5 lg:px-10 text-center animate-fade-in-up">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#C8A96B]/[0.22] bg-[#C8A96B]/[0.06] text-[10px] lg:text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C8A96B]">
          Todos os negócios num só lugar
        </span>
        <h2 className="font-display font-bold text-[29px] lg:text-[clamp(34px,3.6vw,52px)] leading-[1.12] lg:leading-[1.1] mt-3.5 lg:mt-[18px] mb-2.5 lg:mb-3.5 text-[#F7F4EE]">
          Negócios reais. <span className="text-[#E6CB8C]">Todos os setores.</span>
        </h2>
        <p className="text-[#A9B1C3] text-[14.5px] lg:text-[17px] leading-[1.6] max-w-[720px] mx-auto">
          <span className="lg:hidden">Não é só para restaurantes. É para qualquer tipo de negócio.</span>
          <span className="hidden lg:inline">
            A VitrinePro é para qualquer tipo de negócio, não apenas restaurantes. Descubra as categorias em destaque.
          </span>
        </p>

        {/* Cartões de setor: carrossel horizontal em mobile, grelha em desktop */}
        <div className="flex lg:grid lg:grid-cols-6 gap-3.5 lg:gap-4 mt-[26px] lg:mt-[46px] overflow-x-auto lg:overflow-visible snap-x snap-mandatory lg:snap-none -mx-5 px-5 lg:mx-0 lg:px-0 pb-2 lg:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SECTORS.map((s) => (
            <Link
              key={s.name}
              href={`/explorar?q=${encodeURIComponent(s.q)}`}
              className="group relative flex-none w-[66%] sm:w-[40%] lg:w-auto snap-start rounded-[18px] lg:rounded-[20px] overflow-hidden aspect-[3/3.7] lg:aspect-[3/3.6] border border-[#C8A96B]/[0.22] bg-[#101A33] flex items-end text-left transition-all duration-300 hover:-translate-y-1.5 hover:border-[#C8A96B] hover:shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
            >
              {s.img && (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${s.img}), linear-gradient(135deg,#2a3355,#15203d)` }}
                />
              )}
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-[#070B14]/5 via-transparent to-[#070B14]/95" />
              <div className="relative z-[2] p-4 lg:p-[22px]">
                <div className="w-[38px] h-[38px] lg:w-[46px] lg:h-[46px] rounded-full bg-[#C8A96B] text-[#0A0D14] grid place-items-center text-base lg:text-xl mb-2 lg:mb-3">
                  {s.icon}
                </div>
                <h3 className="text-base lg:text-[19px] font-bold mb-1 lg:mb-1.5">{s.name}</h3>
                <p className="text-[12.5px] lg:text-[13.5px] text-[#cfd5e3] leading-[1.5]">{s.text}</p>
              </div>
            </Link>
          ))}
        </div>
        <div aria-hidden="true" className="flex lg:hidden justify-center gap-1.5 mt-2.5">
          <span className="w-[18px] h-1.5 rounded bg-[#C8A96B]" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/25" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/25" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/25" />
        </div>

        {/* Demonstração: exemplo real Cantinho da Lu com o mockup do
            telemóvel aprovado (asset exato, transparência preservada) */}
        <div className="mt-[30px] lg:mt-[70px] text-left p-[18px] lg:p-10 rounded-[20px] border border-[#C8A96B]/[0.22] bg-gradient-to-b from-[#101A33]/85 to-[#0B1224]/85 grid lg:grid-cols-[auto_1fr] gap-6 lg:gap-12 items-center">
          <div className="mx-auto lg:mx-0 w-[240px] sm:w-[280px] lg:w-[300px]">
            <Image
              src="/mockup-cantinho-da-lu.png"
              alt="Telemóvel com a Montra do Cantinho da Lu — mockup publicitário aprovado"
              width={941}
              height={1672}
              className="w-full h-auto drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)]"
              sizes="(min-width: 1024px) 300px, (min-width: 640px) 280px, 240px"
            />
          </div>

          <div>
            <span className="inline-block px-2.5 py-1 rounded-full bg-[#3dd68c]/[0.12] text-[#5be3a4] text-[11px] font-semibold border border-[#3dd68c]/30 mb-2.5">
              ● Exemplo real · uso autorizado
            </span>
            <h3 className="font-display font-bold text-2xl lg:text-4xl mb-1.5">Cantinho da Lu</h3>
            <p className="text-[13.5px] lg:text-base text-[#A9B1C3] leading-[1.6] max-w-[520px]">
              Uma Montra publicada, com dados reais. Veja como fica no telemóvel — e imagine a do seu negócio.
            </p>

            <a
              href={CANTINHO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-[15px] rounded-[13px] font-bold text-[15px] text-[#0A0D14] bg-gradient-to-b from-[#E3C98B] to-[#C8A96B] shadow-[0_8px_28px_rgba(200,169,107,0.28)] w-full sm:w-auto mt-5"
            >
              Ver Montra ao vivo →
            </a>
            <p className="text-[10.5px] text-[#E6CB8C]/85 break-all mt-2.5">
              vitrinepro.digital/vitrine/cantinho-da-lu-1780338635504
            </p>
            <p className="text-[10.5px] text-[#A9B1C3]/70 leading-[1.5] mt-2.5 max-w-[520px]">
              Mockup publicitário aprovado pela proprietária, a partir da Montra real dela. Os produtos, preços e
              fotografias atuais estão na Montra, no link acima. Sem avaliações nem estatísticas inventadas.
            </p>
          </div>
        </div>

        {/* Faixa de factos — só verdades do produto */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#C8A96B]/[0.22] border border-[#C8A96B]/[0.22] rounded-[18px] lg:rounded-[20px] overflow-hidden mt-[26px] lg:mt-[70px]">
          {FACTS.map((f) => (
            <div key={f.big} className="bg-[#101A33] px-2 py-[18px] lg:p-7 text-center">
              <b className="block font-display font-bold text-[22px] lg:text-[30px] text-[#E6CB8C] mb-1 lg:mb-1.5">{f.big}</b>
              <span className="text-[11.5px] lg:text-[13px] text-[#A9B1C3]">
                <span className="lg:hidden">{f.short}</span>
                <span className="hidden lg:inline">{f.full}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
