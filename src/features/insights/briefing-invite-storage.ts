import AsyncStorage from "@react-native-async-storage/async-storage";

export const BRIEFING_INVITE_DISMISSED_KEY =
  "mediumship:briefingInvite.lastDismissedId";

export async function getBriefingInviteDismissedId(): Promise<string | null> {
  return AsyncStorage.getItem(BRIEFING_INVITE_DISMISSED_KEY);
}

export async function setBriefingInviteDismissedId(
  analysisId: string,
): Promise<void> {
  await AsyncStorage.setItem(BRIEFING_INVITE_DISMISSED_KEY, analysisId);
}
