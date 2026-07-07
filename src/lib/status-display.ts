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
    description: "Available, not committed"
  },
  bog_bound: {
    label: "Bog bound",
    shortLabel: "Bog",
    description: "Planning to be at The Bog"
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
