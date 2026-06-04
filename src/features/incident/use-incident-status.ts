import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { z } from "zod";

const STORAGE_KEY = "mediumship:incident-dismissed";
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const incidentPayloadSchema = z.object({
  id: z.string().optional(),
  level: z.enum(["ok", "degraded", "incident"]).optional(),
  message: z.string().optional(),
});

type IncidentBannerState = {
  id: string;
  message: string;
};

function getStatusUrl(): string | null {
  const value = process.env.EXPO_PUBLIC_STATUS_URL?.trim();
  return value ? value : null;
}

function deriveIncidentId(payload: z.infer<typeof incidentPayloadSchema>): string | null {
  if (payload.id) {
    return payload.id;
  }

  if (payload.message) {
    return payload.message;
  }

  return null;
}

export function useIncidentStatus() {
  const [incident, setIncident] = useState<IncidentBannerState | null>(null);

  useEffect(() => {
    const statusUrl = getStatusUrl();
    if (!statusUrl) {
      setIncident(null);
      return;
    }

    let isCancelled = false;

    const refresh = async () => {
      try {
        const [dismissedId, response] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          fetch(statusUrl, { cache: "no-store" }),
        ]);
        const json = await response.json();
        const parsed = incidentPayloadSchema.safeParse(json);

        if (!parsed.success) {
          if (!isCancelled) {
            setIncident(null);
          }
          return;
        }

        const id = deriveIncidentId(parsed.data);
        const isIncident =
          parsed.data.level === "degraded" || parsed.data.level === "incident";

        if (
          !isCancelled &&
          parsed.data.message &&
          id &&
          isIncident &&
          dismissedId !== id
        ) {
          setIncident({ id, message: parsed.data.message });
          return;
        }

        if (!isCancelled) {
          setIncident(null);
        }
      } catch {
        if (!isCancelled) {
          setIncident(null);
        }
      }
    };

    void refresh();
    const interval = setInterval(() => {
      void refresh();
    }, REFRESH_INTERVAL_MS);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, []);

  const dismiss = async () => {
    if (!incident) {
      return;
    }

    await AsyncStorage.setItem(STORAGE_KEY, incident.id);
    setIncident(null);
  };

  return {
    incident,
    dismiss,
  };
}
