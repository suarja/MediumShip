type DiscoveryFeedRefreshListener = () => void;

const listeners = new Set<DiscoveryFeedRefreshListener>();

export function subscribeDiscoveryFeedRefresh(
  listener: DiscoveryFeedRefreshListener,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function requestDiscoveryFeedRefresh(): void {
  for (const listener of listeners) {
    listener();
  }
}
