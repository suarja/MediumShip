/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import aggregateTest from "@convex-dev/aggregate/test";
import { describe, expect, it } from "vitest";

import { internal } from "../_generated/api";
import schema from "../schema";
import { modules } from "../../convexTestModules";
import { parseItunesDuration, parsePodcastFeed } from "./import";

const FEED = `<?xml version="1.0"?>
<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>Pod</title>
    <item>
      <title>Moral outrage online</title>
      <link>https://pod.example/ep1</link>
      <guid>ep-1-guid</guid>
      <description>Why algorithms reward anger.</description>
      <pubDate>Mon, 01 Jun 2026 08:00:00 GMT</pubDate>
      <itunes:duration>1:02:03</itunes:duration>
      <itunes:image href="https://pod.example/ep1.jpg" />
      <enclosure url="https://pod.example/ep1.mp3" type="audio/mpeg" length="1000" />
    </item>
    <item>
      <title>No audio here</title>
      <link>https://pod.example/ep2</link>
      <guid>ep-2-guid</guid>
      <description>Article-only item.</description>
    </item>
  </channel>
</rss>`;

describe("parseItunesDuration", () => {
  it("parses seconds, mm:ss and hh:mm:ss", () => {
    expect(parseItunesDuration("3600")).toBe(3600);
    expect(parseItunesDuration("12:34")).toBe(754);
    expect(parseItunesDuration("1:02:03")).toBe(3723);
    expect(parseItunesDuration(undefined)).toBeUndefined();
  });
});

describe("parsePodcastFeed", () => {
  it("extracts only items with an audio enclosure", () => {
    const episodes = parsePodcastFeed(FEED);
    expect(episodes).toHaveLength(1);
    const episode = episodes[0];
    expect(episode.title).toBe("Moral outrage online");
    expect(episode.audioUrl).toBe("https://pod.example/ep1.mp3");
    expect(episode.guid).toBe("ep-1-guid");
    expect(episode.canonicalUrl).toBe("https://pod.example/ep1");
    expect(episode.durationSeconds).toBe(3723);
    expect(episode.imageUrl).toBe("https://pod.example/ep1.jpg");
  });
});

describe("insertImportedEpisode", () => {
  const EPISODE = {
    title: "Moral outrage online",
    summary: "Why algorithms reward anger.",
    audioUrl: "https://pod.example/ep1.mp3",
    canonicalUrl: "https://pod.example/ep1",
    externalId: "ep-1-guid",
    durationSeconds: 3723,
    imageUrl: "https://pod.example/ep1.jpg",
    category: "Podcast",
  };

  it("creates a draft episode tagged as an rss source", async () => {
    const t = convexTest(schema, modules);
    aggregateTest.register(t, "contentCategoryCounts");

    const id = await t.mutation(internal.podcasts.import.insertImportedEpisode, EPISODE);

    const doc = await t.run((ctx) => ctx.db.get(id));
    expect(doc?.kind).toBe("episode");
    expect(doc?.status).toBe("draft");
    expect(doc?.source).toBe("rss");
    expect(doc?.audioUrl).toBe(EPISODE.audioUrl);
    expect(doc?.durationSeconds).toBe(EPISODE.durationSeconds);
    expect(doc?.canonicalUrl).toBe(EPISODE.canonicalUrl);
    expect(doc?.externalId).toBe(EPISODE.externalId);
  });

  it("is idempotent on the same title + guid", async () => {
    const t = convexTest(schema, modules);
    aggregateTest.register(t, "contentCategoryCounts");

    const first = await t.mutation(internal.podcasts.import.insertImportedEpisode, EPISODE);
    const second = await t.mutation(internal.podcasts.import.insertImportedEpisode, EPISODE);

    expect(second).toBe(first);
    const all = await t.run((ctx) => ctx.db.query("contents").collect());
    expect(all).toHaveLength(1);
  });
});
