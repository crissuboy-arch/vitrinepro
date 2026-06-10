"use client";
import { motion } from "motion/react";

interface AnimatedTextProps {
  text?: string;
  className?: string;
}

export function WaveText({ text = "Hover me", className = "" }: AnimatedTextProps) {
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
