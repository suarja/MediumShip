import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";
import { Platform } from "react-native";

import type { ReviewTrigger } from "./review-triggers";

const STORAGE_KEYS = {
  lastPromptDate: "review_last_prompt_date",
  triggerPrefix: "review_trigger_fired_",
} as const;

const GLOBAL_COOLDOWN_DAYS = 14;

function triggerStorageKey(trigger: ReviewTrigger): string {
  return `${STORAGE_KEYS.triggerPrefix}${trigger}`;
}

export async function wasTriggerFired(trigger: ReviewTrigger): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(triggerStorageKey(trigger));
    return value === "1";
  } catch {
    return true;
  }
}

export async function markTriggerFired(trigger: ReviewTrigger): Promise<void> {
  await AsyncStorage.setItem(triggerStorageKey(trigger), "1");
}

export async function canPromptReview(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  try {
    const isAvailable = await StoreReview.isAvailableAsync();
    if (!isAvailable) {
      return false;
    }

    const lastPromptStr = await AsyncStorage.getItem(STORAGE_KEYS.lastPromptDate);
    if (!lastPromptStr) {
      return true;
    }

    const lastPrompt = new Date(lastPromptStr);
    const daysSinceLastPrompt =
      (Date.now() - lastPrompt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceLastPrompt >= GLOBAL_COOLDOWN_DAYS;
  } catch {
    return false;
  }
}

export async function requestReview(trigger: ReviewTrigger): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  try {
    if (await wasTriggerFired(trigger)) {
      return false;
    }

    if (!(await canPromptReview())) {
      return false;
    }

    await StoreReview.requestReview();
    await markTriggerFired(trigger);
    await AsyncStorage.setItem(STORAGE_KEYS.lastPromptDate, new Date().toISOString());
    return true;
  } catch {
    return false;
  }
}
