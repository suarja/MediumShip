import AsyncStorage from "@react-native-async-storage/async-storage";

export const ONBOARDING_SEEN_KEY = "mediumship:onboarding.seen";

/** Whether the first-run onboarding flow has already been completed/skipped. */
export async function getOnboardingSeen(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_SEEN_KEY);
  return value === "true";
}

export async function setOnboardingSeen(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, "true");
}

/** Clears the flag so the first-run flow shows again (debug / replay). */
export async function resetOnboardingSeen(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDING_SEEN_KEY);
}
