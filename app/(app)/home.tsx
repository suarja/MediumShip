import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useQuery } from "convex/react";
import { useTranslation } from "react-i18next";

import { api } from "../../convex/_generated/api";
import { ContentCard } from "../../src/components/content/content-card";
import { Screen } from "../../src/components/layout/screen";
import { toContentCardModel } from "../../src/features/content/selectors";
import type { ContentDoc } from "../../src/features/content/types";
import { defaultTenant } from "../../src/features/tenant/default-tenant";
import { useAppTheme } from "../../src/features/theme/theme-provider";

export default function HomeFeedScreen() {
  const { t } = useTranslation("home");
  const { theme } = useAppTheme();

  const contents = useQuery(api.content.queries.listPublishedFeed, {
    tenantSlug: defaultTenant.slug,
  }) as ContentDoc[] | undefined;

  const items = (contents ?? []).map(toContentCardModel);
  const isLoading = contents === undefined;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: theme.colors.accent }]}>
          {t("eyebrow")}
        </Text>
        <Text style={[styles.title, { color: theme.colors.heading }]}>
          {t("feedTitle")}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          {t("feedSubtitle")}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {items.length === 0 ? (
          <View
            style={[
              styles.empty,
              {
                borderRadius: theme.radii.lg,
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.emptyTitle, { color: theme.colors.heading }]}>
              {isLoading ? t("loadingTitle") : t("emptyTitle")}
            </Text>
            <Text style={[styles.emptyBody, { color: theme.colors.textMuted }]}>
              {isLoading ? t("loadingBody") : t("emptyBody")}
            </Text>
          </View>
        ) : (
          items.map((item) => <ContentCard key={item.id} item={item} />)
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 6, marginBottom: 16 },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { fontSize: 15, lineHeight: 21 },
  scroll: { flex: 1 },
  list: { gap: 12, paddingBottom: 24 },
  empty: { gap: 8, padding: 20, borderWidth: StyleSheet.hairlineWidth },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyBody: { fontSize: 15, lineHeight: 22 },
});
