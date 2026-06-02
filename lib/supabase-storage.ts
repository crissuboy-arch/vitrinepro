import { supabase } from "@/app/lib/supabase";

/**
 * Uploads a file to a specific Supabase storage bucket.
 */
async function uploadFile(bucketName: string, file: File, businessId: string): Promise<string> {
  const fileExt = file.name.split(".").pop() || "jpg";
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
