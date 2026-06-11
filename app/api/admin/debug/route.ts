import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") || "";
  const expected = process.env.ADMIN_PASSWORD || "hilhi-admin";
  if (key !== expected) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const kvUrl   = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  const upUrl   = process.env.UPSTASH_REDIS_REST_URL;
  const upToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  const hasKV = !!(kvUrl && kvToken);
  const hasUpstash = !!(upUrl && upToken);

  let testResult = "not attempted";
  const url   = kvUrl || upUrl || "";
  const token = kvToken || upToken || "";

  if (url && token) {
    try {
      const { Redis } = await import("@upstash/redis");
      const redis = new Redis({ url, token });
      await redis.set("hilhi_test", "ok");
      const val = await redis.get("hilhi_test");
      testResult = val === "ok" ? "PASS - Redis is working!" : `unexpected value: ${val}`;
    } catch (e: unknown) {
      testResult = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  return NextResponse.json({
    KV_REST_API_URL:            kvUrl   ? "SET (" + kvUrl.slice(0,30) + "...)" : "NOT SET",
    KV_REST_API_TOKEN:          kvToken ? "SET"   : "NOT SET",
    UPSTASH_REDIS_REST_URL:     upUrl   ? "SET (" + upUrl.slice(0,30) + "...)" : "NOT SET",
    UPSTASH_REDIS_REST_TOKEN:   upToken ? "SET"   : "NOT SET",
    hasKV,
    hasUpstash,
    redisTest: testResult,
  });
}
