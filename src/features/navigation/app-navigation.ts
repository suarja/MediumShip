import { useCallback } from "react";
import {
  useLocalSearchParams,
  usePathname,
  useRouter,
  type Href,
} from "expo-router";

export const RETURN_TO_PARAM = "returnTo";

type StringHref = string;

function normalizeReturnTo(returnTo: string | undefined): string | null {
  if (!returnTo || !returnTo.startsWith("/")) {
    return null;
  }
  return returnTo;
}

/**
 * Attach the current screen as the explicit back target for stack overlays and
 * tab pushes. Expo Router tabs can reset to the default tab on `router.back()`
 * after leaving a root-stack screen — `returnTo` restores the real origin.
 */
export function appendReturnTo(href: StringHref, returnTo: string): Href;
export function appendReturnTo(href: Href, returnTo: string): Href;
export function appendReturnTo(href: StringHref | Href, returnTo: string): Href {
  const normalized = normalizeReturnTo(returnTo);
  if (!normalized) {
    return href as Href;
  }

  if (typeof href === "string") {
    const [pathname, query = ""] = href.split("?");
    const params = new URLSearchParams(query);
    params.set(RETURN_TO_PARAM, normalized);
    const qs = params.toString();
    return `${pathname}?${qs}` as Href;
  }

  return {
    ...href,
    params: {
      ...(href.params ?? {}),
      [RETURN_TO_PARAM]: normalized,
    },
  } as Href;
}

export function usePushWithReturn() {
  const router = useRouter();
  const pathname = usePathname();

  return useCallback(
    (href: StringHref | Href) => {
      const target =
        typeof href === "string"
          ? appendReturnTo(href, pathname)
          : appendReturnTo(href as Href, pathname);
      router.push(target as never);
    },
    [pathname, router],
  );
}

export function useGoBack(fallback: Href = "/home") {
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string | string[]>>();

  return useCallback(() => {
    const raw = params[RETURN_TO_PARAM];
    const returnTo = normalizeReturnTo(Array.isArray(raw) ? raw[0] : raw);

    if (returnTo) {
      router.replace(returnTo as Href);
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(fallback);
  }, [fallback, params, router]);
}
