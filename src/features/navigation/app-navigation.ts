import { useCallback } from "react";
import {
  useGlobalSearchParams,
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

function readReturnToParam(
  params: Record<string, string | string[] | undefined>,
): string | null {
  const raw = params[RETURN_TO_PARAM];
  return normalizeReturnTo(Array.isArray(raw) ? raw[0] : raw);
}

/** Serialize a back target so nested screens can restore prior returnTo chains. */
export function encodeReturnTo(returnTo: string | Href): string | null {
  if (typeof returnTo === "string") {
    return normalizeReturnTo(returnTo);
  }

  const pathname = returnTo.pathname;
  if (!pathname?.startsWith("/")) {
    return null;
  }

  const params = returnTo.params ?? {};
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      qs.set(key, value);
    }
  }

  const query = qs.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/** Back target for the screen being left — preserves a parent returnTo chain. */
export function buildBackTarget(
  pathname: string,
  parentReturnTo: string | undefined,
): string {
  const parent = normalizeReturnTo(parentReturnTo);
  if (!parent) {
    return pathname;
  }

  return encodeReturnTo(appendReturnTo(pathname, parent)) ?? pathname;
}

/**
 * Attach the current screen as the explicit back target for stack overlays and
 * tab pushes. Expo Router tabs can reset to the default tab on `router.back()`
 * after leaving a root-stack screen — `returnTo` restores the real origin.
 */
export function appendReturnTo(href: StringHref, returnTo: string | Href): Href;
export function appendReturnTo(href: Href, returnTo: string | Href): Href;
export function appendReturnTo(
  href: StringHref | Href,
  returnTo: string | Href,
): Href {
  const encoded = encodeReturnTo(returnTo);
  if (!encoded) {
    return href as Href;
  }

  if (typeof href === "object") {
    return {
      ...href,
      params: {
        ...(href.params ?? {}),
        [RETURN_TO_PARAM]: encoded,
      },
    } as Href;
  }

  const [pathname, query = ""] = href.split("?");
  const listMatch = pathname.match(/^\/list\/([^/]+)$/);
  if (listMatch) {
    return {
      pathname: "/list/[id]",
      params: {
        id: listMatch[1],
        ...Object.fromEntries(new URLSearchParams(query)),
        [RETURN_TO_PARAM]: encoded,
      },
    } as Href;
  }

  const existingParams = Object.fromEntries(new URLSearchParams(query));
  return {
    pathname,
    params: {
      ...existingParams,
      [RETURN_TO_PARAM]: encoded,
    },
  } as Href;
}

export function usePushWithReturn() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams<Record<string, string | string[]>>();

  return useCallback(
    (href: StringHref | Href) => {
      const backTarget = buildBackTarget(pathname, readReturnToParam(params) ?? undefined);
      const target =
        typeof href === "string"
          ? appendReturnTo(href, backTarget)
          : appendReturnTo(href as Href, backTarget);
      router.push(target as never);
    },
    [params, pathname, router],
  );
}

export function useGoBack(fallback: Href = "/home") {
  const router = useRouter();
  const localParams = useLocalSearchParams<Record<string, string | string[]>>();
  const globalParams = useGlobalSearchParams<Record<string, string | string[]>>();

  return useCallback(() => {
    const returnTo =
      readReturnToParam(localParams) ?? readReturnToParam(globalParams);

    if (returnTo) {
      router.replace(returnTo as Href);
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(fallback);
  }, [fallback, globalParams, localParams, router]);
}
