import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { evaluate, isEnv } from "@/apps/flags/sdk";

const API_KEY = process.env.FLAGS_SDK_KEY ?? "demo-sdk-key";

export async function GET(request: Request) {
  if (request.headers.get("x-api-key") !== API_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const key = url.searchParams.get("key") ?? "";
  const env = url.searchParams.get("env") ?? "prod";
  const subject = url.searchParams.get("subject") ?? undefined;
  if (!key || !isEnv(env)) return NextResponse.json({ error: "key and valid env required" }, { status: 400 });

  const flag = await db.featureFlag.findUnique({ where: { key }, include: { environments: { where: { env } } } });
  const state = flag?.environments[0];
  if (!flag || !state) return NextResponse.json({ error: "flag not found" }, { status: 404 });

  return NextResponse.json(
    { key, env, enabled: evaluate(state, key, subject), rolloutPct: state.rolloutPct, subject: subject ?? null },
    { headers: { "cache-control": "private, max-age=30" } },
  );
}
