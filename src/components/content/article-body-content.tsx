import { StyleSheet, Text, View } from "react-native";

import type {
  ArticleBodyBlock,
  ArticleHeadingLevel,
} from "../../features/content/article-body";
import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

type ArticleBodyContentProps = {
  blocks: ArticleBodyBlock[];
  contentId: string;
};

const HEADING_FONT_SIZE: Record<ArticleHeadingLevel, number> = {
  1: 26,
  2: 24,
  3: 20,
  4: 18,
  5: 16,
  6: 15,
};

const HEADING_LINE_HEIGHT: Record<ArticleHeadingLevel, number> = {
  1: 34,
  2: 32,
  3: 28,
  4: 26,
  5: 24,
  6: 22,
};

function headingFontFamily(level: ArticleHeadingLevel): string {
  return level <= 3 ? fontFamilies.displayBold : fontFamilies.bodySemiBold;
}

export function ArticleBodyContent({ blocks, contentId }: ArticleBodyContentProps) {
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();

  if (blocks.length === 0) {
    return null;
  }

  return (
    <View style={{ gap: 20 * scaleSpace }}>
      {blocks.map((block, index) => {
        const key = `${contentId}-${block.kind}-${index}`;

        if (block.kind === "heading") {
          const topSpacing = index === 0 ? 0 : (block.level <= 2 ? 12 : 8) * scaleSpace;

          return (
            <Text
              key={key}
              accessibilityRole="header"
              style={[
                styles.heading,
                {
                  color: block.level <= 3 ? theme.colors.heading : theme.colors.text,
                  fontFamily: headingFontFamily(block.level),
                  fontSize: HEADING_FONT_SIZE[block.level] * scaleFont,
                  lineHeight: HEADING_LINE_HEIGHT[block.level] * scaleFont,
                  marginTop: topSpacing,
                },
              ]}
            >
              {block.text}
            </Text>
          );
        }

        return (
          <Text
            key={key}
            style={[
              styles.paragraph,
              {
                color: theme.colors.text,
                fontSize: 17 * scaleFont,
                lineHeight: 28 * scaleFont,
              },
            ]}
          >
            {block.text}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    letterSpacing: -0.2,
  },
  paragraph: {
    fontFamily: fontFamilies.body,
  },
});
