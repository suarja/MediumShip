import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

/** Mockup-aligned loupe scale shared by every search surface. */
const SEARCH_GLYPH_SIZE = 19;

type SearchBarProps = {
  placeholder: string;
  /** Editable mode (omit `onPress`). */
  value?: string;
  onChangeText?: (text: string) => void;
  /**
   * When provided the bar renders as a read-only button — used in the feed as
   * an entry point that routes to the dedicated search surface.
   */
  onPress?: () => void;
  testID?: string;
};

/**
 * The pill search field. Editable on the Explore surface; a tappable read-only
 * variant (via `onPress`) lets the same chrome act as a feed entry point.
 */
export function SearchBar({
  placeholder,
  value,
  onChangeText,
  onPress,
  testID,
}: SearchBarProps) {
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();

  const containerStyle = [
    styles.card,
    {
      borderRadius: theme.radii.pill,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
  ];

  const glyph = (
    <Text
      testID={testID ? `${testID}-icon` : undefined}
      style={[
        styles.icon,
        {
          color: theme.colors.accent,
          fontSize: SEARCH_GLYPH_SIZE * scaleFont,
          lineHeight: SEARCH_GLYPH_SIZE * scaleFont,
          width: 22 * scaleSpace,
        },
      ]}
    >
      ⌕
    </Text>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="search"
        accessibilityLabel={placeholder}
        onPress={onPress}
        testID={testID}
        style={({ pressed }) => [...containerStyle, pressed && styles.pressed]}
      >
        {glyph}
        <Text
          numberOfLines={1}
          style={[
            styles.input,
            styles.readonlyLabel,
            { color: theme.colors.textMuted, fontSize: 15 * scaleFont },
          ]}
        >
          {placeholder}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={containerStyle}>
      {glyph}
      <TextInput
        testID={testID}
        style={[
          styles.input,
          {
            color: theme.colors.text,
            fontSize: 15 * scaleFont,
            fontFamily: fontFamilies.body,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
        clearButtonMode="while-editing"
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 42,
    paddingHorizontal: 15,
  },
  icon: {
    width: 22,
    textAlign: "center",
  },
  input: {
    flex: 1,
    minHeight: 42,
  },
  readonlyLabel: {
    fontFamily: fontFamilies.body,
    paddingVertical: 11,
  },
  pressed: {
    opacity: 0.85,
  },
});
