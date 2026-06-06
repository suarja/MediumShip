import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";
import { GateBadge, type GateTone } from "./gate-badge";

type LibrarySectionHeaderProps = {
  title: string;
  gate?: GateTone;
};

export function LibrarySectionHeader({ title, gate }: LibrarySectionHeaderProps) {
  const { t } = useTranslation("profile");
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const gateLabel = gate ? t(`badges.${gate}`) : undefined;

  return (
    <View style={styles.header}>
      <View style={[styles.titleRow, { gap: 6 * scaleSpace }]}>
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.heading,
              fontSize: 17 * scaleFont,
            },
          ]}
        >
          {title}
        </Text>
        {gate && gateLabel ? <GateBadge tone={gate} label={gateLabel} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  title: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.25,
  },
});
