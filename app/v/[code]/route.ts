/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const supabase = await createClient();

  // Fetch short link details
  const { data, error } = await supabase
    .from("short_links")
    .select("business_id, businesses(slug)")
    .eq("short_code", code)
    .maybeSingle();

  if (error) {
    console.error("Error retrieving short link:", error);
  }

  // Increment clicks atomically using RPC helper
  if (data) {
    const { error: rpcError } = await supabase.rpc("increment_short_link_clicks", {
      code,
    });
    if (rpcError) {
      console.error("Error incrementing short link clicks:", rpcError);
    }
  }

  const slug = (data?.businesses as any)?.slug;
  if (slug) {
    redirect(`/vitrine/${slug}`);
  }

  redirect("/");
}
