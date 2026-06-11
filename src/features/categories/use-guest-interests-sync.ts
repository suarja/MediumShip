import { useEffect, useRef } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import { useAppTheme } from "../theme/theme-provider";
import {
  clearGuestCategoryInterests,
  getGuestCategoryInterests,
} from "./guest-category-interests";

/**
 * On the first authenticated session with pending guest-local interests, merges
 * them into the user's server interests (union) and clears the local copy.
 * Mount once, high in the tree (inside AppThemeProvider for `tenantSlug`).
 */
export function GuestInterestsSync(): null {
  const { tenantSlug } = useAppTheme();
  const { isAuthenticated } = useConvexAuth();
  const serverKeys = useQuery(
    api.categories.interests.getMyCategoryInterests,
    isAuthenticated ? { tenantSlug } : "skip",
  );
  const setCategoryInterests = useMutation(api.categories.interests.setCategoryInterests);
  const didSync = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || didSync.current || serverKeys === undefined) {
      return;
    }
    didSync.current = true;

    void (async () => {
      const guestKeys = await getGuestCategoryInterests();
      if (guestKeys.length === 0) {
        return;
      }
      const merged = Array.from(
        new Set([...(Array.isArray(serverKeys) ? serverKeys : []), ...guestKeys]),
      );
      await setCategoryInterests({ tenantSlug, categoryKeys: merged });
      await clearGuestCategoryInterests();
    })();
  }, [isAuthenticated, serverKeys, setCategoryInterests, tenantSlug]);

  return null;
}
