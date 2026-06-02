import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(null);
    }

    const { data, error } = await supabase
      .from("businesses")
      .select("name, city")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error("Error fetching business by slug:", error);
      return NextResponse.json(null);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error in business-by-slug route:", error);
    return NextResponse.json(null);
  }
}
