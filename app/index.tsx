import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useMutation, useQuery } from "convex/react";

import { api } from "../convex/_generated/api";
import { Screen } from "../src/components/layout/screen";
import { defaultTenant } from "../src/features/tenant/default-tenant";

export default function ConvexSliceScreen() {
  const tenant = useQuery(api.tenants.queries.getDefaultTenant, {});
  const seedDemoTenant = useMutation(api.tenants.seed.seedDemoContent);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      await seedDemoTenant({});
    } catch (error) {
      Alert.alert(
        "Convex seed failed",
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>Convex slice</Text>
        <Text style={styles.title}>MediumShip backend connectivity</Text>
        <Text style={styles.description}>
          This screen proves the first end-to-end Convex path in the app:
          query the default tenant and seed it if it does not exist yet.
        </Text>

        {tenant === undefined ? (
          <View style={styles.card}>
            <ActivityIndicator color="#B42318" />
            <Text style={styles.cardText}>Loading tenant from Convex...</Text>
          </View>
        ) : tenant === null ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>No tenant found yet</Text>
            <Text style={styles.cardText}>
              Expected seed slug: <Text style={styles.code}>{defaultTenant.slug}</Text>
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
                {isSeeding ? "Seeding..." : "Seed demo tenant"}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tenant loaded from Convex</Text>
            <Text style={styles.cardText}>Name: {tenant.name}</Text>
            <Text style={styles.cardText}>Slug: {tenant.slug}</Text>
            <Text style={styles.cardText}>
              Modules: {tenant.enabledModules.join(", ")}
            </Text>
          </View>
        )}
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
  code: {
    fontFamily: "Courier",
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
});
