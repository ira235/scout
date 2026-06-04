import { NextResponse } from "next/server";
import { z } from "zod";
import { parsePromptLLM } from "@/lib/parse-prompt";

export const runtime = "nodejs";

const Body = z.object({ prompt: z.string().min(1).max(2000) });

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const result = await parsePromptLLM(parsed.data.prompt);
    return NextResponse.json(result);
  } catch (e) {
    console.error("[api/parse-prompt]", e);
    return NextResponse.json({ error: "parse failed" }, { status: 500 });
  }
}
