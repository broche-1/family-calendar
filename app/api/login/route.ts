import { NextResponse } from "next/server";

import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { createSession, serializeMember } from "@/lib/session";

export const dynamic = "force-dynamic";

function clientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "local";
}

export async function POST(request: Request) {
  if (!checkRateLimit(`login:${clientKey(request)}`)) {
    return NextResponse.json({ error: "Too many login attempts. Try again shortly." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const firstName = typeof body === "object" && body && "firstName" in body ? String(body.firstName).trim() : "";

  if (!firstName) {
    return NextResponse.json({ error: "Enter your first name." }, { status: 400 });
  }

  const members = await prisma.familyMember.findMany({
    where: { isActive: true }
  });
  const member = members.find((candidate) => candidate.firstName.toLowerCase() === firstName.toLowerCase());

  if (!member) {
    return NextResponse.json({ error: "That first name is not on the family roster." }, { status: 401 });
  }

  await createSession(member.id);

  return NextResponse.json({ member: serializeMember(member) });
}
