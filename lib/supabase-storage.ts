import { supabase } from "@/app/lib/supabase";
import { mapStorageUploadError } from "./storage-upload-guard";

// A2: only allow real image types and cap the size, so SVGs/HTML/binaries
// can't be uploaded to the public buckets and storage can't be abused.
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Vídeo promocional: só formatos de vídeo correntes; limite maior porque
// um vídeo vertical pesa mais do que uma imagem (bucket próprio).
const ALLOWED_VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_VIDEO_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

interface UploadOptions {
  allowedMimeTypes?: string[];
  maxFileSize?: number;
  typeLabel?: string;
  sizeLabel?: string;
  /** Rótulo usado na mensagem de erro de permissão ("imagens" por omissão). */
  errorLabel?: string;
}

/**
 * Uploads a file to a specific Supabase storage bucket.
 */
async function uploadFile(
  bucketName: string,
  file: File,
  businessId: string,
  opts: UploadOptions = {}
): Promise<string> {
  const allowedMimeTypes = opts.allowedMimeTypes ?? ALLOWED_MIME_TYPES;
  const maxFileSize = opts.maxFileSize ?? MAX_FILE_SIZE;
  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error(
      `Tipo de ficheiro não permitido. Usa ${opts.typeLabel ?? "imagens JPG, PNG, WEBP ou GIF"}.`
    );
  }
  if (file.size > maxFileSize) {
    throw new Error(`Ficheiro demasiado grande. O limite é ${opts.sizeLabel ?? "5 MB"}.`);
  }

  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filePath = `${businessId}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    throw mapStorageUploadError(bucketName, uploadError.message, opts.errorLabel);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Uploads business logo to the 'vitrine-logos' bucket.
 */
export async function uploadLogo(file: File, businessId: string): Promise<string> {
  return uploadFile("vitrine-logos", file, businessId);
}

/**
 * Uploads business cover image to the 'vitrine-covers' bucket.
 */
export async function uploadCover(file: File, businessId: string): Promise<string> {
  return uploadFile("vitrine-covers", file, businessId);
}

/**
 * Uploads business gallery image to the 'vitrine-gallery' bucket.
 */
export async function uploadGallery(file: File, businessId: string): Promise<string> {
  return uploadFile("vitrine-gallery", file, businessId);
}

/**
 * Uploads product image to the 'vitrine-products' bucket.
 */
export async function uploadProductImage(file: File, businessId: string): Promise<string> {
  return uploadFile("vitrine-products", file, businessId);
}

/**
 * Uploads a "Novidade" cover image. A6.5 — reuses the 'vitrine-products'
 * bucket and the exact same `{business_id}/...` ownership path, so the
 * canonical storage RLS (vp_storage_owner_insert / vp_storage_public_read)
 * applies unchanged — no RLS modification needed.
 */
export async function uploadNovidadeImage(file: File, businessId: string): Promise<string> {
  return uploadFile("vitrine-products", file, businessId);
}

/**
 * Uploads a promo video to the 'vitrine-videos' bucket (migration
 * 20261028000023: bucket + RLS; sem ela, o upload falha com mensagem
 * clara). Mesmo caminho `{business_id}/...` das imagens, por isso a
 * RLS de ownership aplica-se sem alterações de lógica.
 */
export async function uploadPromoVideo(file: File, businessId: string): Promise<string> {
  return uploadFile("vitrine-videos", file, businessId, {
    allowedMimeTypes: ALLOWED_VIDEO_MIME_TYPES,
    maxFileSize: MAX_VIDEO_FILE_SIZE,
    typeLabel: "vídeos MP4, WEBM ou MOV",
    sizeLabel: "50 MB",
    errorLabel: "vídeos",
  });
}

/**
 * Upload do vídeo promocional por URL assinada (rota servidor).
 * O servidor verifica a sessão + propriedade da Montra e emite um token
 * de uso único p/ um caminho exato; o ficheiro vai direto do browser p/
 * o Supabase (sem passar pelo Vercel). Usado porque o upload direto é
 * rejeitado pela RLS mesmo p/ a dona (ver app/api/promo-video/upload-url).
 * Devolve a URL pública do ficheiro, como uploadPromoVideo.
 */
export async function uploadPromoVideoSigned(
  file: File,
  businessId: string
): Promise<string> {
  if (!ALLOWED_VIDEO_MIME_TYPES.includes(file.type)) {
    throw new Error(
      `Tipo de ficheiro não permitido. Usa vídeos MP4, WEBM ou MOV.`
    );
  }
  if (file.size > MAX_VIDEO_FILE_SIZE) {
    throw new Error(`Ficheiro demasiado grande. O limite é 50 MB.`);
  }
  const res = await fetch("/api/promo-video/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ businessId, fileType: file.type }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.path || !body?.token) {
    throw new Error(
      body?.error || `Não foi possível preparar o upload (HTTP ${res.status}).`
    );
  }
  const { error: uploadError } = await supabase.storage
    .from("vitrine-videos")
    .uploadToSignedUrl(body.path, body.token, file, {
      contentType: file.type,
    });
  if (uploadError) {
    throw new Error(uploadError.message);
  }
  const {
    data: { publicUrl },
  } = supabase.storage.from("vitrine-videos").getPublicUrl(body.path);
  return publicUrl;
}

/**
 * Uploads a promo video thumbnail. Reutiliza o bucket 'vitrine-covers'
 * (imagem, 5 MB) e NÃO insere nada em `gallery_images` — a miniatura
 * é só a URL guardada na coluna promo_video_thumbnail_url, nunca aparece
 * na galeria pública.
 */
export async function uploadPromoThumbnail(file: File, businessId: string): Promise<string> {
  return uploadFile("vitrine-covers", file, businessId);
}
