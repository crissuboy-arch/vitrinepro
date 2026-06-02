// scripts/generate-og.mjs
// Gera public/og-default.png — 1200x630px, fundo #0F172A, texto "VitrinePro" centralizado
import sharp from "sharp";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const outputPath = join(__dirname, "..", "public", "og-default.png");

// SVG template com fundo #0F172A e texto dourado centralizado
const svgContent = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="1200" height="630" fill="#0F172A"/>

  <!-- Subtle gradient overlay -->
  <defs>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1E293B" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#0F172A" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <ellipse cx="600" cy="315" rx="500" ry="280" fill="url(#glow)"/>

  <!-- Decorative line top -->
  <rect x="0" y="0" width="1200" height="4" fill="#C8A96B"/>
  <!-- Decorative line bottom -->
  <rect x="0" y="626" width="1200" height="4" fill="#C8A96B"/>

  <!-- Logo / Brand name -->
  <text
    x="600"
    y="295"
    font-family="Georgia, serif"
    font-size="96"
    font-weight="bold"
    fill="#C8A96B"
    text-anchor="middle"
    dominant-baseline="middle"
    letter-spacing="6"
  >VitrinePro</text>

  <!-- Tagline -->
  <text
    x="600"
    y="390"
    font-family="Arial, Helvetica, sans-serif"
    font-size="28"
    fill="#94A3B8"
    text-anchor="middle"
    dominant-baseline="middle"
    letter-spacing="2"
  >O maior Pinterest de negócios locais em Portugal</text>

  <!-- Golden divider dot -->
  <circle cx="600" cy="340" r="3" fill="#C8A96B" opacity="0.6"/>
</svg>
`;

async function generateOG() {
  try {
    await sharp(Buffer.from(svgContent))
      .png()
      .toFile(outputPath);

    console.log(`✓ og-default.png gerado em: ${outputPath}`);
    console.log(`  Dimensões: 1200 × 630 px`);
  } catch (err) {
    console.error("Erro ao gerar og-default.png:", err.message);
    process.exit(1);
  }
}

generateOG();
