import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { savePending } from "@/lib/leaderboard";
import { submitSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = submitSchema.safeParse(body);

    if (!result.success) {
      const msg = result.error.issues.map(i => i.message).join(", ");
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { name, twitter, linkedin, website, description } = result.data;
    const id = uuidv4();
    await savePending(id, { name, twitter, linkedin, website, description });

    // Fire off the judging in the background (don't await)
    fetch(`${req.headers.get("origin") || "http://localhost:3003"}/api/judge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name, twitter, linkedin, website, description }),
    }).catch(console.error);

    return NextResponse.json({ id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
