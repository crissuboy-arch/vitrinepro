import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

// GET /api/social?business_id=xxx
// Returns counts + whether the current user has liked/favorited
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("business_id");

  if (!businessId) {
    return Response.json({ error: "business_id required" }, { status: 400 });
  }

  const supabase = getAdmin();

  // Fetch counter columns from businesses in one query
  const { data: biz, error: bizErr } = await supabase
    .from("businesses")
    .select("like_count, favorite_count, share_count, view_count")
    .eq("id", businessId)
    .maybeSingle();

  if (bizErr || !biz) {
    return Response.json({ error: "Business not found" }, { status: 404 });
  }

  // Try to identify the current user (optional — no auth required for counts)
  let isLiked = false;
  let isFavorited = false;

  try {
    const cookieStore = await cookies();
    const userClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data: { user } } = await userClient.auth.getUser();

    if (user) {
      const [likeRes, favRes] = await Promise.all([
        supabase
          .from("business_likes")
          .select("id")
          .eq("user_id", user.id)
          .eq("business_id", businessId)
          .maybeSingle(),
        supabase
          .from("favorites")
          .select("id")
          .eq("user_id", user.id)
          .eq("business_id", businessId)
          .maybeSingle(),
      ]);
      isLiked = !!likeRes.data;
      isFavorited = !!favRes.data;
    }
  } catch {
    // Not authenticated — counts still returned
  }

  return Response.json({
    like_count:     biz.like_count     ?? 0,
    favorite_count: biz.favorite_count ?? 0,
    share_count:    biz.share_count    ?? 0,
    view_count:     biz.view_count     ?? 0,
    is_liked:       isLiked,
    is_favorited:   isFavorited,
  });
}

// POST /api/social
// Body: { business_id, action: "toggle_like" | "record_share", platform?: string }
export async function POST(request: Request) {
  let body: { business_id?: string; action?: string; platform?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { business_id, action, platform = "link" } = body;
  if (!business_id || !action) {
    return Response.json({ error: "business_id and action required" }, { status: 400 });
  }

  // ── record_share (anonymous) ────────────────────────────────────
  if (action === "record_share") {
    const supabase = getAdmin();
    const { error } = await supabase
      .from("business_shares")
      .insert({ business_id, platform });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ ok: true });
  }

  // ── toggle_like (requires auth) ────────────────────────────────
  if (action === "toggle_like") {
    const authHeader = request.headers.get("authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const supabase = getAdmin();
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);

    if (authErr || !user) {
      return Response.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check existing like
    const { data: existing } = await supabase
      .from("business_likes")
      .select("id")
      .eq("user_id", user.id)
      .eq("business_id", business_id)
      .maybeSingle();

    if (existing) {
      // Unlike
      await supabase.from("business_likes").delete().eq("id", existing.id);
      const { data: biz } = await supabase
        .from("businesses")
        .select("like_count")
        .eq("id", business_id)
        .maybeSingle();
      return Response.json({ liked: false, like_count: biz?.like_count ?? 0 });
    } else {
      // Like
      await supabase
        .from("business_likes")
        .insert({ user_id: user.id, business_id });
      const { data: biz } = await supabase
        .from("businesses")
        .select("like_count")
        .eq("id", business_id)
        .maybeSingle();
      return Response.json({ liked: true, like_count: biz?.like_count ?? 0 });
    }
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
