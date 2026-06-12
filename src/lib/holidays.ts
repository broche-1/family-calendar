export type HolidayCallout = {
  date: string;
  label: string;
  scope: "National" | "MA" | "Family";
};

type HolidayDefinition = {
  label: string;
  scope: HolidayCallout["scope"];
  date: Date;
};

type FamilyHolidayDefinition = {
  label: string;
  month: number;
  day: number;
};

const NEARBY_DAYS_BEFORE = 3;
const NEARBY_DAYS_AFTER = 1;

export const FAMILY_HOLIDAYS: FamilyHolidayDefinition[] = [
  // Add recurring family dates here for now, for example:
  // { label: "Grace Birthday", month: 7, day: 12 }
];

const FAMILY_HOLIDAY_SCOPE: HolidayCallout["scope"] = "Family";

function utcDate(year: number, monthIndex: number, day: number) {
  return new Date(Date.UTC(year, monthIndex, day));
}

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function nthWeekdayOfMonth(year: number, monthIndex: number, weekday: number, ordinal: number) {
  const first = utcDate(year, monthIndex, 1);
  const offset = (weekday - first.getUTCDay() + 7) % 7;
  return utcDate(year, monthIndex, 1 + offset + (ordinal - 1) * 7);
}

function lastWeekdayOfMonth(year: number, monthIndex: number, weekday: number) {
  const last = utcDate(year, monthIndex + 1, 0);
  const offset = (last.getUTCDay() - weekday + 7) % 7;
  return utcDate(year, monthIndex, last.getUTCDate() - offset);
}

function familyHolidayDefinitionsForYear(year: number): HolidayDefinition[] {
  return FAMILY_HOLIDAYS.map((holiday) => ({
    label: holiday.label,
    scope: FAMILY_HOLIDAY_SCOPE,
    date: utcDate(year, holiday.month - 1, holiday.day)
  }));
}

function observedFixedDate(year: number, monthIndex: number, day: number) {
  const actual = utcDate(year, monthIndex, day);

  if (actual.getUTCDay() === 6) {
    return addDays(actual, -1);
  }

  if (actual.getUTCDay() === 0) {
    return addDays(actual, 1);
  }

  return actual;
}

function holidayDefinitionsForYear(year: number): HolidayDefinition[] {
  const builtInHolidays: HolidayDefinition[] = [
    {
      label: "Memorial Day",
      scope: "National",
      date: lastWeekdayOfMonth(year, 4, 1)
    },
    {
      label: "Bunker Hill Day",
      scope: "MA",
      date: utcDate(year, 5, 17)
    },
    {
      label: "Father's Day",
      scope: "National",
      date: nthWeekdayOfMonth(year, 5, 0, 3)
    },
    {
      label: "Juneteenth",
      scope: "National",
      date: observedFixedDate(year, 5, 19)
    },
    {
      label: "Independence Day",
      scope: "National",
      date: observedFixedDate(year, 6, 4)
    },
    {
      label: "Labor Day",
      scope: "National",
      date: nthWeekdayOfMonth(year, 8, 1, 1)
    }
  ];

  return builtInHolidays.concat(familyHolidayDefinitionsForYear(year));
}

export function getHolidayCalloutsForWeekend(startDateValue: string, endDateValue: string): HolidayCallout[] {
  const startDate = new Date(`${startDateValue}T00:00:00.000Z`);
  const endDate = new Date(`${endDateValue}T00:00:00.000Z`);
  const rangeStart = addDays(startDate, -NEARBY_DAYS_BEFORE);
  const rangeEnd = addDays(endDate, NEARBY_DAYS_AFTER);
  const years = new Set([rangeStart.getUTCFullYear(), startDate.getUTCFullYear(), endDate.getUTCFullYear(), rangeEnd.getUTCFullYear()]);

  return Array.from(years)
    .flatMap((year) => holidayDefinitionsForYear(year))
    .filter((holiday) => holiday.date >= rangeStart && holiday.date <= rangeEnd)
    .sort((left, right) => left.date.getTime() - right.date.getTime())
    .map((holiday) => ({
      date: dateOnly(holiday.date),
      label: holiday.label,
      scope: holiday.scope
    }));
}
