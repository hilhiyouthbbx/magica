import { NextRequest, NextResponse } from "next/server";
import { getContent, saveContent } from "@/lib/content";

export const dynamic = "force-dynamic";

const SECRET = "9f2b7e1c4a6d0851f3e9c7b2d4a6f8e0c1b3d5f7";

export async function POST(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (key !== SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const content = await getContent();
  content.tryout.sessions = [
    { id: "s1", label: "Sunday (November 1)", time: "4:00 PM – 5:30 PM" },
    { id: "s2", label: "Monday (November 2)", time: "6:30 PM – 8:00 PM" },
  ];
  await saveContent(content);

  return NextResponse.json({ success: true, sessions: content.tryout.sessions });
}
