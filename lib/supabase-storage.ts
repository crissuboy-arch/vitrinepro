import { supabase } from "@/app/lib/supabase";

// A2: only allow real image types and cap the size, so SVGs/HTML/binaries
// can't be uploaded to the public buckets and storage can't be abused.
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Uploads a file to a specific Supabase storage bucket.
 */
async function uploadFile(bucketName: string, file: File, businessId: string): Promise<string> {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error("Tipo de ficheiro não permitido. Usa imagens JPG, PNG, WEBP ou GIF.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Ficheiro demasiado grande. O limite é 5 MB.");
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
    throw new Error(`Erro no upload para o bucket ${bucketName}: ${uploadError.message}`);
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
 * Uploads a review photo to the 'vitrine-reviews' bucket (anonymous-friendly).
 * The caller should treat failures as non-fatal (submit the review without a photo).
 */
export async function uploadReviewPhoto(file: File, businessId: string): Promise<string> {
  return uploadFile("vitrine-reviews", file, businessId);
}
