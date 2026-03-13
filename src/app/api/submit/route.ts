import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { savePending } from "@/lib/leaderboard";
import { submitSchema } from "@/lib/validation";
import { generateUniqueSlug } from "@/lib/slug";
import { createClient } from "@/lib/supabase-server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = submitSchema.safeParse(body);

    if (!result.success) {
      const msg = result.error.issues.map(i => i.message).join(", ");
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { name, twitter, linkedin, website, description } = result.data;

    // Auth check — require signed-in user (skip in dev if platform key exists)
    const client = await createClient();
    let userId: string | undefined;
    const isDev = process.env.NODE_ENV !== "production";
    const hasPlatformKey = !!process.env.ANTHROPIC_API_KEY;

    if (client) {
      const { data: { user } } = await client.auth.getUser();

      if (!user && !(isDev && hasPlatformKey)) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      if (user) {
        userId = user.id;

        // Rate limit: max 10 evaluations per hour per user
        if (isSupabaseConfigured && supabase) {
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
          const { count } = await supabase
            .from("evaluations")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .gte("created_at", oneHourAgo);
          if (count !== null && count >= 10) {
            return NextResponse.json({ error: "Rate limit: max 10 evaluations per hour" }, { status: 429 });
          }
        }

        // Verify user has an API key (skip in dev with platform key)
        if (isSupabaseConfigured && supabase && !(isDev && hasPlatformKey)) {
          const { data: settings } = await supabase
            .from("user_settings")
            .select("anthropic_api_key")
            .eq("user_id", userId)
            .maybeSingle();
          if (!settings?.anthropic_api_key) {
            return NextResponse.json({ error: "No API key configured. Add one in Settings." }, { status: 400 });
          }
        }
      }
    }

    const id = uuidv4();
    const slug = await generateUniqueSlug(name);
    await savePending(id, { name, twitter, linkedin, website, description }, slug, userId);

    // Fire off the judging in the background (don't await)
    const origin = req.headers.get("origin") || `http://localhost:${process.env.PORT || 3000}`;
    fetch(`${origin}/api/judge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, slug, userId, name, twitter, linkedin, website, description }),
    }).catch(console.error);

    return NextResponse.json({ id, slug });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
