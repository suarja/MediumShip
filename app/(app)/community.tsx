import * as WebBrowser from "expo-web-browser";
import { useGoBack } from "../../src/features/navigation/app-navigation";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Screen } from "../../src/components/layout/screen";
import { useTabBarSpace } from "../../src/components/navigation/app-tab-bar";
import { usePersistentMediaPlayerSpace } from "../../src/features/media/persistent-media-player";
import { HapticsService } from "../../src/features/haptics/haptics";
import { usePaywallSheet } from "../../src/features/paywall/paywall-sheet-provider";
import { useIsMember } from "../../src/features/membership/use-is-member";
import { FeatureAccessGate } from "../../src/components/navigation/feature-access-gate";
import { hasCapability } from "../../src/features/tenant/public-config";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { withAlpha } from "../../src/features/theme/contrast";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";

const COMMUNITY_LINK_ICON: Record<string, string> = {
  discord: "#",
  telegram: "✈",
  whatsapp: "◎",
  newsletter: "✉",
};

export default function CommunityScreen() {
  const { t } = useTranslation("explore");
  const { theme, enabledModules } = useAppTheme();
  const { isTablet, scaleFont, scaleSpace } = useResponsive();
  const tabBarSpace = useTabBarSpace();
  const persistentPlayerSpace = usePersistentMediaPlayerSpace();
  const goBack = useGoBack("/explore");
  const insets = useSafeAreaInsets();
  const { openPaywall } = usePaywallSheet();
  const { isMember } = useIsMember();
  const canMembersRoom = hasCapability(enabledModules, "membersRoom");

  const handleMembersRoom = () => {
    if (!isMember) {
      openPaywall("members");
      return;
    }
  };

  const handleDiscord = () => {
    void WebBrowser.openBrowserAsync("https://discord.gg");
  };

  return (
    <FeatureAccessGate featureKey="community">
    <Screen>
      <View
        style={[
          styles.topBar,
          { marginHorizontal: -(theme.spacing.lg * scaleSpace) },
        ]}
      >
        <Pressable
          onPress={() => {
            void HapticsService.selection();
            goBack();
          }}
          style={styles.backBtn}
          accessibilityRole="button"
        >
          <Text style={[styles.backLabel, { color: theme.colors.heading, fontSize: 22 * scaleFont }]}>
            ‹
          </Text>
        </Pressable>
        <Text
          style={[styles.topBarTitle, { color: theme.colors.heading, fontSize: 18 * scaleFont }]}
        >
          {t("modules.community.title")}
        </Text>
        <View style={styles.topBarSide} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            gap: theme.spacing.md * scaleSpace,
            paddingBottom: tabBarSpace + persistentPlayerSpace + insets.bottom + 24,
            ...(isTablet ? { maxWidth: 640, alignSelf: "center" as const, width: "100%" as const } : {}),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.hero,
            {
              borderRadius: theme.radii.lg,
              backgroundColor: withAlpha(theme.colors.accent, theme.isDark ? 0.14 : 0.06),
              padding: 20 * scaleSpace,
              gap: 12 * scaleSpace,
            },
          ]}
        >
          <Text
            style={[
              styles.heroEyebrow,
              { color: theme.colors.accent, fontSize: 12 * scaleFont },
            ]}
          >
            ◉ REJOINDRE
          </Text>
          <Text
            style={[
              styles.heroTitle,
              { color: theme.colors.heading, fontSize: 22 * scaleFont },
            ]}
          >
            Prolongez la conversation{" "}
            <Text style={styles.heroTitleItalic}>hors de l'app.</Text>
          </Text>
          <Text
            style={[
              styles.heroSub,
              { color: theme.colors.textMuted, fontSize: 13 * scaleFont },
            ]}
          >
            12 400 membres · 84 cercles locaux · accès libre ou réservé selon le module.
          </Text>
          <Pressable
            onPress={() => {
              void HapticsService.medium();
              handleDiscord();
            }}
            style={({ pressed }) => [
              styles.heroCta,
              {
                borderRadius: theme.radii.pill,
                backgroundColor: theme.colors.accent,
                paddingVertical: 12 * scaleSpace,
              },
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.heroCtaLabel,
                { color: theme.colors.accentContrast, fontSize: 14 * scaleFont },
              ]}
            >
              Rejoindre la communauté
            </Text>
          </Pressable>
        </View>

        <CommunityCard
          title="Discord communautaire"
          description="Échangez avec les rédactions et les membres. Lien ouvert à tous."
          icon="#"
          stat="42 salons"
          accessLabel="Gratuit"
          isPremium={false}
          onPress={handleDiscord}
        />

        {canMembersRoom ? (
          <CommunityCard
            title="Salon membres"
            description="Espace réservé : AMA, coulisses, votes éditoriaux."
            icon="✦"
            stat="8 fils actifs"
            accessLabel="Premium"
            isPremium
            onPress={handleMembersRoom}
          />
        ) : null}
      </ScrollView>
    </Screen>
    </FeatureAccessGate>
  );
}

function CommunityCard({
  title,
  description,
  icon,
  stat,
  accessLabel,
  isPremium,
  onPress,
}: {
  title: string;
  description: string;
  icon: string;
  stat: string;
  accessLabel: string;
  isPremium: boolean;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const accentColor = isPremium ? theme.colors.premium : theme.colors.accent;

  return (
    <Pressable
      onPress={() => {
        if (isPremium) void HapticsService.medium();
        else void HapticsService.light();
        onPress();
      }}
      style={({ pressed }) => [
        styles.card,
        {
          borderRadius: theme.radii.lg,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          padding: 16 * scaleSpace,
          gap: 8 * scaleSpace,
        },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
    >
      <View style={[styles.cardHead, { gap: 10 * scaleSpace }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.heading, fontSize: 16 * scaleFont }]}>
          {title}
        </Text>
        <Text style={[styles.cardIcon, { color: accentColor, fontSize: 18 * scaleFont }]}>
          {icon}
        </Text>
      </View>
      <Text style={[styles.cardDesc, { color: theme.colors.textMuted, fontSize: 13 * scaleFont }]}>
        {description}
      </Text>
      <View style={[styles.cardStat, { gap: 8 * scaleSpace }]}>
        <Text style={[styles.cardStatLabel, { color: theme.colors.textMuted, fontSize: 12 * scaleFont }]}>
          {stat}
        </Text>
        <View
          style={[
            styles.accessBadge,
            {
              borderRadius: theme.radii.pill,
              borderColor: withAlpha(accentColor, 0.4),
              borderWidth: StyleSheet.hairlineWidth,
              paddingHorizontal: 8 * scaleSpace,
              paddingVertical: 2 * scaleSpace,
            },
          ]}
        >
          <Text style={[styles.accessLabel, { color: accentColor, fontSize: 12 * scaleFont }]}>
            {accessLabel.toUpperCase()}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 34,
    alignItems: "flex-start",
  },
  backLabel: {
    fontFamily: fontFamilies.body,
    lineHeight: 28,
  },
  topBarTitle: {
    flex: 1,
    fontFamily: fontFamilies.display,
    letterSpacing: -0.2,
    textAlign: "center",
  },
  topBarSide: {
    width: 34,
  },
  content: {},
  hero: {},
  heroEyebrow: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.4,
  },
  heroTitleItalic: {
    fontFamily: fontFamilies.displayItalic,
  },
  heroSub: {
    fontFamily: fontFamilies.body,
    lineHeight: 20,
  },
  heroCta: {
    alignItems: "center",
  },
  heroCtaLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    textAlign: "center",
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.2,
    flex: 1,
  },
  cardIcon: {
    fontFamily: fontFamilies.mono,
  },
  cardDesc: {
    fontFamily: fontFamilies.body,
    lineHeight: 18,
  },
  cardStat: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardStatLabel: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.4,
    flex: 1,
  },
  accessBadge: {},
  accessLabel: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  pressed: {
    opacity: 0.84,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centerText: {
    fontFamily: fontFamilies.body,
  },
});
