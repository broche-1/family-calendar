import { AvailabilityStatus as PrismaAvailabilityStatus } from "@prisma/client";

import { AvailabilityStatus, STATUS_VALUES } from "@/types/planner";

export function isAvailabilityStatus(value: unknown): value is AvailabilityStatus {
  return typeof value === "string" && STATUS_VALUES.includes(value as AvailabilityStatus);
}

export function fromPrismaStatus(status: PrismaAvailabilityStatus): AvailabilityStatus {
  return status.toLowerCase() as AvailabilityStatus;
}

export function toPrismaStatus(status: AvailabilityStatus): PrismaAvailabilityStatus {
  return status.toUpperCase() as PrismaAvailabilityStatus;
}
