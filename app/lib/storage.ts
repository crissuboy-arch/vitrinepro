import { supabase } from "./supabase";

const BUCKET_NAME = "business-media";

export async function uploadBusinessImage(
  file: File,
  businessId: string,
  type: "logo" | "cover" | "gallery"
): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${businessId}/${type}-${Date.now()}.${fileExt}`;
  
  try {
    // Check if bucket exists, create if not
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);
    
    if (!bucketExists) {
      console.log("[STORAGE] Creating bucket:", BUCKET_NAME);
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
        fileSizeLimit: 5242880, // 5MB
      });
      
      if (createError) {
        console.error("[STORAGE] Failed to create bucket:", createError.message);
        return "";
      }
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("[STORAGE] Upload error:", error.message);
      return "";
    }

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (err) {
    console.error("[STORAGE] Upload exception:", err);
    return "";
  }
}

export async function deleteBusinessImage(url: string): Promise<void> {
  if (!url) return;
  
  const path = url.split("/storage/v1/object/public/business-media/")[1];
  if (!path) return;

  try {
    const { error } = await supabase.storage
      .from("business-media")
      .remove([path]);

    if (error) {
      console.error("[STORAGE] Delete error:", error.message);
    }
  } catch (err) {
    console.error("[STORAGE] Delete exception:", err);
  }
}

export async function checkStorageBucket(): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error("[STORAGE] List buckets error:", error);
      return false;
    }
    return data?.some(b => b.id === 'business-media') || false;
  } catch {
    return false;
  }
}
