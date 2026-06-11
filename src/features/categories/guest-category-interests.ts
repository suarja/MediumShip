import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Guest-local category interests (AsyncStorage). Picked during onboarding /
 * settings before sign-in, then synced to the server on the first authenticated
 * session (see use-guest-interests-sync) and cleared.
 *
 * Keys are the same normalized scoring keys the picker emits, so they merge
 * cleanly with the server-side interests.
 */
export const GUEST_CATEGORY_INTERESTS_KEY = "mediumship:guestCategoryInterests";

export async function getGuestCategoryInterests(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(GUEST_CATEGORY_INTERESTS_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((key): key is string => typeof key === "string")
      : [];
  } catch {
    return [];
  }
}

export async function setGuestCategoryInterests(keys: readonly string[]): Promise<void> {
  const unique = Array.from(new Set(keys.filter((key) => key.length > 0))).sort();
  await AsyncStorage.setItem(GUEST_CATEGORY_INTERESTS_KEY, JSON.stringify(unique));
}

export async function clearGuestCategoryInterests(): Promise<void> {
  await AsyncStorage.removeItem(GUEST_CATEGORY_INTERESTS_KEY);
}
