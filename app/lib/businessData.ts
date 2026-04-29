import { BusinessData } from "../context/AuthContext";

const STORAGE_KEY = "vitrinepro_businesses";

export function getAllBusinesses(): BusinessData[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function getBusinessById(id: string): BusinessData | null {
  const businesses = getAllBusinesses();
  const idx = parseInt(id);
  return businesses[idx] || null;
}

export function saveBusiness(business: Partial<BusinessData>): string {
  console.log("[DEBUG] Saving business:", business);
  const businesses = getAllBusinesses();
  const id = businesses.length.toString();
  const businessWithId = { ...business, id };
  businesses.push(businessWithId as BusinessData);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(businesses));
  console.log("[DEBUG] Business saved with ID:", id);
  return id;
}

export function updateBusiness(id: string, business: Partial<BusinessData>): boolean {
  console.log("[DEBUG] Updating business:", id, business);
  const businesses = getAllBusinesses();
  const idx = parseInt(id);
  if (isNaN(idx) || idx >= businesses.length) return false;
  businesses[idx] = { ...businesses[idx], ...business };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(businesses));
  console.log("[DEBUG] Business updated:", id);
  return true;
}

export function hasRealBusinesses(): boolean {
  const businesses = getAllBusinesses();
  return businesses.length > 0;
}