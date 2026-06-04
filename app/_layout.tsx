import "../src/lib/polyfills";
import { ClerkProvider } from "@clerk/clerk-expo";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { env } from "../src/lib/env";
import { useStableAuth } from "../src/features/auth/use-stable-auth";
import {
  PersistentEpisodeMiniPlayer,
  PersistentEpisodePlayerProvider,
} from "../src/features/media/persistent-episode-player";
import { NetworkStatusDebugProvider } from "../src/features/network/use-network-status";
import { AppThemeProvider } from "../src/features/theme/theme-provider";
import { useAppFonts } from "../src/features/theme/use-app-fonts";
import { i18n, initI18n } from "../src/i18n";

const convex = new ConvexReactClient(env.EXPO_PUBLIC_CONVEX_URL);

const tokenCache = {
  getToken: (key: string) => SecureStore.getItemAsync(key),
  saveToken: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  clearToken: (key: string) => SecureStore.deleteItemAsync(key),
};

export default function RootLayout() {
  const [i18nReady, setI18nReady] = useState(false);
  const [languageKey, setLanguageKey] = useState("fr");
  const fontsLoaded = useAppFonts();

  useEffect(() => {
    let mounted = true;

    void initI18n().then(() => {
      if (mounted) {
        setLanguageKey(i18n.resolvedLanguage ?? i18n.language);
        setI18nReady(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleLanguageChanged = (language: string) => {
      setLanguageKey(language);
    };

    i18n.on("languageChanged", handleLanguageChanged);

    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, []);

  if (!i18nReady || !fontsLoaded) {
    return (
      <SafeAreaProvider>
        <View style={styles.center}>
          <ActivityIndicator color="#B42318" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ClerkProvider
        publishableKey={env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
        tokenCache={tokenCache}
      >
        <ConvexProviderWithClerk client={convex} useAuth={useStableAuth}>
          <NetworkStatusDebugProvider>
            <AppThemeProvider>
              <PersistentEpisodePlayerProvider>
                <StatusBar style="auto" />
                <View style={styles.appFrame}>
                  <Stack key={languageKey} screenOptions={{ headerShown: false }} />
                  <PersistentEpisodeMiniPlayer />
                </View>
              </PersistentEpisodePlayerProvider>
            </AppThemeProvider>
          </NetworkStatusDebugProvider>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FCFCFD",
  },
  appFrame: {
    flex: 1,
  },
});
