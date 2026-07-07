import { AvailabilityStatus } from "@/types/planner";

export function countsAsCapeAvailability(status: AvailabilityStatus) {
  return status === "free" || status === "bog_bound";
}
