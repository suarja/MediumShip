import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "../../features/theme/theme-provider";

type MemberGateCardProps = {
  title: string;
  description: string;
  ctaLabel: string;
};

export function MemberGateCard({
  title,
  description,
  ctaLabel,
}: MemberGateCardProps) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: theme.radii.lg,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        },
      ]}
    >
      <Text style={[styles.title, { color: theme.colors.heading }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.colors.textMuted }]}>
        {description}
      </Text>
      <Link href="/sign-in" asChild>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            {
              borderRadius: theme.radii.pill,
              backgroundColor: theme.colors.accent,
            },
            pressed && styles.buttonPressed,
          ]}
        >
          <Text
            style={[styles.buttonText, { color: theme.colors.accentContrast }]}
          >
            {ctaLabel}
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    borderWidth: 1,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
