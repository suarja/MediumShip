import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Screen } from "../../src/components/layout/screen";
import { DownloadedLibrarySection } from "../../src/components/library/downloaded-library-section";
import { ResumeCard } from "../../src/components/library/resume-card";
import { SavedLibrarySection } from "../../src/components/library/saved-library-section";
import { useTabBarSpace } from "../../src/components/navigation/app-tab-bar";
import { useClerkAuth } from "../../src/features/auth/use-clerk-auth";
import { usePersistentMediaPlayerSpace } from "../../src/features/media/persistent-media-player";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { withAlpha } from "../../src/features/theme/contrast";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";

const SECTION_KEYS = ["resume", "saved", "lists", "offline"] as const;

export default function LibraryScreen() {
  const { t } = useTranslation("library");
  const { isSignedIn } = useClerkAuth();
  const router = useRouter();
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const tabBarSpace = useTabBarSpace();
  const persistentPlayerSpace = usePersistentMediaPlayerSpace();

  if (!isSignedIn) {
    return (
      <Screen>
        <View
          style={[
            styles.topBar,
            { marginHorizontal: -(theme.spacing.lg * scaleSpace) },
          ]}
        >
          <View style={styles.topBarSide} />
          <Text
            style={[
              styles.topBarTitle,
              {
                color: theme.colors.heading,
                fontSize: 18 * scaleFont,
              },
            ]}
          >
            {t("library:screen.title")}
          </Text>
          <View style={styles.topBarSide} />
        </View>

        <View
          style={[
            styles.gateScreen,
            {
              paddingBottom: tabBarSpace + persistentPlayerSpace,
              paddingHorizontal: 32 * scaleSpace,
              paddingTop: 120 * scaleSpace,
            },
          ]}
        >
          <View
            style={[
              styles.crest,
              {
                borderRadius: theme.radii.lg,
                backgroundColor: theme.colors.accent,
              },
            ]}
          >
            <Text
              style={[
                styles.crestLabel,
                {
                  color: theme.colors.accentContrast,
                  fontSize: 30 * scaleFont,
                },
              ]}
            >
              M
            </Text>
          </View>

          <Text
            style={[
              styles.gateTitle,
              {
                color: theme.colors.heading,
                fontSize: 26 * scaleFont,
              },
            ]}
          >
            {t("library:screen.guestTitle")}
          </Text>
          <Text
            style={[
              styles.gateBody,
              {
                color: theme.colors.textMuted,
                fontSize: 13 * scaleFont,
              },
            ]}
          >
            {t("library:screen.guestBody")}
          </Text>

          <View
            style={[
              styles.gateActions,
              {
                gap: theme.spacing.sm * scaleSpace,
                marginTop: theme.spacing.xs * scaleSpace,
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/sign-in")}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  borderRadius: theme.radii.pill,
                  backgroundColor: theme.colors.heading,
                },
                pressed && styles.buttonPressed,
              ]}
            >
              <Text
                style={[
                  styles.primaryButtonLabel,
                  {
                    color: theme.colors.canvas,
                    fontSize: 15 * scaleFont,
                  },
                ]}
              >
                {t("library:actions.signInCta")}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace("/home")}
              style={({ pressed }) => [
                styles.secondaryButton,
                {
                  borderRadius: theme.radii.pill,
                  borderColor: withAlpha(theme.colors.heading, theme.isDark ? 0.2 : 0.12),
                },
                pressed && styles.buttonPressed,
              ]}
            >
              <Text
                style={[
                  styles.secondaryButtonLabel,
                  {
                    color: theme.colors.heading,
                    fontSize: 14 * scaleFont,
                  },
                ]}
              >
                {t("library:screen.guestContinueCta")}
              </Text>
            </Pressable>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom:
              tabBarSpace + persistentPlayerSpace + theme.spacing.xxl * scaleSpace,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.topBar,
            { marginHorizontal: -(theme.spacing.lg * scaleSpace) },
          ]}
        >
          <View style={styles.topBarSide} />
          <Text
            style={[
              styles.topBarTitle,
              {
                color: theme.colors.heading,
                fontSize: 18 * scaleFont,
              },
            ]}
          >
            {t("library:screen.title")}
          </Text>
          <Text
            style={[
              styles.topBarAction,
              {
                color: theme.colors.heading,
                fontSize: 19 * scaleFont,
                lineHeight: 34,
              },
            ]}
          >
            ⌕
          </Text>
        </View>

        <View style={[styles.filters, { marginBottom: theme.spacing.xl * scaleSpace }]}>
          {(["all", "articles", "podcasts", "offline"] as const).map((key, index) => (
            <View
              key={key}
              style={[
                styles.filterChip,
                {
                  borderRadius: theme.radii.pill,
                  borderColor:
                    index === 0 ? theme.colors.heading : withAlpha(theme.colors.heading, 0.12),
                  backgroundColor: index === 0 ? theme.colors.heading : "transparent",
                },
              ]}
            >
              <Text
                style={[
                  styles.filterChipLabel,
                  {
                    color: index === 0 ? theme.colors.canvas : theme.colors.textMuted,
                    fontSize: 10 * scaleFont,
                  },
                ]}
              >
                {t(`library:screen.filters.${key}`)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionBlockFirst}>
          <SectionHeader label={t("library:screen.sections.resume")} />
          <ResumeCard />
        </View>

        <View style={styles.sectionBlock}>
          <SavedLibrarySection />
        </View>

        <View style={styles.sectionBlock}>
          <SectionHeader
            label={t("library:screen.sections.lists")}
            meta={t("library:screen.listsMeta")}
          />
          <PlaceholderCard
            body={t("library:screen.listsBody")}
            title={t("library:screen.listsTitle")}
          />
        </View>

        <View style={styles.sectionBlock}>
          <DownloadedLibrarySection />
        </View>
      </ScrollView>
    </Screen>
  );
}

function SectionHeader({
  label,
  meta,
}: {
  label: string;
  meta?: string;
}) {
  const { theme } = useAppTheme();
  const { scaleFont } = useResponsive();

  return (
    <View style={styles.sectionHeader}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: theme.colors.heading,
            fontSize: 18 * scaleFont,
          },
        ]}
      >
        {label}
      </Text>
      {meta ? (
        <Text
          style={[
            styles.sectionMeta,
            {
              color: theme.colors.textMuted,
              fontSize: 10 * scaleFont,
            },
          ]}
        >
          {meta}
        </Text>
      ) : null}
    </View>
  );
}

function PlaceholderCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  const { theme } = useAppTheme();
  const { scaleFont } = useResponsive();

  return (
    <View
      style={[
        styles.placeholderCard,
        {
          borderRadius: theme.radii.lg,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        },
      ]}
    >
      <View style={styles.placeholderHead}>
        <Text
          style={[
            styles.placeholderTitle,
            {
              color: theme.colors.heading,
              fontSize: 15 * scaleFont,
            },
          ]}
        >
          {title}
        </Text>
        <View
          style={[
            styles.placeholderIcon,
            {
              borderRadius: theme.radii.sm,
              backgroundColor: withAlpha(theme.colors.accent, theme.isDark ? 0.22 : 0.12),
            },
          ]}
        >
          <Text
            style={[
              styles.placeholderIconLabel,
              {
                color: theme.colors.accent,
                fontSize: 12 * scaleFont,
              },
            ]}
          >
            ◆
          </Text>
        </View>
      </View>
      <Text
        style={[
          styles.placeholderBody,
          {
            color: theme.colors.textMuted,
            fontSize: 11 * scaleFont,
          },
        ]}
      >
        {body}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 0,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  topBarSide: {
    width: 34,
    height: 34,
  },
  topBarTitle: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.2,
  },
  topBarAction: {
    width: 34,
    height: 34,
    textAlign: "center",
    textAlignVertical: "center",
    fontFamily: fontFamilies.bodyMedium,
  },
  gateScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
  },
  crest: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  crestLabel: {
    fontFamily: fontFamilies.displayItalic,
  },
  gateTitle: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.4,
    lineHeight: 30,
    textAlign: "center",
  },
  gateBody: {
    maxWidth: 280,
    fontFamily: fontFamilies.body,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  gateActions: {
    width: "100%",
    maxWidth: 280,
  },
  primaryButton: {
    width: "100%",
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryButtonLabel: {
    fontFamily: fontFamilies.bodySemiBold,
  },
  secondaryButton: {
    width: "100%",
    minHeight: 42,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  secondaryButtonLabel: {
    fontFamily: fontFamilies.bodyMedium,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  filterChip: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  filterChipLabel: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sectionBlockFirst: {
    marginTop: 8,
  },
  sectionBlock: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
  },
  sectionTitle: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.2,
  },
  sectionMeta: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  placeholderCard: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    marginBottom: 2,
  },
  placeholderHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  placeholderTitle: {
    flex: 1,
    minWidth: 0,
    fontFamily: fontFamilies.display,
    lineHeight: 18,
    marginRight: 10,
  },
  placeholderIcon: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderIconLabel: {
    fontFamily: fontFamilies.mono,
  },
  placeholderBody: {
    fontFamily: fontFamilies.body,
    lineHeight: 16,
  },
});
