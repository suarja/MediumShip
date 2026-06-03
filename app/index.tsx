import { Redirect } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useClerkAuth } from "../src/features/auth/use-clerk-auth";

// Entry gate: wait for Clerk, then always enter the public app shell.
export default function Index() {
  const { isLoaded } = useClerkAuth();
  const { t } = useTranslation("common");

  if (!isLoaded) {
    return (
      <View style={styles.center} accessibilityLabel={t("status.loading")}>
        <ActivityIndicator color="#B42318" />
      </View>
    );
  }

  return <Redirect href="/home" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FCFCFD",
  },
});
