/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/app/lib/supabase";
import { generateSlug } from "./utils";

export interface BusinessInput {
  user_id: string;
  name: string;
  slug?: string;
  description?: string;
  category?: string;
  city?: string;
  country?: string;
  address?: string;
  whatsapp?: string;
  phone?: string;
  email?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  linkedin?: string;
  website?: string;
  opening_hours?: Record<string, unknown>;
  logo_url?: string;
  cover_url?: string;
  cover_gradient?: string;
  published?: boolean;
  is_published?: boolean;
  category_id?: string;
  city_id?: string;
  type?: string;
  is_verified_store?: boolean;
  owner_origin_country?: string;
  [key: string]: unknown;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  price?: number;
  image_url?: string;
  order_index?: number;
  type?: string;
  slug?: string;
}

export interface Testimonial {
  id: string;
  business_id: string;
  author_name: string;
  text: string;
  rating: number;
  created_at: string;
}

export interface GalleryImage {
  id: string;
  business_id: string;
  image_url: string;
  order_index?: number;
}

export interface Business extends BusinessInput {
  id: string;
  created_at: string;
}

export interface BusinessWithDetails extends Business {
  products: Product[];
  testimonials: Testimonial[];
  gallery: GalleryImage[];
}

/**
 * Creates a new business in the database.
 * Generates a slug automatically if none is provided.
 */
export async function createBusiness(data: Partial<BusinessInput>): Promise<{ success: boolean; businessId?: string; error?: string }> {
  try {
    let slug = data.slug;
    if (!slug && data.name) {
      slug = await generateSlug(data.name);
    }

    const insertData = {
      ...data,
      slug,
    };

    // Remove is_published to avoid column-not-found errors on older DB schemas.
    // The column `published` is the authoritative field.
    delete (insertData as Record<string, unknown>).is_published;

    const { data: business, error } = await supabase
      .from("businesses")
      .insert(insertData)
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, businessId: business.id };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Erro desconhecido ao criar negócio";
    return { success: false, error: errorMsg };
  }
}

/**
 * Updates an existing business profile.
 */
export async function updateBusiness(businessId: string, data: Partial<BusinessInput>): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData = { ...data };

    // Remove is_published to avoid column-not-found errors on older DB schemas.
    delete (updateData as Record<string, unknown>).is_published;

    const { error } = await supabase
      .from("businesses")
      .update(updateData)
      .eq("id", businessId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Erro desconhecido ao atualizar negócio";
    return { success: false, error: errorMsg };
  }
}

/**
 * Fetches the business owned by a given user.
 */
export async function getMyBusiness(userId: string): Promise<Business | null> {
  try {
    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[DB] Error fetching my business:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("[DB] Exception fetching my business:", err);
    return null;
  }
}

/**
 * Fetches a business by its slug, including products, testimonials, and gallery images.
 */
export async function getBusinessBySlug(slug: string): Promise<BusinessWithDetails | null> {
  try {
    const { data: business, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !business) {
      if (error) console.error("[DB] Error fetching business by slug:", error);
      return null;
    }

    // Fetch related products, testimonials, and gallery images
    const [productsRes, testimonialsRes, galleryRes] = await Promise.all([
      supabase.from("products").select("*").eq("business_id", business.id).order("order_index"),
      supabase.from("testimonials").select("*").eq("business_id", business.id).order("created_at", { ascending: false }),
      supabase.from("gallery_images").select("*").eq("business_id", business.id).order("order_index"),
    ]);

    return {
      ...business,
      products: productsRes.data || [],
      testimonials: testimonialsRes.data || [],
      gallery: galleryRes.data || [],
    } as BusinessWithDetails;
  } catch (err) {
    console.error("[DB] Exception fetching business by slug:", err);
    return null;
  }
}

/**
 * Fetches all categories ordered by order_index and name.
 */
export async function getDbCategories(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("order_index", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("[DB] Error fetching categories:", err);
    return [];
  }
}

/**
 * Fetches all cities ordered by order_index and name.
 */
export async function getDbCities(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("cities")
      .select("*")
      .eq("is_active", true)
      .order("order_index", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("[DB] Error fetching cities:", err);
    return [];
  }
}

/**
 * Fetches businesses matching a specific city and category slug.
 */
export async function getBusinessesByCityAndCategory(
  citySlug: string,
  categorySlug: string
): Promise<{ city: any; category: any; businesses: any[] }> {
  try {
    // 1. Fetch city and category records by slug
    const [cityRes, catRes] = await Promise.all([
      supabase.from("cities").select("*").eq("slug", citySlug).maybeSingle(),
      supabase.from("categories").select("*").eq("slug", categorySlug).maybeSingle(),
    ]);

    const city = cityRes.data;
    const category = catRes.data;

    if (!city || !category) {
      return { city, category, businesses: [] };
    }

    // 2. Query businesses matching the city and category
    // Matching is done by name/id to support legacy and RLS structured data
    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("published", true)
      .or(`city_id.eq.${city.id},city.ilike.${city.name}`)
      .or(`category_id.eq.${category.id},category.ilike.%${category.name}%`)
      .order("plan", { ascending: false });

    if (error) throw error;
    return { city, category, businesses: data || [] };
  } catch (err) {
    console.error("[DB] Error fetching businesses by city/category:", err);
    return { city: null, category: null, businesses: [] };
  }
}

/**
 * Fetches marketplace products (physical & digital) with business info, optionally filtered by category slug.
 */
export async function getMarketplaceProducts(
  categorySlug?: string,
  limit = 24,
  offset = 0
): Promise<{ products: any[]; hasMore: boolean }> {
  try {
    let query = supabase
      .from("products")
      .select("*, businesses!inner(id, name, slug, published, is_published, plan, logo_url, category_id, city, is_verified_store)")
      .eq("businesses.published", true);

    if (categorySlug && categorySlug !== "todas") {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", categorySlug)
        .maybeSingle();

      if (cat) {
        query = query.eq("businesses.category_id", cat.id);
      }
    }

    // Fetch one extra to know if there are more pages
    const { data, error } = await query
      .order("order_index", { ascending: true })
      .range(offset, offset + limit);

    if (error) throw error;
    const rows = data || [];
    return { products: rows.slice(0, limit), hasMore: rows.length > limit };
  } catch (err) {
    console.error("[DB] Error fetching marketplace products:", err);
    return { products: [], hasMore: false };
  }
}

/**
 * Fetches a single product by its slug including parent business details.
 */
export async function getProductBySlug(slug: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*, businesses(*)")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("[DB] Error fetching product by slug:", err);
    return null;
  }
}

