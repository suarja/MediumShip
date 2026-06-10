import AsyncStorage from "@react-native-async-storage/async-storage";

export const ANALYSIS_READY_NOTIFIED_KEY =
  "mediumship:analysisReady.lastNotifiedId";

export async function getLastNotifiedAnalysisId(): Promise<string | null> {
  return AsyncStorage.getItem(ANALYSIS_READY_NOTIFIED_KEY);
}

export async function setLastNotifiedAnalysisId(analysisId: string): Promise<void> {
  await AsyncStorage.setItem(ANALYSIS_READY_NOTIFIED_KEY, analysisId);
}
