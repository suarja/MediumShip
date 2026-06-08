export type ParsedYouTubeChannelInput =
  | { kind: "channelId"; channelId: string }
  | { kind: "handle"; handle: string };

const CHANNEL_ID_PATTERN = /^UC[\w-]{22}$/;

export function parseYouTubeChannelInput(
  rawInput: string,
): ParsedYouTubeChannelInput | null {
  const input = rawInput.trim();
  if (!input) {
    return null;
  }

  if (CHANNEL_ID_PATTERN.test(input)) {
    return { kind: "channelId", channelId: input };
  }

  try {
    const withScheme = input.startsWith("http") ? input : `https://${input}`;
    const url = new URL(withScheme);

    if (url.hostname.includes("youtube.com") || url.hostname === "youtu.be") {
      const channelMatch = url.pathname.match(/\/channel\/(UC[\w-]{22})/);
      if (channelMatch?.[1]) {
        return { kind: "channelId", channelId: channelMatch[1] };
      }

      const handleMatch = url.pathname.match(/\/@([^/]+)/);
      if (handleMatch?.[1]) {
        return { kind: "handle", handle: handleMatch[1] };
      }

      const legacyHandleMatch = url.pathname.match(/^\/c\/([^/]+)/);
      if (legacyHandleMatch?.[1]) {
        return { kind: "handle", handle: legacyHandleMatch[1] };
      }

      const userMatch = url.pathname.match(/^\/user\/([^/]+)/);
      if (userMatch?.[1]) {
        return { kind: "handle", handle: userMatch[1] };
      }
    }
  } catch {
    // Fall through to handle parsing below.
  }

  if (input.startsWith("@")) {
    const handle = input.slice(1).trim();
    return handle ? { kind: "handle", handle } : null;
  }

  if (/^[\w.-]+$/.test(input)) {
    return { kind: "handle", handle: input };
  }

  return null;
}

type ChannelsListItem = {
  id?: string;
  snippet?: {
    title?: string;
  };
};

export async function resolveYouTubeChannel(
  input: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ channelId: string; label: string }> {
  const parsed = parseYouTubeChannelInput(input);
  if (!parsed) {
    throw new Error("Invalid YouTube channel URL or handle");
  }

  const params = new URLSearchParams({
    part: "snippet",
    key: apiKey,
  });

  if (parsed.kind === "channelId") {
    params.set("id", parsed.channelId);
  } else {
    params.set("forHandle", parsed.handle);
  }

  const response = await fetchImpl(
    `https://www.googleapis.com/youtube/v3/channels?${params.toString()}`,
  );
  if (!response.ok) {
    throw new Error(`YouTube channels.list failed (${response.status})`);
  }

  const payload = (await response.json()) as { items?: ChannelsListItem[] };
  const item = payload.items?.[0];
  const channelId = item?.id;
  const label = item?.snippet?.title?.trim();

  if (!channelId || !label) {
    throw new Error("YouTube channel not found");
  }

  return { channelId, label };
}
