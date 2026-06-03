import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from "@expo-google-fonts/hanken-grotesk";
import { JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono";
import {
  Newsreader_400Regular,
  Newsreader_600SemiBold,
  Newsreader_700Bold,
} from "@expo-google-fonts/newsreader";
import { useFonts } from "expo-font";

/**
 * Loads the brand fonts (Newsreader / Hanken Grotesk / JetBrains Mono). The
 * object keys become the registered family names referenced by `fontFamilies`.
 * Returns whether loading has finished so the root layout can gate first paint.
 */
export function useAppFonts(): boolean {
  const [loaded] = useFonts({
    Newsreader_400Regular,
    Newsreader_600SemiBold,
    Newsreader_700Bold,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    JetBrainsMono_500Medium,
  });

  return loaded;
}
