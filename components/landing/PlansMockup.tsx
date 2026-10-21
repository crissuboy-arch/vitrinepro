/**
 * components/landing/PlansMockup.tsx
 *
 * Planos da nova landing (mockup aprovado), VERIFICADOS contra a
 * fonte de verdade lib/plans.ts e contra a PlansSection atual:
 *  - Grátis €0: link público ✓, "Até 3 produtos" ✓ (maxProducts: 3),
 *    botão WhatsApp ✓, horários e localização ✓ (lista da FAQ atual).
 *  - Pro €12/mês: produtos e serviços ilimitados ✓ (maxProducts: null),
 *    Catálogo PDF ✓ (FAQ atual: PDF nos planos pagos), "Mais
 *    visibilidade no Explorar" ✓ (lib/ranking.ts: +200 de score para
 *    planos pagos), "Cancele quando quiser" ✓ (cancel_at_period_end).
 *  - Business €29,90/mês: SEM CTA de compra e com o selo "Em breve ·
 *    não disponível para nova contratação" ✓ (BUSINESS_CHECKOUT_ENABLED
 *    = false). DIVERGÊNCIA do mockup registada: onde o mockup dizia
 *    "Para equipas e várias localizações", o código não tem esses
 *    entitlements — substituído pelas vantagens reais do plano
 *    (tudo do Pro + funcionalidades avançadas e máximo destaque,
 *    cf. PlansSection atual e lib/plans.ts: onlineStore/chatbot).
 * Preços e Stripe INTOCADOS: o CTA do Pro usa o fluxo existente
 * (onSelectPlan da página → checkout atual).
 */

import Link from "next/link";

interface PlansMockupProps {
  onSelectPlan: (planId: string) => void;
}

const TAG =
  "inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#C8A96B]/[0.22] bg-[#C8A96B]/[0.06] text-[10px] lg:text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C8A96B]";
const CARD =
  "p-[22px] lg:p-[34px] rounded-[20px] lg:rounded-[22px] border border-[#C8A96B]/[0.22] bg-[#101A33]/60 text-left flex flex-col";
const PLAN_NAME = "text-xs lg:text-sm font-bold tracking-[0.2em] uppercase text-[#E6CB8C]";
const PRICE = "font-display font-bold text-[40px] lg:text-[52px] mt-2 lg:mt-3.5 mb-1";
const PRICE_SMALL = "font-sans text-sm lg:text-[15px] text-[#A9B1C3] font-normal";
const LIST = "list-none mt-3 lg:mt-[22px] mb-4 lg:mb-7 grid gap-2 lg:gap-[11px] text-[13.5px] lg:text-[14.5px] text-[#d6dbe8] flex-1";
const BTN_GHOST =
  "inline-flex items-center justify-center gap-2.5 px-[30px] py-4 rounded-[14px] font-bold text-[15px] text-[#F7F4EE] bg-white/[0.03] border border-white/[0.22] transition-all duration-300 hover:border-[#C8A96B] w-full";
const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2.5 px-[30px] py-4 rounded-[14px] font-bold text-[15px] text-[#0A0D14] bg-gradient-to-b from-[#E3C98B] to-[#C8A96B] shadow-[0_10px_36px_rgba(200,169,107,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_44px_rgba(200,169,107,0.4)] w-full cursor-pointer";

function Item({ children }: { children: React.ReactNode }) {
  return (
    <li>
      <span className="text-[#C8A96B] font-bold mr-2.5">✓</span>
      {children}
    </li>
  );
}

export default function PlansMockup({ onSelectPlan }: PlansMockupProps) {
  return (
    <section id="planos" className="py-12 lg:py-24 border-t border-[#C8A96B]/[0.12] relative z-10">
      <div className="max-w-[1320px] mx-auto px-5 lg:px-10 text-center">
        <span className={TAG}>Planos</span>
        <h2 className="font-display font-bold text-[29px] lg:text-[clamp(34px,3.6vw,52px)] leading-[1.12] lg:leading-[1.1] mt-3.5 lg:mt-[18px] mb-2.5 lg:mb-3.5 text-[#F7F4EE]">
          Comece grátis. <span className="text-[#E6CB8C]">Cresça quando quiser.</span>
        </h2>

        <div className="grid lg:grid-cols-3 gap-4 lg:gap-6 mt-4 lg:mt-[52px] items-stretch text-left">
          {/* Grátis */}
          <div className={CARD}>
            <h3 className={PLAN_NAME}>Grátis</h3>
            <div className={PRICE}>
              €0<small className={PRICE_SMALL}> /sempre</small>
            </div>
            <ul className={`${LIST} hidden lg:grid`}>
              <Item>Montra com link público</Item>
              <Item>Até 3 produtos</Item>
              <Item>Botão WhatsApp</Item>
              <Item>Horários e localização</Item>
            </ul>
            <ul className={`${LIST} lg:hidden`}>
              <Item>Montra com link público</Item>
              <Item>Até 3 produtos</Item>
              <Item>WhatsApp e horários</Item>
            </ul>
            <Link href="/register" className={BTN_GHOST}>
              Criar Montra Grátis
            </Link>
          </div>

          {/* Pro */}
          <div className={`${CARD} !border-[#C8A96B] bg-gradient-to-b from-[#C8A96B]/[0.12] to-[#101A33]/80 shadow-[0_0_70px_rgba(200,169,107,0.12)]`}>
            <h3 className={PLAN_NAME}>Pro ✦</h3>
            <div className={PRICE}>
              €12<small className={PRICE_SMALL}> /mês</small>
            </div>
            <ul className={`${LIST} hidden lg:grid`}>
              <Item>Produtos e serviços ilimitados</Item>
              <Item>Catálogo PDF</Item>
              <Item>Mais visibilidade no Explorar</Item>
              <Item>Cancele quando quiser</Item>
            </ul>
            <ul className={`${LIST} lg:hidden`}>
              <Item>Produtos e serviços ilimitados</Item>
              <Item>Catálogo PDF</Item>
            </ul>
            <button type="button" onClick={() => onSelectPlan("pro")} className={BTN_PRIMARY}>
              Ativar Pro
            </button>
          </div>

          {/* Business — fase 2: sem contratação nova */}
          <div className={`${CARD} opacity-75`}>
            <h3 className={PLAN_NAME}>Business</h3>
            <div className={PRICE}>
              €29,90<small className={PRICE_SMALL}> /mês</small>
            </div>
            <ul className={LIST}>
              <Item>Tudo do Pro +</Item>
              <Item>Funcionalidades avançadas</Item>
              <Item>Máximo destaque no Explorar</Item>
            </ul>
            <span className="inline-block self-start px-3.5 py-1.5 rounded-full border border-dashed border-[#C8A96B]/[0.22] text-xs text-[#A9B1C3]">
              Em breve · não disponível para nova contratação
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
