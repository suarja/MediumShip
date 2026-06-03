if (typeof navigator !== "undefined" && navigator.onLine === undefined) {
  Object.defineProperty(navigator, "onLine", {
    get: () => true,
    configurable: true,
  });
}
