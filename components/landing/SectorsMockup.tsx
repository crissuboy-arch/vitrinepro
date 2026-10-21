/**
 * components/landing/SectorsMockup.tsx
 *
 * "Negócios reais. Todos os setores." (mockup aprovado): 6 cartões de
 * setor com as fotografias ilustrativas que o próprio mockup usa (já
 * usadas no site), faixa de factos do produto (sem números inventados)
 * e — só em mobile, como no mockup mobile — o bloco de destaque do
 * exemplo real Cantinho da Lu.
 *
 * Cantinho da Lu: nome/setor/cidade/produtos/preços reais e link para
 * a Montra pública verdadeira (publicada — presente no sitemap live).
 * A fotografia de capa é ilustrativa (a mesma aprovada na branch
 * feat/hero-ajuste); a nota do bloco diz-lo expressamente.
 */

import Link from "next/link";

const CANTINHO_URL = "https://vitrinepro.digital/vitrine/cantinho-da-lu-1780338635504";
const CANTINHO_COVER = "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80";

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
      <div className="max-w-[1320px] mx-auto px-5 lg:px-10 text-center">
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

        {/* Destaque mobile: exemplo real Cantinho da Lu (mockup mobile) */}
        <div className="lg:hidden mt-[30px] text-left p-[18px] rounded-[20px] border border-[#C8A96B]/[0.22] bg-gradient-to-b from-[#101A33]/85 to-[#0B1224]/85">
          <span className="inline-block px-2.5 py-1 rounded-full bg-[#3dd68c]/[0.12] text-[#5be3a4] text-[11px] font-semibold border border-[#3dd68c]/30 mb-2.5">
            ● Exemplo real · uso autorizado
          </span>
          <h3 className="font-display font-bold text-2xl mb-1.5">Cantinho da Lu</h3>
          <p className="text-[13.5px] text-[#A9B1C3] leading-[1.6]">
            Uma Montra publicada, com dados reais. Veja como fica no telemóvel.
          </p>

          <div aria-hidden="true" className="w-[58%] mx-auto my-4 rounded-[26px] border-[6px] border-[#1b2440] bg-[#05080f] shadow-[0_24px_50px_rgba(0,0,0,0.6),0_0_40px_rgba(200,169,107,0.12)] overflow-hidden">
            <div className="bg-[#0c1428] p-2 flex flex-col gap-[7px]">
              <img src={CANTINHO_COVER} alt="" className="rounded-lg aspect-[4/3] w-full object-cover" loading="lazy" />
              <p className="text-[11px] font-bold text-[#F7F4EE] px-1">Cantinho da Lu</p>
              <div className="px-1 space-y-1 text-[10px]">
                <p className="flex justify-between">
                  <span className="text-[#d3d9e6]">Coxinha no Cone</span>
                  <span className="text-[#E6CB8C] font-bold">€3,00</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-[#d3d9e6]">Coxinha Grande com Catupiry</span>
                  <span className="text-[#E6CB8C] font-bold">€2,50</span>
                </p>
              </div>
              <span className="block text-center text-[10px] font-semibold py-[7px] rounded-lg bg-[#1fa855] text-white">WhatsApp</span>
            </div>
          </div>

          <a
            href={CANTINHO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-5 py-[15px] rounded-[13px] font-bold text-[15px] text-[#0A0D14] bg-gradient-to-b from-[#E3C98B] to-[#C8A96B] shadow-[0_8px_28px_rgba(200,169,107,0.28)] w-full"
          >
            Ver Montra ao vivo →
          </a>
          <p className="text-[10.5px] text-[#E6CB8C]/85 break-all mt-2.5">
            vitrinepro.digital/vitrine/cantinho-da-lu-1780338635504
          </p>
          <p className="text-[10.5px] text-[#A9B1C3]/70 leading-[1.5] mt-2.5">
            Exemplo real de uma Montra publicada, com produtos e preços reais. Sem avaliações nem estatísticas
            inventadas; a fotografia de capa é ilustrativa.
          </p>
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
