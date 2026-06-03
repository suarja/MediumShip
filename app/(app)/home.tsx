import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Link } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { useTranslation } from "react-i18next";

import { api } from "../../convex/_generated/api";
import { Screen } from "../../src/components/layout/screen";
import { defaultTenant } from "../../src/features/tenant/default-tenant";
import { useAppTheme } from "../../src/features/theme/theme-provider";

export default function ConvexSliceScreen() {
  const { t } = useTranslation("home");
  const tenant = useQuery(api.tenants.queries.getDefaultTenant, {});
  const seedDemoTenant = useMutation(api.tenants.seed.seedDemoContent);
  const [isSeeding, setIsSeeding] = useState(false);
  const { theme } = useAppTheme();

  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      await seedDemoTenant({});
    } catch (error) {
      Alert.alert(
        t("seedFailedTitle"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={[styles.eyebrow, { color: theme.colors.accent }]}>
          {t("eyebrow")}
        </Text>
        <Text style={[styles.title, { color: theme.colors.heading }]}>{t("title")}</Text>
        <Text style={[styles.description, { color: theme.colors.textMuted }]}>
          {t("description")}
        </Text>

        {tenant === undefined ? (
          <View
            style={[
              styles.card,
              {
                borderRadius: theme.radii.lg,
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <ActivityIndicator color={theme.colors.accent} />
            <Text style={[styles.cardText, { color: theme.colors.text }]}>
              {t("loadingTenant")}
            </Text>
          </View>
        ) : tenant === null ? (
          <View
            style={[
              styles.card,
              {
                borderRadius: theme.radii.lg,
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.colors.heading }]}>
              {t("emptyState.title")}
            </Text>
            <Text style={[styles.cardText, { color: theme.colors.text }]}>
              {t("emptyState.expectedSeedSlug", { slug: defaultTenant.slug })}
            </Text>
            <Pressable
              onPress={handleSeed}
              disabled={isSeeding}
              style={({ pressed }) => [
                styles.button,
                {
                  borderRadius: theme.radii.pill,
                  backgroundColor: theme.colors.accent,
                },
                (pressed || isSeeding) && styles.buttonPressed,
              ]}
            >
              <Text style={styles.buttonText}>
                {isSeeding ? t("emptyState.ctaBusy") : t("emptyState.ctaIdle")}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={[
              styles.card,
              {
                borderRadius: theme.radii.lg,
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.colors.heading }]}>
              {t("loadedState.title")}
            </Text>
            <Text style={[styles.cardText, { color: theme.colors.text }]}>
              {t("loadedState.name", { value: tenant.name })}
            </Text>
            <Text style={[styles.cardText, { color: theme.colors.text }]}>
              {t("loadedState.slug", { value: tenant.slug })}
            </Text>
            <Text style={[styles.cardText, { color: theme.colors.text }]}>
              {t("loadedState.modules", {
                value: tenant.enabledModules.join(", "),
              })}
            </Text>
            <Text style={[styles.cardText, { color: theme.colors.textMuted }]}>
              Palette: {tenant.themeConfig?.paletteName ?? defaultTenant.themeConfig.paletteName}
            </Text>
          </View>
        )}

        <Link href="/profile" asChild>
          <Pressable style={({ pressed }) => [styles.link, pressed && styles.buttonPressed]}>
            <Text style={[styles.linkText, { color: theme.colors.accent }]}>
              {t("openProfile")}
            </Text>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
    justifyContent: "center",
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    gap: 12,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  cardText: {
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  link: {
    alignSelf: "flex-start",
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
