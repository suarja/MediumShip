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

export default function ConvexSliceScreen() {
  const { t } = useTranslation("home");
  const tenant = useQuery(api.tenants.queries.getDefaultTenant, {});
  const seedDemoTenant = useMutation(api.tenants.seed.seedDemoContent);
  const [isSeeding, setIsSeeding] = useState(false);

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
        <Text style={styles.eyebrow}>{t("eyebrow")}</Text>
        <Text style={styles.title}>{t("title")}</Text>
        <Text style={styles.description}>{t("description")}</Text>

        {tenant === undefined ? (
          <View style={styles.card}>
            <ActivityIndicator color="#B42318" />
            <Text style={styles.cardText}>{t("loadingTenant")}</Text>
          </View>
        ) : tenant === null ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("emptyState.title")}</Text>
            <Text style={styles.cardText}>
              {t("emptyState.expectedSeedSlug", { slug: defaultTenant.slug })}
            </Text>
            <Pressable
              onPress={handleSeed}
              disabled={isSeeding}
              style={({ pressed }) => [
                styles.button,
                (pressed || isSeeding) && styles.buttonPressed,
              ]}
            >
              <Text style={styles.buttonText}>
                {isSeeding ? t("emptyState.ctaBusy") : t("emptyState.ctaIdle")}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("loadedState.title")}</Text>
            <Text style={styles.cardText}>
              {t("loadedState.name", { value: tenant.name })}
            </Text>
            <Text style={styles.cardText}>
              {t("loadedState.slug", { value: tenant.slug })}
            </Text>
            <Text style={styles.cardText}>
              {t("loadedState.modules", {
                value: tenant.enabledModules.join(", "),
              })}
            </Text>
          </View>
        )}

        <Link href="/profile" asChild>
          <Pressable style={({ pressed }) => [styles.link, pressed && styles.buttonPressed]}>
            <Text style={styles.linkText}>{t("openProfile")}</Text>
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
    color: "#B42318",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: {
    color: "#101828",
    fontSize: 28,
    fontWeight: "700",
  },
  description: {
    color: "#475467",
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    gap: 12,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  cardTitle: {
    color: "#101828",
    fontSize: 18,
    fontWeight: "700",
  },
  cardText: {
    color: "#344054",
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#B42318",
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
    color: "#B42318",
    fontSize: 15,
    fontWeight: "600",
  },
});
