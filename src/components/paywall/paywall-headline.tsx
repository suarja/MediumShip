import { StyleSheet, Text } from "react-native";

import { fontFamilies } from "../../features/theme/fonts";

type Props = {
  title: string;
  titleItalic: string;
  color: string;
  italicColor: string;
  fontSize: number;
};

export function PaywallHeadline({ title, titleItalic, color, italicColor, fontSize }: Props) {
  return (
    <Text style={[styles.headline, { color, fontSize }]}>
      {title}
      <Text style={[styles.headlineItalic, { color: italicColor, fontSize }]}>{titleItalic}</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  headline: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  headlineItalic: {
    fontFamily: fontFamilies.display,
    fontStyle: "italic",
    letterSpacing: -0.4,
  },
});
