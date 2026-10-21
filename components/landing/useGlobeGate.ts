"use client";

import { useEffect, useState } from "react";

/**
 * Gate de performance do globo Three.js (~863KB) na nova landing:
 * o WebGL só monta em ecrãs largos (≥1024px), onde a "stage" desktop
 * da hero/CTA final existe. É a mesma regra desktop-only da hero atual
 * (useIsDesktop em HeroSection, limiar 768px), com o limiar alinhado ao
 * breakpoint da nova composição (a stage desktop só aparece em lg).
 * Em mobile/tablet o globo NÃO é carregado — o glow radial CSS e o
 * dot grid mantêm o visual, sem custo de GPU/JS.
 */
export function useGlobeGate() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setEnabled(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setEnabled(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return enabled;
}
