import { AvailabilityStatus } from "@/types/planner";

export const STATUS_META: Record<
  AvailabilityStatus,
  {
    label: string;
    shortLabel: string;
    description: string;
  }
> = {
  unknown: {
    label: "Unknown",
    shortLabel: "Unknown",
    description: "No answer yet"
  },
  free: {
    label: "Free",
    shortLabel: "Free",
    description: "Available for the Cape house"
  },
  busy: {
    label: "Busy",
    shortLabel: "Busy",
    description: "Unavailable"
  },
  maybe: {
    label: "Maybe",
    shortLabel: "Maybe",
    description: "Uncertain or partial availability"
  }
};
