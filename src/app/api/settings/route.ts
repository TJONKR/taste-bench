import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabase } from "@/lib/supabase";
import { encrypt } from "@/lib/crypto";
import Anthropic from "@anthropic-ai/sdk";

async function getAuthUser() {
  const client = await createClient();
  if (!client) return null;
  const { data: { user } } = await client.auth.getUser();
  return user;
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });


  const { data } = await supabase
    .from("user_settings")
    .select("key_validated_at")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({
    hasKey: !!data?.key_validated_at,
    keyValidatedAt: data?.key_validated_at || null,
  });
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const body = await req.json();
    const { anthropicApiKey } = body;

    if (!anthropicApiKey || typeof anthropicApiKey !== "string") {
      return NextResponse.json({ error: "API key is required" }, { status: 400 });
    }

    // Format check
    if (!anthropicApiKey.startsWith("sk-ant-")) {
      return NextResponse.json({ error: "Invalid key format: must start with sk-ant-" }, { status: 400 });
    }

    // Validate via lightweight API call
    try {
      const client = new Anthropic({ apiKey: anthropicApiKey });
      await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      });
    } catch (e: any) {
      return NextResponse.json({ error: "API key validation failed: " + (e.message || "invalid key") }, { status: 400 });
    }

    // Encrypt and store
    const encrypted = encrypt(anthropicApiKey);

    const { error } = await supabase
      .from("user_settings")
      .upsert({
        user_id: user.id,
        anthropic_api_key: encrypted,
        key_validated_at: new Date().toISOString(),
      });

    if (error) {
      console.error("Failed to save settings:", error);
      return NextResponse.json({ error: "Failed to save key" }, { status: 500 });
    }

    return NextResponse.json({ valid: true });
  } catch (e: any) {
    console.error("Settings POST error:", e);
    return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });


  const { error } = await supabase
    .from("user_settings")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to delete settings:", error);
    return NextResponse.json({ error: "Failed to delete key" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
