/**
 * tests/video-demo.test.ts — vídeo de demonstração da landing
 *
 * Guarda a substituição do player falso da VideoSection pelo vídeo real
 * editado pela Cristiane: asset local, poster do próprio vídeo, clique
 * explícito para reproduzir e controlos nativos após o arranque.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const read = (p: string) => readFileSync(join(__dirname, "..", p), "utf8");

describe("VideoSection — demonstração real", () => {
  it("usa um elemento video com o asset e o poster locais", () => {
    const src = read("components/landing/VideoSection.tsx");
    assert.match(src, /<video\b/);
    assert.ok(src.includes('poster="/video-demo-vitrinepro-poster.jpg"'));
    assert.ok(src.includes('<source src="/video-demo-vitrinepro.mp4" type="video/mp4" />'));
  });

  it("só reproduz após clique e revela os controlos nativos", () => {
    const src = read("components/landing/VideoSection.tsx");
    assert.ok(src.includes("onClick={startPlayback}"));
    assert.match(src, /videoRef\.current\?\.play\(\)/);
    assert.ok(src.includes("controls={playing}"));
    assert.ok(src.includes("playsInline"));
    assert.ok(!src.includes("autoPlay"), "sem autoplay");
  });

  it("não mantém o placeholder 'em breve'", () => {
    const src = read("components/landing/VideoSection.tsx");
    assert.ok(!src.includes("Vídeo demonstrativo em breve."));
  });

  it("os ficheiros servidos pela própria app existem e não estão vazios", () => {
    const video = statSync(join(__dirname, "../public/video-demo-vitrinepro.mp4"));
    const poster = statSync(join(__dirname, "../public/video-demo-vitrinepro-poster.jpg"));
    assert.ok(video.size > 1_000_000, `vídeo demasiado pequeno: ${video.size}`);
    assert.ok(poster.size > 10_000, `poster demasiado pequeno: ${poster.size}`);
  });
});
