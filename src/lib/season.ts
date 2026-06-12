import { prisma } from "@/lib/prisma";
import { fromPrismaStatus } from "@/lib/status";
import { AvailabilityCellPayload, AvailabilityStatus, SeasonPayload } from "@/types/planner";

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function emptyCell(): AvailabilityCellPayload {
  return {
    id: null,
    status: "unknown",
    note: null,
    updatedAt: null
  };
}

export async function getActiveSeasonPayload(): Promise<SeasonPayload> {
  const season = await prisma.season.findFirst({
    where: { isActive: true },
    orderBy: { year: "desc" },
    include: {
      weekends: {
        orderBy: { sortOrder: "asc" }
      }
    }
  });

  if (!season) {
    throw new Error("No active season has been configured. Run the seed script first.");
  }

  const members = await prisma.familyMember.findMany({
    where: { isActive: true },
    orderBy: [{ displayName: "asc" }, { firstName: "asc" }]
  });

  const entries = await prisma.availability.findMany({
    where: { seasonId: season.id }
  });

  const availability: SeasonPayload["availability"] = {};
  for (const member of members) {
    availability[member.id] = {};
    for (const weekend of season.weekends) {
      availability[member.id][weekend.id] = emptyCell();
    }
  }

  for (const entry of entries) {
    if (!availability[entry.familyMemberId]?.[entry.weekendId]) {
      continue;
    }

    availability[entry.familyMemberId][entry.weekendId] = {
      id: entry.id,
      status: fromPrismaStatus(entry.status),
      note: entry.note,
      updatedAt: entry.updatedAt.toISOString()
    };
  }

  const weekends = season.weekends.map((weekend) => {
    const summary: Record<AvailabilityStatus, number> = {
      unknown: 0,
      free: 0,
      busy: 0,
      maybe: 0
    };

    for (const member of members) {
      const status = availability[member.id][weekend.id]?.status ?? "unknown";
      summary[status] += 1;
    }

    return {
      id: weekend.id,
      startDate: dateOnly(weekend.startDate),
      endDate: dateOnly(weekend.endDate),
      label: weekend.label,
      sortOrder: weekend.sortOrder,
      summary,
      flags: {
        everyoneFree: members.length > 0 && summary.free === members.length,
        mostFree: summary.free >= season.mostFreeThreshold,
        needsResponses: summary.unknown > 0
      }
    };
  });

  return {
    season: {
      id: season.id,
      name: season.name,
      year: season.year,
      startDate: dateOnly(season.startDate),
      endDate: dateOnly(season.endDate),
      mostFreeThreshold: season.mostFreeThreshold
    },
    members: members.map((member) => ({
      id: member.id,
      firstName: member.firstName,
      displayName: member.displayName,
      color: member.color,
      isActive: member.isActive,
      isOrganizer: member.isOrganizer
    })),
    weekends,
    availability
  };
}
