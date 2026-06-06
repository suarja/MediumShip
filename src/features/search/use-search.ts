import { useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";

import { api } from "../../../convex/_generated/api";
import { useAppTheme } from "../theme/theme-provider";

export function useSearch(rawQuery: string) {
  const { tenantSlug } = useAppTheme();
  const [debouncedQuery, setDebouncedQuery] = useState(rawQuery);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(rawQuery);
    }, 250);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [rawQuery]);

  const skip = debouncedQuery.trim().length === 0;

  const data = useQuery(
    api.content.queries.searchPublished,
    skip ? "skip" : { tenantSlug, query: debouncedQuery.trim() },
  );

  return {
    results: data?.contents ?? [],
    isSearching: !skip && data === undefined,
  };
}
