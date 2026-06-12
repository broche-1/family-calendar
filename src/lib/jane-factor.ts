import { JANE_FORECAST_VALUES, JaneForecast } from "@/types/planner";

export const DEFAULT_JANE_FORECAST: JaneForecast = "jane_unclear";

export const JANE_FORECAST_META: Record<
  JaneForecast,
  {
    label: string;
    shortLabel: string;
    factorLabel: string;
    description: string;
  }
> = {
  sunny_with_jane: {
    label: "Sunny with Jane",
    shortLabel: "Jane confirmed",
    factorLabel: "Jane Factor: Confirmed",
    description: "Jane is free too"
  },
  partly_janey: {
    label: "Partly Jane-y",
    shortLabel: "Jane maybe",
    factorLabel: "Jane Factor: On watch",
    description: "Jane might come"
  },
  jane_unclear: {
    label: "Jane Unclear",
    shortLabel: "Jane unclear",
    factorLabel: "Jane Factor: Unknown",
    description: "Nobody has a read yet"
  },
  no_jane_expected: {
    label: "No Jane Expected",
    shortLabel: "No Jane",
    factorLabel: "Jane Factor: Not expected",
    description: "Jane probably is not free"
  }
};

const JANE_FORECAST_MEMBER_NAMES = new Set(["katie", "elizabeth"]);

const JANE_FORECAST_PRIORITY: Record<JaneForecast, number> = {
  sunny_with_jane: 4,
  partly_janey: 3,
  jane_unclear: 2,
  no_jane_expected: 1
};

export function canSetJaneForecast(firstName: string) {
  return JANE_FORECAST_MEMBER_NAMES.has(firstName.toLowerCase());
}

export function isJaneForecast(value: unknown): value is JaneForecast {
  return typeof value === "string" && JANE_FORECAST_VALUES.includes(value as JaneForecast);
}

export function strongestJaneForecast(forecasts: JaneForecast[]) {
  return forecasts.reduce<JaneForecast | null>((strongest, forecast) => {
    if (!strongest || JANE_FORECAST_PRIORITY[forecast] > JANE_FORECAST_PRIORITY[strongest]) {
      return forecast;
    }

    return strongest;
  }, null);
}
