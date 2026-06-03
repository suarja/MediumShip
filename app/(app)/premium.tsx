import { Text } from "react-native";
import { useTranslation } from "react-i18next";

import { Screen } from "../../src/components/layout/screen";

export default function PremiumScreen() {
  const { t } = useTranslation("premium");

  return (
    <Screen>
      <Text>{t("title")}</Text>
    </Screen>
  );
}
