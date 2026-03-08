import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Auth not configured" }, { status: 400 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { evaluationId } = await req.json();
  if (!evaluationId) return NextResponse.json({ error: "evaluationId required" }, { status: 400 });

  // Only claim if unclaimed
  const { data: existing } = await supabase
    .from("evaluations")
    .select("user_id")
    .eq("id", evaluationId)
    .single();

  if (!existing) return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
  if (existing.user_id) return NextResponse.json({ error: "Already claimed" }, { status: 409 });

  const { error } = await supabase
    .from("evaluations")
    .update({ user_id: user.id })
    .eq("id", evaluationId)
    .is("user_id", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
