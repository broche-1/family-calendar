import { JaneForecast as PrismaJaneForecast } from "@prisma/client";

import { JaneForecast } from "@/types/planner";

export function fromPrismaJaneForecast(forecast: PrismaJaneForecast | null): JaneForecast | null {
  return forecast ? (forecast.toLowerCase() as JaneForecast) : null;
}

export function toPrismaJaneForecast(forecast: JaneForecast): PrismaJaneForecast {
  return forecast.toUpperCase() as PrismaJaneForecast;
}
