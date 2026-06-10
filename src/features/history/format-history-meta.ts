import type { TFunction } from "i18next";

import type { ContentKind } from "../content/types";

export function formatHistoryOpenedAt(openedAt: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(openedAt),
  );
}

export function formatHistoryRowMeta(
  args: {
    kind: ContentKind;
    openedAt: number;
    progressRatio?: number;
  },
  t: TFunction<"library">,
  locale: string,
): string {
  const kindLabel = t(`kinds.${args.kind}`);
  const date = formatHistoryOpenedAt(args.openedAt, locale);

  if (args.progressRatio !== undefined) {
    return t("historyScreen.rowMetaWithProgress", {
      kind: kindLabel,
      date,
      percent: Math.round(args.progressRatio * 100),
    });
  }

  return t("historyScreen.rowMeta", {
    kind: kindLabel,
    date,
  });
}
