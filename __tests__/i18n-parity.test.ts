import { resources } from "../src/i18n/resources";

function collectLeafPaths(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) {
    return [prefix];
  }

  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      return collectLeafPaths(child, nextPrefix);
    });
  }

  return [prefix];
}

describe("i18n parity", () => {
  it("keeps the same translation keys in fr and en for each namespace", () => {
    const locales = Object.keys(resources) as Array<keyof typeof resources>;
    const [referenceLocale, ...otherLocales] = locales;
    const namespaces = Object.keys(
      resources[referenceLocale],
    ) as Array<keyof (typeof resources)[typeof referenceLocale]>;

    for (const namespace of namespaces) {
      const referenceKeys = collectLeafPaths(
        resources[referenceLocale][namespace],
      ).sort();

      for (const locale of otherLocales) {
        expect(
          collectLeafPaths(resources[locale][namespace]).sort(),
        ).toEqual(referenceKeys);
      }
    }
  });
});
