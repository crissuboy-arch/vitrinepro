"use client";
import { motion } from "motion/react";
import { TestimonialsColumn, testimonialsList } from "@/components/ui/testimonials-columns";

const firstColumn = testimonialsList.slice(0, 3);
const secondColumn = testimonialsList.slice(3, 6);
const thirdColumn = testimonialsList.slice(6, 9);

export default function TestimonialsSection() {
  return (
    <section style={{ background: "#080b12", padding: "80px 0", position: "relative" }}>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center text-center mb-12"
        >
          <div
            style={{
              border: "1px solid rgba(201,169,110,0.3)",
              color: "#c9a96e",
              fontSize: "11px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              padding: "6px 16px",
              borderRadius: "999px",
              marginBottom: "20px",
            }}
          >
            Depoimentos Reais
          </div>
          <h2
            style={{
              fontFamily: "serif",
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: 700,
              color: "#f5f0e8",
              lineHeight: 1.2,
              marginBottom: "16px",
            }}
          >
            Negócios locais em Portugal que deixaram de ser{" "}
            <span style={{ color: "#c9a96e", fontStyle: "italic" }}>invisíveis online.</span>
          </h2>
          <p style={{ color: "#888", fontSize: "15px", maxWidth: "480px", lineHeight: 1.7 }}>
            Empresas reais. Resultados reais. Clientes reais.
          </p>
        </motion.div>

        <div
          className="flex justify-center gap-4"
          style={{
            maskImage: "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
            maxHeight: "680px",
            overflow: "hidden",
          }}
        >
          <TestimonialsColumn testimonials={firstColumn} duration={18} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={22} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={16} />
        </div>
      </div>
    </section>
  );
}
