jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import {
  clearGuestCategoryInterests,
  getGuestCategoryInterests,
  setGuestCategoryInterests,
} from "../src/features/categories/guest-category-interests";

describe("guest category interests storage", () => {
  beforeEach(async () => {
    await clearGuestCategoryInterests();
  });

  it("returns an empty list when nothing is stored", async () => {
    expect(await getGuestCategoryInterests()).toEqual([]);
  });

  it("persists a de-duplicated, sorted set of keys", async () => {
    await setGuestCategoryInterests(["science", "society", "science", "economy"]);
    expect(await getGuestCategoryInterests()).toEqual(["economy", "science", "society"]);
  });

  it("clears stored keys", async () => {
    await setGuestCategoryInterests(["science"]);
    await clearGuestCategoryInterests();
    expect(await getGuestCategoryInterests()).toEqual([]);
  });
});
