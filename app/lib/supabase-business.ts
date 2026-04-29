import { supabase } from './supabase';

export interface Business {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description?: string;
  category_id?: string;
  category?: Category;
  city_id?: string;
  city?: City;
  address?: string;
  whatsapp?: string;
  phone?: string;
  email?: string;
  instagram?: string;
  website?: string;
  logo_url?: string;
  cover_url?: string;
  images?: BusinessImage[];
  plan: 'free' | 'pro' | 'premium';
  is_published: boolean;
  rating_average: number;
  rating_count: number;
  view_count: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

export interface City {
  id: string;
  name: string;
  slug: string;
  country: string;
}

export interface BusinessImage {
  id: string;
  business_id: string;
  url: string;
  type: 'gallery' | 'logo' | 'cover';
  order_index: number;
}

export interface Review {
  id: string;
  business_id: string;
  author_name: string;
  rating: number;
  title?: string;
  comment?: string;
  created_at: string;
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('order_index');
  
  if (error) throw error;
  return data || [];
}

export async function getCities(): Promise<City[]> {
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('is_active', true)
    .order('order_index');
  
  if (error) throw error;
  return data || [];
}

export async function getBusinessById(id: string): Promise<Business | null> {
  const { data: business, error } = await supabase
    .from('businesses')
    .select(`
      *,
      category:categories(*),
      city:cities(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('[DB] Error fetching business:', error);
    return null;
  }

  if (!business) return null;

  const { data: images } = await supabase
    .from('business_images')
    .select('*')
    .eq('business_id', id)
    .order('order_index');

  return { ...business, images: images || [] };
}

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const { data: business, error } = await supabase
    .from('businesses')
    .select(`
      *,
      category:categories(*),
      city:cities(*)
    `)
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error) return null;

  const { data: images } = await supabase
    .from('business_images')
    .select('*')
    .eq('business_id', business.id)
    .order('order_index');

  return { ...business, images: images || [] };
}

export async function getUserBusiness(userId: string): Promise<Business | null> {
  const { data: business, error } = await supabase
    .from('businesses')
    .select(`
      *,
      category:categories(*),
      city:cities(*)
    `)
    .eq('user_id', userId)
    .single();

  if (error) return null;

  const { data: images } = await supabase
    .from('business_images')
    .select('*')
    .eq('business_id', business.id)
    .order('order_index');

  return { ...business, images: images || [] };
}

export async function getBusinesses(filters?: {
  search?: string;
  category?: string;
  city?: string;
  limit?: number;
  offset?: number;
}): Promise<{ businesses: Business[]; count: number }> {
  let query = supabase
    .from('businesses')
    .select(`
      *,
      category:categories(name, slug, icon),
      city:cities(name, slug, country)
    `, { count: 'exact' })
    .eq('is_published', true);

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  if (filters?.category) {
    query = query.eq('category.slug', filters.category);
  }

  if (filters?.city) {
    query = query.eq('city.slug', filters.city);
  }

  query = query
    .order('rating_average', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return { businesses: data || [], count: count || 0 };
}

export async function createBusiness(userId: string, business: {
  name: string;
  description?: string;
  category_id?: string;
  city_id?: string;
  address?: string;
  whatsapp?: string;
  phone?: string;
  email?: string;
  instagram?: string;
  website?: string;
}): Promise<Business> {
  const slug = business.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const { data, error } = await supabase
    .from('businesses')
    .insert({
      ...business,
      user_id: userId,
      slug: `${slug}-${Date.now()}`,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBusiness(id: string, updates: Partial<Business>): Promise<Business> {
  const { data, error } = await supabase
    .from('businesses')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBusiness(id: string): Promise<void> {
  const { error } = await supabase
    .from('businesses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function uploadBusinessImage(
  businessId: string,
  file: File,
  type: 'logo' | 'cover' | 'gallery',
  orderIndex?: number
): Promise<BusinessImage> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${businessId}/${type}-${Date.now()}.${fileExt}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('business-images')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('business-images')
    .getPublicUrl(fileName);

  const imageData = {
    business_id: businessId,
    url: publicUrl,
    type,
    order_index: orderIndex || 0,
  };

  const { data, error } = await supabase
    .from('business_images')
    .upsert(imageData, { onConflict: 'business_id,type' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getReviews(businessId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createReview(review: {
  business_id: string;
  author_name: string;
  rating: number;
  title?: string;
  comment?: string;
}): Promise<Review> {
  const { data, error } = await supabase
    .from('reviews')
    .insert(review)
    .select()
    .single();

  if (error) throw error;
  return data;
}