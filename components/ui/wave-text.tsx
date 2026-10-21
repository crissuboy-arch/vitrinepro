"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";

interface AnimatedTextProps {
  text?: string;
  className?: string;
}

export function WaveText({ text = "Hover me", className = "" }: AnimatedTextProps) {
  // Acessibilidade (correção mobile 21/10/2026): com
  // prefers-reduced-motion, o texto renderiza estático (sem as
  // letras animadas em hover) — conteúdo idêntico, sem movimento.
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (reducedMotion) {
    return <span className={`inline-block${className ? ` ${className}` : ""}`}>{text}</span>;
  }

  return (
    <motion.span
      className={`inline-block cursor-pointer${className ? ` ${className}` : ""}`}
      whileHover="hover"
      initial="initial"
    >
      {text.split("").map((char, index) => (
        <motion.span
          key={index}
          className="inline-block"
          variants={{
            initial: { y: 0, scale: 1 },
            hover: {
              y: -4,
              scale: 1.15,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 15,
                delay: index * 0.03,
              },
            },
          }}
        >
          {char === " " ? " " : char}
        </motion.span>
      ))}
    </motion.span>
  );
}
