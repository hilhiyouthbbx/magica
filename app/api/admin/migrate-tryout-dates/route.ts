import { NextRequest, NextResponse } from "next/server";
import { getContent, saveContent } from "@/lib/content";

export const dynamic = "force-dynamic";

const SECRET = "4db4093a0be4c808909bf0c95926894e82311411c2f84329";

export async function POST(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (key !== SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const content = await getContent();
  content.tryout.sessions = [
    { id: "s1", label: "Sunday (November 15)", time: "4:00 PM – 5:30 PM" },
    { id: "s2", label: "Monday (November 16)", time: "6:30 PM – 8:00 PM" },
  ];
  await saveContent(content);

  return NextResponse.json({ success: true, sessions: content.tryout.sessions });
}
