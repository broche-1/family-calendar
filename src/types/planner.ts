export const STATUS_VALUES = ["unknown", "free", "busy", "maybe"] as const;

export type AvailabilityStatus = (typeof STATUS_VALUES)[number];

export type MemberPayload = {
  id: string;
  firstName: string;
  displayName: string;
  color: string | null;
  isActive: boolean;
  isOrganizer: boolean;
};

export type AvailabilityCellPayload = {
  id: string | null;
  status: AvailabilityStatus;
  note: string | null;
  updatedAt: string | null;
};

export type WeekendSummaryPayload = {
  free: number;
  busy: number;
  maybe: number;
  unknown: number;
};

export type WeekendPayload = {
  id: string;
  startDate: string;
  endDate: string;
  label: string;
  sortOrder: number;
  summary: WeekendSummaryPayload;
  flags: {
    everyoneFree: boolean;
    mostFree: boolean;
    needsResponses: boolean;
  };
};

export type SeasonPayload = {
  season: {
    id: string;
    name: string;
    year: number;
    startDate: string;
    endDate: string;
    mostFreeThreshold: number;
  };
  members: MemberPayload[];
  weekends: WeekendPayload[];
  availability: Record<string, Record<string, AvailabilityCellPayload>>;
};
