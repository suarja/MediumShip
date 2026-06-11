import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";
import { Platform } from "react-native";

import {
  canPromptReview,
  markTriggerFired,
  requestReview,
  wasTriggerFired,
} from "../src/features/review/review-service";

jest.mock("expo-store-review", () => ({
  isAvailableAsync: jest.fn(),
  requestReview: jest.fn(),
}));

const mockIsAvailableAsync = StoreReview.isAvailableAsync as jest.Mock;
const mockRequestReview = StoreReview.requestReview as jest.Mock;

describe("review-service", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    mockIsAvailableAsync.mockResolvedValue(true);
    mockRequestReview.mockResolvedValue(undefined);
    Object.defineProperty(Platform, "OS", { configurable: true, value: "ios" });
  });

  it("fires each trigger only once", async () => {
    expect(await requestReview("premium_activated")).toBe(true);
    expect(await requestReview("premium_activated")).toBe(false);
    expect(mockRequestReview).toHaveBeenCalledTimes(1);
    expect(await wasTriggerFired("premium_activated")).toBe(true);
  });

  it("keeps triggers independent", async () => {
    await markTriggerFired("premium_activated");
    expect(await wasTriggerFired("premium_activated")).toBe(true);
    expect(await wasTriggerFired("list_add")).toBe(false);
    expect(await wasTriggerFired("first_bookmark")).toBe(false);
  });

  it("respects the global cooldown cap", async () => {
    expect(await requestReview("first_bookmark")).toBe(true);
    expect(await canPromptReview()).toBe(false);
    expect(await requestReview("list_add")).toBe(false);
  });

  it("no-ops when review is unavailable", async () => {
    mockIsAvailableAsync.mockResolvedValue(false);
    expect(await requestReview("premium_activated")).toBe(false);
    expect(mockRequestReview).not.toHaveBeenCalled();
    expect(await wasTriggerFired("premium_activated")).toBe(false);
  });

  it("no-ops on web", async () => {
    Object.defineProperty(Platform, "OS", { configurable: true, value: "web" });
    expect(await requestReview("premium_activated")).toBe(false);
    expect(mockRequestReview).not.toHaveBeenCalled();
  });

  it("marks a trigger as fired without prompting", async () => {
    await markTriggerFired("first_bookmark");
    expect(await wasTriggerFired("first_bookmark")).toBe(true);
    expect(await requestReview("first_bookmark")).toBe(false);
  });
});
