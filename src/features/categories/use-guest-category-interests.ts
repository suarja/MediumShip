import { useCallback, useEffect, useState } from "react";

import { requestDiscoveryFeedRefresh } from "../discovery/discovery-feed-refresh";
import {
  getGuestCategoryInterests,
  setGuestCategoryInterests,
} from "./guest-category-interests";

/**
 * Guest-local category interests with the same shape the picker expects.
 * Selection persists to AsyncStorage and survives app restarts until the user
 * signs in (where it is synced to the server and cleared).
 */
export function useGuestCategoryInterests(): {
  selectedKeys: Set<string>;
  isLoading: boolean;
  applyCategoryInterests: (keys: ReadonlySet<string>) => Promise<void>;
} {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getGuestCategoryInterests().then((keys) => {
      if (active) {
        setSelectedKeys(new Set(keys));
        setIsLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const applyCategoryInterests = useCallback(async (keys: ReadonlySet<string>) => {
    const next = new Set(keys);
    setSelectedKeys(next);
    await setGuestCategoryInterests([...next]);
    requestDiscoveryFeedRefresh();
  }, []);

  return { selectedKeys, isLoading, applyCategoryInterests };
}
