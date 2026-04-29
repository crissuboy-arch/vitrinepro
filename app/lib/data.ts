import { isSupabaseConfigured, supabase } from './supabase';
import { getCategories, getCities, getBusinessById, getBusinessBySlug, getUserBusiness, getBusinesses, createBusiness, updateBusiness, uploadBusinessImage, getReviews, type Business, type Category, type City, type Review } from './supabase-business';
import { getAllBusinesses as getLocalBusinesses, getBusinessById as getLocalBusinessById, saveBusiness as saveLocalBusiness } from './businessData';

// Unified data layer that works with Supabase when configured, or falls back to localStorage

export type { Business, Category, City, Review };

export async function fetchCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }
  return getCategories();
}

export async function fetchCities(): Promise<City[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }
  return getCities();
}

export async function fetchBusinessById(id: string): Promise<Business | null> {
  if (!isSupabaseConfigured()) {
    return getLocalBusinessById(id) as unknown as Business | null;
  }
  return getBusinessById(id);
}

export async function fetchBusinessBySlug(slug: string): Promise<Business | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }
  return getBusinessBySlug(slug);
}

export async function fetchUserBusiness(userId: string): Promise<Business | null> {
  if (!isSupabaseConfigured()) {
    const localBusinesses = getLocalBusinesses();
    return localBusinesses.find(b => b.id === userId) as unknown as Business | null || null;
  }
  return getUserBusiness(userId);
}

export async function fetchBusinesses(filters?: {
  search?: string;
  category?: string;
  city?: string;
  limit?: number;
  offset?: number;
}): Promise<{ businesses: Business[]; count: number }> {
  if (!isSupabaseConfigured()) {
    const local = getLocalBusinesses();
    let filtered = [...local];
    
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(b => 
        b.name?.toLowerCase().includes(q) || 
        b.description?.toLowerCase().includes(q)
      );
    }
    
    if (filters?.category) {
      filtered = filtered.filter(b => b.category === filters.category);
    }
    
    if (filters?.city) {
      filtered = filtered.filter(b => b.city === filters.city);
    }
    
    return { businesses: filtered as unknown as Business[], count: filtered.length };
  }
  
  return getBusinesses(filters);
}

export async function saveUserBusiness(userId: string, businessData: Partial<Business>): Promise<Business> {
  if (!isSupabaseConfigured()) {
    const savedLocal = saveLocalBusiness(businessData as any);
    return { ...businessData, id: savedLocal } as unknown as Business;
  }
  
  const existing = await getUserBusiness(userId);
  
  if (existing) {
    return updateBusiness(existing.id, businessData);
  }
  
  return createBusiness(userId, businessData as any);
}

export async function fetchBusinessReviews(businessId: string): Promise<Review[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }
  return getReviews(businessId);
}

export async function uploadImage(
  businessId: string,
  file: File,
  type: 'logo' | 'cover' | 'gallery',
  orderIndex?: number
): Promise<string> {
  if (!isSupabaseConfigured()) {
    return '';
  }
  
  const image = await uploadBusinessImage(businessId, file, type, orderIndex);
  return image.url;
}

// Helper to check if we're in demo mode
export function isDemoMode(): boolean {
  return !isSupabaseConfigured();
}