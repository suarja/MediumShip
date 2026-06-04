import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

type PremiumAccessBannerProps = {
  title: string;
  description: string;
  ctaLabel: string;
};

export function PremiumAccessBanner({
  title,
  description,
  ctaLabel,
}: PremiumAccessBannerProps) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: theme.radii.lg,
          backgroundColor: theme.colors.premiumSoft,
          borderColor: theme.colors.premium,
        },
      ]}
    >
      <Text style={[styles.title, { color: theme.colors.heading }]}>
        ★ {title}
      </Text>
      <Text style={[styles.body, { color: theme.colors.text }]}>
        {description}
      </Text>
      <Link href="/sign-in" asChild>
        <Pressable
          accessibilityRole="link"
          style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
        >
          <Text style={[styles.ctaLabel, { color: theme.colors.premium }]}>
            {ctaLabel} →
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
    padding: 18,
    marginTop: 4,
    borderWidth: 1,
  },
  title: {
    fontFamily: fontFamilies.displayBold,
    fontSize: 17,
  },
  body: {
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 22,
  },
  cta: {
    alignSelf: "flex-start",
    paddingTop: 4,
  },
  ctaLabel: {
    fontFamily: fontFamilies.mono,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.84,
  },
});
