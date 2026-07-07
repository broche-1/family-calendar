import { NextResponse } from "next/server";

import { firstNamesShareFamilyRow } from "@/lib/family-groups";
import { canSetJaneForecast, isJaneForecast } from "@/lib/jane-factor";
import { toPrismaJaneForecast } from "@/lib/jane-factor-prisma";
import { prisma } from "@/lib/prisma";
import { getActiveSeasonPayload } from "@/lib/season";
import { getCurrentMember } from "@/lib/session";
import { isAvailabilityStatus, toPrismaStatus } from "@/lib/status";
import { countsAsCapeAvailability } from "@/lib/status-rules";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  const currentMember = await getCurrentMember();

  if (!currentMember) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const weekendId = typeof payload.weekendId === "string" ? payload.weekendId : "";
  const targetMemberId = typeof payload.familyMemberId === "string" ? payload.familyMemberId : currentMember.id;
  const status = payload.status;
  const note = typeof payload.note === "string" ? payload.note.trim().slice(0, 240) : null;
  const janeForecast = payload.janeForecast;

  if (!weekendId || !isAvailabilityStatus(status)) {
    return NextResponse.json({ error: "Weekend and status are required." }, { status: 400 });
  }

  if (janeForecast !== null && janeForecast !== undefined && !isJaneForecast(janeForecast)) {
    return NextResponse.json({ error: "Jane Forecast is not valid." }, { status: 400 });
  }

  const parsedJaneForecast = isJaneForecast(janeForecast) ? janeForecast : null;

  const weekend = await prisma.weekend.findUnique({
    where: { id: weekendId },
    include: { season: true }
  });

  if (!weekend || !weekend.season.isActive) {
    return NextResponse.json({ error: "Weekend not found." }, { status: 404 });
  }

  const targetMember = await prisma.familyMember.findUnique({
    where: { id: targetMemberId }
  });

  if (!targetMember || !targetMember.isActive) {
    return NextResponse.json({ error: "Family member not found." }, { status: 404 });
  }

  const canEditTarget =
    currentMember.isOrganizer ||
    targetMemberId === currentMember.id ||
    firstNamesShareFamilyRow(currentMember.firstName, targetMember.firstName);

  if (!canEditTarget) {
    return NextResponse.json({ error: "You can only edit your own family row." }, { status: 403 });
  }

  const storedJaneForecast =
    countsAsCapeAvailability(status) && canSetJaneForecast(targetMember.firstName) && parsedJaneForecast
      ? toPrismaJaneForecast(parsedJaneForecast)
      : null;

  await prisma.availability.upsert({
    where: {
      weekendId_familyMemberId: {
        weekendId,
        familyMemberId: targetMemberId
      }
    },
    update: {
      status: toPrismaStatus(status),
      note: note || null,
      janeForecast: storedJaneForecast
    },
    create: {
      seasonId: weekend.seasonId,
      weekendId,
      familyMemberId: targetMemberId,
      status: toPrismaStatus(status),
      note: note || null,
      janeForecast: storedJaneForecast
    }
  });

  return NextResponse.json(await getActiveSeasonPayload());
}
