import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState, Linking, Platform } from "react-native";

import { notificationsModule } from "./bootstrap";
import { RationaleModal } from "./rationale-modal";

export type PermissionStatus =
  | "granted"
  | "denied"
  | "undetermined"
  | "loading";

type PermissionContextValue = {
  status: PermissionStatus;
  requestPermissionExplicit: (options?: { showRationale?: boolean }) => Promise<PermissionStatus>;
  openSettings: () => void;
};

const PermissionContext = createContext<PermissionContextValue | null>(null);

function mapExpoStatus(
  status: import("expo-notifications").PermissionStatus | undefined,
): PermissionStatus {
  if (status === "granted") {
    return "granted";
  }
  if (status === "denied") {
    return "denied";
  }
  return "undetermined";
}

async function readPermissionStatus(): Promise<PermissionStatus> {
  if (!notificationsModule || Platform.OS === "web") {
    return "denied";
  }

  const { status } = await notificationsModule.getPermissionsAsync();
  return mapExpoStatus(status);
}

export function NotificationPermissionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<PermissionStatus>("loading");
  const inFlightRef = useRef<Promise<PermissionStatus> | null>(null);
  const [modalState, setModalState] = useState<{
    visible: boolean;
    resolve?: (decision: "confirm" | "dismiss") => void;
  }>({ visible: false });

  const refresh = useCallback(async () => {
    try {
      setStatus(await readPermissionStatus());
    } catch {
      setStatus("undetermined");
    }
  }, []);

  useEffect(() => {
    void refresh();
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") {
        void refresh();
      }
    });
    return () => subscription.remove();
  }, [refresh]);

  const showRationaleModal = useCallback((): Promise<"confirm" | "dismiss"> => {
    return new Promise((resolve) => {
      setModalState({ visible: true, resolve });
    });
  }, []);

  const closeModal = useCallback((decision: "confirm" | "dismiss") => {
    setModalState((previous) => {
      previous.resolve?.(decision);
      return { visible: false };
    });
  }, []);

  const requestPermissionExplicit = useCallback(
    async (options?: { showRationale?: boolean }): Promise<PermissionStatus> => {
      if (inFlightRef.current) {
        return inFlightRef.current;
      }

      const promise = (async (): Promise<PermissionStatus> => {
        if (!notificationsModule || Platform.OS === "web") {
          return "denied";
        }

        try {
          const current = await readPermissionStatus();
          if (current === "granted") {
            setStatus("granted");
            return "granted";
          }

          if (current === "denied") {
            setStatus("denied");
            return "denied";
          }

          if (options?.showRationale) {
            const decision = await showRationaleModal();
            if (decision === "dismiss") {
              return "undetermined";
            }
          }

          const result = await notificationsModule.requestPermissionsAsync();
          const next = mapExpoStatus(result.status);
          setStatus(next);
          return next;
        } catch {
          setStatus("undetermined");
          return "undetermined";
        } finally {
          inFlightRef.current = null;
        }
      })();

      inFlightRef.current = promise;
      return promise;
    },
    [showRationaleModal],
  );

  const openSettings = useCallback(() => {
    void Linking.openURL("app-settings:").catch(() => {});
  }, []);

  const value = useMemo(
    () => ({
      status,
      requestPermissionExplicit,
      openSettings,
    }),
    [status, requestPermissionExplicit, openSettings],
  );

  return (
    <PermissionContext.Provider value={value}>
      {children}
      <RationaleModal
        visible={modalState.visible}
        onConfirm={() => closeModal("confirm")}
        onDismiss={() => closeModal("dismiss")}
      />
    </PermissionContext.Provider>
  );
}

export function usePermissionStatus(): { status: PermissionStatus } {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error(
      "usePermissionStatus must be used inside NotificationPermissionProvider",
    );
  }
  return { status: context.status };
}

export function useRequestPermission(): {
  requestPermissionExplicit: PermissionContextValue["requestPermissionExplicit"];
  openSettings: PermissionContextValue["openSettings"];
} {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error(
      "useRequestPermission must be used inside NotificationPermissionProvider",
    );
  }
  return {
    requestPermissionExplicit: context.requestPermissionExplicit,
    openSettings: context.openSettings,
  };
}
