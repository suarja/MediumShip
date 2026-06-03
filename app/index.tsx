import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useClerkAuth } from "../src/features/auth/use-clerk-auth";
import { useTranslation } from "react-i18next";

// Entry gate: route to the app or the auth flow once Clerk has loaded.
export default function Index() {
  const { isLoaded, isSignedIn } = useClerkAuth();
  const { t } = useTranslation("common");

  if (!isLoaded) {
    return (
      <View style={styles.center} accessibilityLabel={t("status.loading")}>
        <ActivityIndicator color="#B42318" />
      </View>
    );
  }

  return <Redirect href={isSignedIn ? "/home" : "/sign-in"} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FCFCFD",
  },
});
