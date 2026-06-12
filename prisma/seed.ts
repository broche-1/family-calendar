import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#9333ea",
  "#ea580c",
  "#0891b2",
  "#be123c",
  "#4f46e5"
];

const DEFAULT_ROSTER = "Grace Roche,Jack Roche,Brendan Roche,Jo Roche,Katie Roche,Elizabeth Roche,Michael Roche";

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function firstFridayOnOrAfter(date: Date): Date {
  const next = new Date(date);
  const day = next.getUTCDay();
  const daysUntilFriday = (5 - day + 7) % 7;
  return addDays(next, daysUntilFriday);
}

function formatWeekendLabel(startDate: Date, endDate: Date): string {
  const month = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(startDate);
  const startDay = startDate.getUTCDate();
  const endMonth = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(endDate);
  const endDay = endDate.getUTCDate();

  return month === endMonth ? `${month} ${startDay}-${endDay}` : `${month} ${startDay}-${endMonth} ${endDay}`;
}

function generateWeekends(startDate: Date, endDate: Date) {
  const weekends = [];
  let friday = firstFridayOnOrAfter(startDate);
  let sortOrder = 0;

  while (addDays(friday, 2) <= endDate) {
    const sunday = addDays(friday, 2);
    weekends.push({
      startDate: friday,
      endDate: sunday,
      label: formatWeekendLabel(friday, sunday),
      sortOrder
    });
    friday = addDays(friday, 7);
    sortOrder += 1;
  }

  return weekends;
}

async function main() {
  const year = Number(process.env.SEED_SEASON_YEAR ?? new Date().getUTCFullYear());
  const startDate = parseDate(process.env.SEED_SEASON_START ?? `${year}-06-05`);
  const endDate = parseDate(process.env.SEED_SEASON_END ?? `${year}-09-06`);
  const seasonName = `Cape Summer ${year}`;
  const roster = (process.env.SEED_FAMILY_MEMBERS ?? DEFAULT_ROSTER)
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  const organizerFirstName = process.env.SEED_ORGANIZER_FIRST_NAME ?? roster[0];
  const mostFreeThreshold = Math.max(1, Math.floor(roster.length / 2) + 1);

  await prisma.season.updateMany({
    where: { isActive: true },
    data: { isActive: false }
  });

  await prisma.familyMember.updateMany({
    data: {
      isActive: false,
      isOrganizer: false
    }
  });

  for (const [index, displayName] of roster.entries()) {
    const firstName = displayName.split(/\s+/)[0];
    await prisma.familyMember.upsert({
      where: { firstName },
      update: {
        displayName,
        color: COLORS[index % COLORS.length],
        isActive: true,
        isOrganizer: firstName.toLowerCase() === organizerFirstName.toLowerCase()
      },
      create: {
        firstName,
        displayName,
        color: COLORS[index % COLORS.length],
        isActive: true,
        isOrganizer: firstName.toLowerCase() === organizerFirstName.toLowerCase()
      }
    });
  }

  const season = await prisma.season.upsert({
    where: { name: seasonName },
    update: {
      year,
      startDate,
      endDate,
      mostFreeThreshold,
      isActive: true
    },
    create: {
      name: seasonName,
      year,
      startDate,
      endDate,
      mostFreeThreshold,
      isActive: true
    }
  });

  const weekends = generateWeekends(startDate, endDate);
  for (const weekend of weekends) {
    await prisma.weekend.upsert({
      where: {
        seasonId_startDate: {
          seasonId: season.id,
          startDate: weekend.startDate
        }
      },
      update: {
        endDate: weekend.endDate,
        label: weekend.label,
        sortOrder: weekend.sortOrder
      },
      create: {
        seasonId: season.id,
        ...weekend
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
