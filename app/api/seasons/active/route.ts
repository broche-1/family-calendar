import { NextResponse } from "next/server";

import { getActiveSeasonPayload } from "@/lib/season";
import { getCurrentMember } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const member = await getCurrentMember();

  if (!member) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const payload = await getActiveSeasonPayload();
  return NextResponse.json(payload);
}
