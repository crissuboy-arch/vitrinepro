// Catálogo de tipos de botão + biblioteca de presets de estilo.
// Adaptado de Montra (src/components/buttons/buttonPresets.ts).
// Só dados — sem dependências além dos tipos.

import type { ButtonStyle, ButtonType } from "@/types/buttons";

export interface ButtonCatalogItem {
  type: ButtonType;
  name: string;
  category:
    | "Redes Sociais"
    | "Mensagens & Chamadas"
    | "Pagamentos"
    | "Agendamentos & Formulários"
    | "Outros & Links";
  defaultLabel: string;
  defaultSublabel?: string;
  iconName: string;
  defaultUrl: string;
  brandColor: string;
  brandTextColor: string;
}

export const BUTTON_CATALOG: ButtonCatalogItem[] = [
  { type: "whatsapp", name: "WhatsApp", category: "Mensagens & Chamadas", defaultLabel: "Enviar mensagem no WhatsApp", defaultSublabel: "Atendimento rápido e direto", iconName: "MessageSquare", defaultUrl: "https://wa.me/351912345678", brandColor: "#25D366", brandTextColor: "#FFFFFF" },
  { type: "instagram", name: "Instagram", category: "Redes Sociais", defaultLabel: "Siga-nos no Instagram", defaultSublabel: "@sua.marca", iconName: "Instagram", defaultUrl: "https://instagram.com", brandColor: "#E1306C", brandTextColor: "#FFFFFF" },
  { type: "facebook", name: "Facebook", category: "Redes Sociais", defaultLabel: "Página do Facebook", defaultSublabel: "Acompanhe as novidades", iconName: "Facebook", defaultUrl: "https://facebook.com", brandColor: "#1877F2", brandTextColor: "#FFFFFF" },
  { type: "tiktok", name: "TikTok", category: "Redes Sociais", defaultLabel: "Vídeos no TikTok", defaultSublabel: "@sua.marca", iconName: "Video", defaultUrl: "https://tiktok.com", brandColor: "#000000", brandTextColor: "#FFFFFF" },
  { type: "youtube", name: "YouTube", category: "Redes Sociais", defaultLabel: "Canal do YouTube", defaultSublabel: "Inscreva-se", iconName: "Youtube", defaultUrl: "https://youtube.com", brandColor: "#FF0000", brandTextColor: "#FFFFFF" },
  { type: "linkedin", name: "LinkedIn", category: "Redes Sociais", defaultLabel: "Perfil no LinkedIn", defaultSublabel: "Rede profissional", iconName: "Linkedin", defaultUrl: "https://linkedin.com", brandColor: "#0A66C2", brandTextColor: "#FFFFFF" },
  { type: "telegram", name: "Telegram", category: "Mensagens & Chamadas", defaultLabel: "Canal oficial do Telegram", defaultSublabel: "Comunidade exclusiva", iconName: "Send", defaultUrl: "https://t.me", brandColor: "#229ED9", brandTextColor: "#FFFFFF" },
  { type: "twitter", name: "X (Twitter)", category: "Redes Sociais", defaultLabel: "Siga no X (Twitter)", defaultSublabel: "Atualizações em tempo real", iconName: "Twitter", defaultUrl: "https://x.com", brandColor: "#000000", brandTextColor: "#FFFFFF" },
  { type: "threads", name: "Threads", category: "Redes Sociais", defaultLabel: "Siga no Threads", defaultSublabel: "@sua.marca", iconName: "AtSign", defaultUrl: "https://threads.net", brandColor: "#101010", brandTextColor: "#FFFFFF" },
  { type: "pinterest", name: "Pinterest", category: "Redes Sociais", defaultLabel: "Inspiração no Pinterest", defaultSublabel: "Ver coleções", iconName: "Pin", defaultUrl: "https://pinterest.com", brandColor: "#BD081C", brandTextColor: "#FFFFFF" },
  { type: "discord", name: "Discord", category: "Redes Sociais", defaultLabel: "Entrar no servidor do Discord", defaultSublabel: "Comunidade VIP", iconName: "Headphones", defaultUrl: "https://discord.gg", brandColor: "#5865F2", brandTextColor: "#FFFFFF" },
  { type: "twitch", name: "Twitch", category: "Redes Sociais", defaultLabel: "Assistir às lives na Twitch", defaultSublabel: "Transmissões ao vivo", iconName: "Tv", defaultUrl: "https://twitch.tv", brandColor: "#9146FF", brandTextColor: "#FFFFFF" },
  { type: "spotify", name: "Spotify", category: "Redes Sociais", defaultLabel: "Ouvir playlist no Spotify", defaultSublabel: "Seleção musical exclusiva", iconName: "Music", defaultUrl: "https://spotify.com", brandColor: "#1DB954", brandTextColor: "#FFFFFF" },
  { type: "snapchat", name: "Snapchat", category: "Redes Sociais", defaultLabel: "Adicionar no Snapchat", defaultSublabel: "Histórias diárias", iconName: "Camera", defaultUrl: "https://snapchat.com", brandColor: "#FFFC00", brandTextColor: "#000000" },

  { type: "google_business", name: "Google Negócios", category: "Outros & Links", defaultLabel: "Ficha do Google Negócios", defaultSublabel: "Avaliações e informações", iconName: "Globe", defaultUrl: "https://business.google.com", brandColor: "#4285F4", brandTextColor: "#FFFFFF" },
  { type: "google_maps", name: "Google Maps", category: "Outros & Links", defaultLabel: "Ver localização / como chegar", defaultSublabel: "Navegação GPS", iconName: "MapPin", defaultUrl: "https://maps.google.com", brandColor: "#EA4335", brandTextColor: "#FFFFFF" },
  { type: "google_reviews", name: "Avaliações Google", category: "Outros & Links", defaultLabel: "Deixar avaliação no Google (5★)", defaultSublabel: "Apoie o nosso negócio", iconName: "Star", defaultUrl: "https://g.page/r", brandColor: "#FBBC05", brandTextColor: "#000000" },
  { type: "website", name: "Website oficial", category: "Outros & Links", defaultLabel: "Visitar website oficial", defaultSublabel: "www.suaempresa.pt", iconName: "Globe", defaultUrl: "https://suaempresa.pt", brandColor: "#0B1B33", brandTextColor: "#FFFFFF" },
  { type: "online_store", name: "Loja online", category: "Outros & Links", defaultLabel: "Comprar na loja online", defaultSublabel: "Entregas para todo o país", iconName: "ShoppingBag", defaultUrl: "https://loja.suaempresa.pt", brandColor: "#059669", brandTextColor: "#FFFFFF" },
  { type: "email", name: "Email direto", category: "Mensagens & Chamadas", defaultLabel: "Enviar email de contacto", defaultSublabel: "geral@suaempresa.pt", iconName: "Mail", defaultUrl: "mailto:geral@suaempresa.pt", brandColor: "#DC2626", brandTextColor: "#FFFFFF" },
  { type: "call", name: "Telefone / Chamada", category: "Mensagens & Chamadas", defaultLabel: "Ligar diretamente", defaultSublabel: "+351 912 345 678", iconName: "Phone", defaultUrl: "tel:+351912345678", brandColor: "#2563EB", brandTextColor: "#FFFFFF" },

  { type: "mbway", name: "MB WAY", category: "Pagamentos", defaultLabel: "Pagar com MB WAY", defaultSublabel: "Pagamento instantâneo seguro", iconName: "Smartphone", defaultUrl: "#mbway", brandColor: "#E11D48", brandTextColor: "#FFFFFF" },
  { type: "pix", name: "PIX (Brasil)", category: "Pagamentos", defaultLabel: "Pagamento via PIX", defaultSublabel: "Chave instantânea", iconName: "QrCode", defaultUrl: "#pix", brandColor: "#32BCAD", brandTextColor: "#FFFFFF" },
  { type: "stripe", name: "Stripe / Cartão", category: "Pagamentos", defaultLabel: "Pagar com cartão (Stripe)", defaultSublabel: "Visa, Mastercard & Amex", iconName: "CreditCard", defaultUrl: "#stripe", brandColor: "#635BFF", brandTextColor: "#FFFFFF" },
  { type: "paypal", name: "PayPal", category: "Pagamentos", defaultLabel: "Pagar via PayPal", defaultSublabel: "Proteção ao comprador", iconName: "DollarSign", defaultUrl: "https://paypal.me", brandColor: "#003087", brandTextColor: "#FFFFFF" },

  { type: "book", name: "Agendar online", category: "Agendamentos & Formulários", defaultLabel: "Agendar horário online", defaultSublabel: "Marcação em 1 minuto", iconName: "Calendar", defaultUrl: "#agendar", brandColor: "#0B1B33", brandTextColor: "#FFFFFF" },
  { type: "calendly", name: "Calendly", category: "Agendamentos & Formulários", defaultLabel: "Marcar reunião no Calendly", defaultSublabel: "Escolha o melhor horário", iconName: "CalendarCheck", defaultUrl: "https://calendly.com", brandColor: "#006BFF", brandTextColor: "#FFFFFF" },
  { type: "google_calendar", name: "Google Calendar", category: "Agendamentos & Formulários", defaultLabel: "Adicionar ao Google Agenda", defaultSublabel: "Evento / lembrete", iconName: "CalendarDays", defaultUrl: "https://calendar.google.com", brandColor: "#4285F4", brandTextColor: "#FFFFFF" },
  { type: "form", name: "Formulário", category: "Agendamentos & Formulários", defaultLabel: "Preencher formulário de contacto", defaultSublabel: "Pedir orçamento rápido", iconName: "FileText", defaultUrl: "#contacto", brandColor: "#7C3AED", brandTextColor: "#FFFFFF" },
  { type: "manychat", name: "ManyChat", category: "Mensagens & Chamadas", defaultLabel: "Iniciar chat automático", defaultSublabel: "Assistente virtual 24/7", iconName: "Bot", defaultUrl: "https://m.me", brandColor: "#0084FF", brandTextColor: "#FFFFFF" },

  { type: "catalog", name: "Catálogo / Menu", category: "Outros & Links", defaultLabel: "Ver menu & catálogo", defaultSublabel: "Produtos e preços", iconName: "BookOpen", defaultUrl: "#catalogo", brandColor: "#B45309", brandTextColor: "#FFFFFF" },
  { type: "divider", name: "Separador de secção", category: "Outros & Links", defaultLabel: "As nossas redes sociais", defaultSublabel: "", iconName: "Minus", defaultUrl: "", brandColor: "#64748B", brandTextColor: "#14181F" },
  { type: "custom", name: "Botão personalizado", category: "Outros & Links", defaultLabel: "Link personalizado", defaultSublabel: "Descrição opcional", iconName: "Link", defaultUrl: "https://", brandColor: "#0B1B33", brandTextColor: "#FFFFFF" },
];

export interface ButtonPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  previewBg: string;
  style: Partial<ButtonStyle>;
}

export const BUTTON_PRESETS: ButtonPreset[] = [
  { id: "apple", name: "Apple Glass & Precision", category: "Apple", description: "Estilo clean da Apple, cantos arredondados e fundo fosco.", previewBg: "#F5F5F7", style: { bgColor: "rgba(255,255,255,0.85)", textColor: "#1D1D1F", iconColor: "#0071E3", borderColor: "rgba(0,0,0,0.08)", borderWidth: "1px", borderRadius: "rounded-full", useGradient: false, shadow: "md", opacity: 1, paddingX: "px-5", paddingY: "py-3.5", fontWeight: "font-semibold", fontSize: "text-sm", animation: "hover-scale" } },
  { id: "minimal", name: "Minimal Clean Slate", category: "Minimal", description: "Design escandinavo ultra-limpo, borda subtil.", previewBg: "#FFFFFF", style: { bgColor: "#FFFFFF", textColor: "#0F172A", iconColor: "#475569", borderColor: "#E2E8F0", borderWidth: "1px", borderRadius: "rounded-2xl", useGradient: false, shadow: "sm", opacity: 1, paddingX: "px-5", paddingY: "py-3.5", fontWeight: "font-medium", fontSize: "text-sm", animation: "none" } },
  { id: "material", name: "Material You 3.0", category: "Material", description: "Google Material Design, cantos suaves e sombra elevada.", previewBg: "#F3F4F6", style: { bgColor: "#10B981", textColor: "#FFFFFF", iconColor: "#FFFFFF", borderColor: "transparent", borderWidth: "0px", borderRadius: "rounded-2xl", useGradient: false, shadow: "lg", opacity: 1, paddingX: "px-6", paddingY: "py-4", fontWeight: "font-bold", fontSize: "text-sm", animation: "ripple" } },
  { id: "glass", name: "Glassmorphism Frosted", category: "Glass", description: "Vidro translúcido com brilho de fundo.", previewBg: "#0F172A", style: { bgColor: "rgba(255,255,255,0.12)", textColor: "#FFFFFF", iconColor: "#38BDF8", borderColor: "rgba(255,255,255,0.25)", borderWidth: "1px", borderRadius: "rounded-2xl", useGradient: false, shadow: "glow", glowColor: "rgba(56,189,248,0.4)", opacity: 0.95, paddingX: "px-6", paddingY: "py-3.5", fontWeight: "font-semibold", fontSize: "text-sm", animation: "hover-glow" } },
  { id: "luxury", name: "Luxury Velvet & Gold", category: "Luxury", description: "Preto profundo com contorno a ouro polido.", previewBg: "#090B10", style: { bgColor: "#141821", textColor: "#FFFFFF", iconColor: "#C8AA59", borderColor: "#C8AA59", borderWidth: "1.5px", borderRadius: "rounded-xl", useGradient: false, shadow: "glow", glowColor: "rgba(200,170,89,0.3)", opacity: 1, paddingX: "px-6", paddingY: "py-4", fontWeight: "font-semibold", fontSize: "text-sm", fontFamily: "serif", animation: "glow" } },
  { id: "rose_gold", name: "Rose Gold Metallic", category: "Rose Gold", description: "Gradiente metalizado rosa champanhe.", previewBg: "#FFF9F5", style: { bgColor: "#C7898D", textColor: "#FFFFFF", iconColor: "#FFFFFF", borderColor: "#F0D5D7", borderWidth: "1px", borderRadius: "rounded-full", useGradient: true, gradientStart: "#E09B9F", gradientEnd: "#B37377", gradientDir: "to-r", shadow: "md", opacity: 1, paddingX: "px-6", paddingY: "py-3.5", fontWeight: "font-bold", fontSize: "text-sm", animation: "hover-scale" } },
  { id: "gold", name: "Imperial Gold Sheen", category: "Gold", description: "Gradiente dourado brilhante de alto impacto.", previewBg: "#111827", style: { bgColor: "#D97706", textColor: "#000000", iconColor: "#000000", borderColor: "#FDE68A", borderWidth: "1px", borderRadius: "rounded-2xl", useGradient: true, gradientStart: "#FBBF24", gradientEnd: "#B45309", gradientDir: "to-r", shadow: "xl", glowColor: "rgba(251,191,36,0.4)", opacity: 1, paddingX: "px-6", paddingY: "py-4", fontWeight: "font-black", fontSize: "text-sm", animation: "pulse" } },
  { id: "corporate", name: "Corporate Navy Deep", category: "Corporate", description: "Azul marinho institucional sólido.", previewBg: "#F8FAFC", style: { bgColor: "#0B1B33", textColor: "#FFFFFF", iconColor: "#C6A15B", borderColor: "#1E293B", borderWidth: "1px", borderRadius: "rounded-xl", useGradient: false, shadow: "md", opacity: 1, paddingX: "px-6", paddingY: "py-3.5", fontWeight: "font-bold", fontSize: "text-sm", animation: "none" } },
  { id: "dark", name: "Dark Cyber Slate", category: "Dark", description: "Cinza carvão de alto contraste com ícones brilhantes.", previewBg: "#020617", style: { bgColor: "#1E293B", textColor: "#F8FAFC", iconColor: "#38BDF8", borderColor: "#334155", borderWidth: "1px", borderRadius: "rounded-2xl", useGradient: false, shadow: "lg", opacity: 1, paddingX: "px-6", paddingY: "py-3.5", fontWeight: "font-semibold", fontSize: "text-sm", animation: "float" } },
  { id: "light", name: "Light Soft Paper", category: "Light", description: "Fundo creme suave com texto escuro.", previewBg: "#F5EBE1", style: { bgColor: "#FFFFFF", textColor: "#2D2421", iconColor: "#4D1F2A", borderColor: "#EFE5D8", borderWidth: "1px", borderRadius: "rounded-2xl", useGradient: false, shadow: "sm", opacity: 1, paddingX: "px-6", paddingY: "py-3.5", fontWeight: "font-semibold", fontSize: "text-sm", animation: "none" } },
  { id: "neon", name: "Cyberpunk Neon Glow", category: "Neon", description: "Cores néon elétricas com brilho pulsante.", previewBg: "#030712", style: { bgColor: "#090D16", textColor: "#22D3EE", iconColor: "#F43F5E", borderColor: "#06B6D4", borderWidth: "2px", borderRadius: "rounded-2xl", useGradient: false, shadow: "glow", glowColor: "#06B6D4", glowIntensity: "high", opacity: 1, paddingX: "px-6", paddingY: "py-4", fontWeight: "font-bold", fontSize: "text-sm", animation: "neon" } },
  { id: "premium", name: "Velvet Emerald Premium", category: "Premium", description: "Verde esmeralda sofisticado com acentos dourados.", previewBg: "#F2F9F5", style: { bgColor: "#0F5132", textColor: "#FFFFFF", iconColor: "#C6A15B", borderColor: "#198754", borderWidth: "1px", borderRadius: "rounded-2xl", useGradient: true, gradientStart: "#146C43", gradientEnd: "#0A3622", gradientDir: "to-r", shadow: "lg", opacity: 1, paddingX: "px-6", paddingY: "py-4", fontWeight: "font-bold", fontSize: "text-sm", animation: "hover-shadow" } },
  { id: "elegant", name: "Bordeaux Wine Elegant", category: "Elegant", description: "Tom vinho bordeaux com toque editorial.", previewBg: "#FAF4EA", style: { bgColor: "#4D1F2A", textColor: "#FAF4EA", iconColor: "#C6A15B", borderColor: "#6B2D3C", borderWidth: "1px", borderRadius: "rounded-xl", useGradient: false, shadow: "md", opacity: 1, paddingX: "px-6", paddingY: "py-3.5", fontWeight: "font-semibold", fontSize: "text-sm", fontFamily: "serif", animation: "hover-scale" } },
  { id: "creator", name: "Creator Gradient Vibe", category: "Creator", description: "Gradiente vibrante estilo Instagram / TikTok.", previewBg: "#18181B", style: { bgColor: "#833AB4", textColor: "#FFFFFF", iconColor: "#FFFFFF", borderColor: "transparent", borderWidth: "0px", borderRadius: "rounded-full", useGradient: true, gradientStart: "#833AB4", gradientEnd: "#FD1D1D", gradientDir: "to-r", shadow: "xl", opacity: 1, paddingX: "px-6", paddingY: "py-4", fontWeight: "font-extrabold", fontSize: "text-sm", animation: "bounce" } },
  { id: "beauty", name: "Pastel Beauty Spa", category: "Beauty", description: "Tons lavanda e rosa para salões e spas.", previewBg: "#FFF5F7", style: { bgColor: "#FCE7F3", textColor: "#831843", iconColor: "#DB2777", borderColor: "#FBCFE8", borderWidth: "1px", borderRadius: "rounded-full", useGradient: false, shadow: "sm", opacity: 1, paddingX: "px-6", paddingY: "py-3.5", fontWeight: "font-semibold", fontSize: "text-sm", animation: "hover-scale" } },
  { id: "restaurant", name: "Terracotta Gourmet", category: "Restaurant", description: "Cores quentes terracota/âmbar para restaurantes.", previewBg: "#FFFBEB", style: { bgColor: "#B45309", textColor: "#FFFFFF", iconColor: "#FDE68A", borderColor: "#92400E", borderWidth: "1px", borderRadius: "rounded-2xl", useGradient: true, gradientStart: "#D97706", gradientEnd: "#78350F", gradientDir: "to-r", shadow: "lg", opacity: 1, paddingX: "px-6", paddingY: "py-4", fontWeight: "font-bold", fontSize: "text-sm", animation: "pulse" } },
  { id: "construction", name: "Industrial Heavy Duty", category: "Construction", description: "Amarelo e cinza chumbo de alta visibilidade.", previewBg: "#18181B", style: { bgColor: "#EAB308", textColor: "#0F172A", iconColor: "#0F172A", borderColor: "#CA8A04", borderWidth: "2px", borderRadius: "rounded-md", useGradient: false, shadow: "md", opacity: 1, paddingX: "px-6", paddingY: "py-3.5", fontWeight: "font-black", fontSize: "text-sm", animation: "none" } },
  { id: "healthcare", name: "Medical Clean Cyan", category: "Healthcare", description: "Menta e ciano estéreis para clínicas e saúde.", previewBg: "#F0FDFA", style: { bgColor: "#0D9488", textColor: "#FFFFFF", iconColor: "#CCFBF1", borderColor: "#0F766E", borderWidth: "1px", borderRadius: "rounded-2xl", useGradient: false, shadow: "md", opacity: 1, paddingX: "px-6", paddingY: "py-3.5", fontWeight: "font-bold", fontSize: "text-sm", animation: "hover-scale" } },
  { id: "education", name: "Academic Indigo", category: "Education", description: "Índigo erudito com acabamento sóbrio.", previewBg: "#EEF2FF", style: { bgColor: "#3730A3", textColor: "#FFFFFF", iconColor: "#C7D2FE", borderColor: "#312E81", borderWidth: "1px", borderRadius: "rounded-2xl", useGradient: false, shadow: "lg", opacity: 1, paddingX: "px-6", paddingY: "py-3.5", fontWeight: "font-bold", fontSize: "text-sm", animation: "none" } },
  { id: "business", name: "Business Growth Blue", category: "Business", description: "Azul dinâmico de conversão rápida.", previewBg: "#F0F4F9", style: { bgColor: "#2563EB", textColor: "#FFFFFF", iconColor: "#93C5FD", borderColor: "#1D4ED8", borderWidth: "1px", borderRadius: "rounded-xl", useGradient: true, gradientStart: "#3B82F6", gradientEnd: "#1E40AF", gradientDir: "to-r", shadow: "xl", opacity: 1, paddingX: "px-6", paddingY: "py-4", fontWeight: "font-extrabold", fontSize: "text-sm", animation: "hover-scale" } },
];

/** Estilo aplicado a botões novos criados a partir do catálogo. */
export function catalogItemToStyle(item: ButtonCatalogItem): Partial<ButtonStyle> {
  return {
    bgColor: item.brandColor,
    textColor: item.brandTextColor,
    iconColor: item.brandTextColor,
    borderColor: "transparent",
    borderWidth: "0px",
    borderRadius: "rounded-2xl",
    shadow: "md",
    animation: "hover-scale",
    opacity: 1,
  };
}
