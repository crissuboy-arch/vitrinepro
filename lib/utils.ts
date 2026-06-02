import { supabase } from "@/app/lib/supabase";

/**
 * Converts a business name into a clean URL slug.
 * Checks for duplicates in Supabase and appends -2, -3… if needed.
 */
export async function generateSlug(name: string): Promise<string> {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")   // remove diacritics
    .replace(/[^a-z0-9\s-]/g, "")      // keep only alphanumeric + spaces + hyphens
    .trim()
    .replace(/\s+/g, "-")              // spaces → hyphens
    .replace(/-+/g, "-")               // collapse consecutive hyphens
    .replace(/^-|-$/g, "");            // trim leading/trailing hyphens

  // Check if base slug is available
  const { data: existing } = await supabase
    .from("businesses")
    .select("slug")
    .eq("slug", base)
    .maybeSingle();

  if (!existing) return base;

  // Find the next available suffix: base-2, base-3, …
  let suffix = 2;
  while (true) {
    const candidate = `${base}-${suffix}`;
    const { data: taken } = await supabase
      .from("businesses")
      .select("slug")
      .eq("slug", candidate)
      .maybeSingle();

    if (!taken) return candidate;
    suffix++;
  }
}
