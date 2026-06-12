import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentMember } from "@/lib/session";

export const dynamic = "force-dynamic";

async function requireOrganizer() {
  const member = await getCurrentMember();

  if (!member?.isOrganizer) {
    return null;
  }

  return member;
}

export async function GET() {
  const member = await requireOrganizer();

  if (!member) {
    return NextResponse.json({ error: "Organizer access required." }, { status: 403 });
  }

  const [season, roster] = await Promise.all([
    prisma.season.findFirst({
      where: { isActive: true },
      include: { weekends: { orderBy: { sortOrder: "asc" } } }
    }),
    prisma.familyMember.findMany({
      orderBy: [{ displayName: "asc" }, { firstName: "asc" }]
    })
  ]);

  return NextResponse.json({ season, roster });
}

export async function PUT(request: Request) {
  const member = await requireOrganizer();

  if (!member) {
    return NextResponse.json({ error: "Organizer access required." }, { status: 403 });
  }

  const body = (await request.json()) as { mostFreeThreshold?: unknown };
  const threshold = Number(body.mostFreeThreshold);

  if (!Number.isInteger(threshold) || threshold < 1) {
    return NextResponse.json({ error: "mostFreeThreshold must be a positive integer." }, { status: 400 });
  }

  const season = await prisma.season.findFirst({ where: { isActive: true } });

  if (!season) {
    return NextResponse.json({ error: "No active season configured." }, { status: 404 });
  }

  const updatedSeason = await prisma.season.update({
    where: { id: season.id },
    data: { mostFreeThreshold: threshold }
  });

  return NextResponse.json({ season: updatedSeason });
}
