import { supabase } from "@/app/lib/supabase";

// Feature 3 — Favorites.
// Logged-in users persist favorites in the `favorites` table (existing, auth-only).
// Anonymous users persist favorites in localStorage for 30 days.

const LS_KEY = "vp_favorites";
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

type FavMap = Record<string, number>; // businessId -> savedAt (ms epoch)

function readMap(): FavMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) || "{}") as FavMap;
    const now = Date.now();
    const pruned: FavMap = {};
    for (const [id, ts] of Object.entries(raw)) {
      if (typeof ts === "number" && now - ts < THIRTY_DAYS) pruned[id] = ts;
    }
    localStorage.setItem(LS_KEY, JSON.stringify(pruned));
    return pruned;
  } catch {
    return {};
  }
}

function writeMap(map: FavMap): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch {
    /* storage full / disabled — ignore */
  }
}

export function getLocalFavoriteIds(): string[] {
  return Object.keys(readMap());
}

export function isLocalFavorite(id: string): boolean {
  return id in readMap();
}

export function removeLocalFavorite(id: string): void {
  const m = readMap();
  delete m[id];
  writeMap(m);
}

function setLocalFavorite(id: string, on: boolean): void {
  const m = readMap();
  if (on) m[id] = Date.now();
  else delete m[id];
  writeMap(m);
}

export async function getSessionUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

/** Whether the current user (logged-in or anonymous) has favorited a business. */
export async function isFavorited(businessId: string): Promise<boolean> {
  const uid = await getSessionUserId();
  if (!uid) return isLocalFavorite(businessId);
  const { data } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", uid)
    .eq("business_id", businessId)
    .maybeSingle();
  return !!data;
}

/** Toggles a favorite and returns the new state (true = favorited). */
export async function toggleFavorite(businessId: string): Promise<boolean> {
  const uid = await getSessionUserId();
  if (!uid) {
    const next = !isLocalFavorite(businessId);
    setLocalFavorite(businessId, next);
    return next;
  }
  const { data } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", uid)
    .eq("business_id", businessId)
    .maybeSingle();
  if (data) {
    await supabase.from("favorites").delete().eq("id", data.id);
    return false;
  }
  await supabase.from("favorites").insert({ user_id: uid, business_id: businessId });
  return true;
}
