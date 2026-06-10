"use client";
import React from "react";
import { motion } from "motion/react";

export const testimonialsList = [
  {
    text: "Tinha só Instagram e perdia clientes toda semana. Com a VitrinePro o meu salão aparece no Google e as marcações triplicaram.",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    name: "Carla Mendonça",
    role: "Salão de Beleza · Lisboa",
  },
  {
    text: "Em 5 minutos criei a página da minha tasca. Os clientes encontram o menu, o horário e o WhatsApp num só sítio.",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "José Ferreira",
    role: "Restaurante · Porto",
  },
  {
    text: "O catálogo em PDF é incrível. Envio para os clientes pelo WhatsApp e parece uma revista profissional.",
    image: "https://randomuser.me/api/portraits/women/68.jpg",
    name: "Ana Rodrigues",
    role: "Loja de Roupa · Braga",
  },
  {
    text: "Antes não aparecia em nenhuma pesquisa. Agora quando alguém procura 'barbearia em Setúbal' apareço logo.",
    image: "https://randomuser.me/api/portraits/men/45.jpg",
    name: "Miguel Santos",
    role: "Barbearia · Setúbal",
  },
  {
    text: "Nunca pensei que criar uma página profissional fosse tão simples. Recomendo a qualquer negócio local.",
    image: "https://randomuser.me/api/portraits/women/22.jpg",
    name: "Inês Oliveira",
    role: "Clínica Estética · Cascais",
  },
  {
    text: "O plano gratuito já deu para testar e ver resultados. Agora estou no Premium e vale cada cêntimo.",
    image: "https://randomuser.me/api/portraits/men/67.jpg",
    name: "Rui Costa",
    role: "Oficina Auto · Coimbra",
  },
  {
    text: "Os meus clientes adoram poder ver os produtos com foto e preço antes de vir à loja. As vendas aumentaram.",
    image: "https://randomuser.me/api/portraits/women/55.jpg",
    name: "Filipa Gomes",
    role: "Pastelaria · Faro",
  },
  {
    text: "Finalmente tenho uma presença online digna. A vitrine ficou melhor do que o site que me cobraram 800€.",
    image: "https://randomuser.me/api/portraits/men/11.jpg",
    name: "António Lopes",
    role: "Serralharia · Aveiro",
  },
  {
    text: "Uso o link da VitrinePro na bio do Instagram. Agora o cliente clica e tem tudo: morada, serviços, contacto.",
    image: "https://randomuser.me/api/portraits/women/33.jpg",
    name: "Sofia Martins",
    role: "Estúdio de Yoga · Almada",
  },
];

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: typeof testimonialsList;
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{ translateY: "-50%" }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-4 pb-4"
      >
        {[...new Array(2)].fill(0).map((_, index) => (
          <React.Fragment key={index}>
            {props.testimonials.map(({ text, image, name, role }, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl max-w-xs w-full"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(201,169,110,0.15)",
                  boxShadow: "0 4px 24px rgba(201,169,110,0.06)",
                }}
              >
                <p style={{ color: "#c9b99a", fontSize: "13px", lineHeight: "1.7", fontStyle: "italic" }}>
                  "{text}"
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <img
                    width={36}
                    height={36}
                    src={image}
                    alt={name}
                    className="rounded-full"
                    style={{ border: "1.5px solid #c9a96e" }}
                  />
                  <div>
                    <div style={{ color: "#f5f0e8", fontSize: "13px", fontWeight: 600 }}>{name}</div>
                    <div style={{ color: "#c9a96e", fontSize: "11px", opacity: 0.8 }}>{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};
