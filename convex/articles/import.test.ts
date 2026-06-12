/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import aggregateTest from "@convex-dev/aggregate/test";
import { describe, expect, it } from "vitest";

import { internal } from "../_generated/api";
import schema from "../schema";
import { modules } from "../../convexTestModules";
import { extractReadableBody, extractTitle, metaContent } from "./import";

const HTML = `<!doctype html>
<html>
  <head>
    <title>Fallback title</title>
    <meta property="og:title" content="Moral outrage &amp; algorithms" />
    <meta name="description" content="How feeds reward anger." />
    <meta property="og:image" content="https://site.example/cover.jpg" />
  </head>
  <body>
    <nav><p>Home</p></nav>
    <article>
      <h1>Heading</h1>
      <p>Short.</p>
      <p>Platforms optimise for outrage because it is what spreads fastest across the network.</p>
      <p>That dynamic rewards the loudest take rather than the most accurate one, every single time.</p>
    </article>
  </body>
</html>`;

describe("web article extraction", () => {
  it("prefers og:title and decodes entities", () => {
    expect(extractTitle(HTML)).toBe("Moral outrage & algorithms");
  });

  it("reads meta description", () => {
    expect(metaContent(HTML, ["og:description", "description"])).toBe(
      "How feeds reward anger.",
    );
  });

  it("extracts paragraph body from the article container, skipping short/nav text", () => {
    const body = extractReadableBody(HTML);
    expect(body).toContain("Platforms optimise for outrage");
    expect(body).toContain("rewards the loudest take");
    expect(body).not.toContain("Home");
    expect(body).not.toContain("Short.");
  });
});

describe("insertImportedWebArticle", () => {
  const ARTICLE = {
    title: "Moral outrage & algorithms",
    summary: "How feeds reward anger.",
    articleBody: "Body paragraph one.\n\nBody paragraph two.",
    canonicalUrl: "https://site.example/moral-outrage",
    imageUrl: "https://site.example/cover.jpg",
    category: "Analyses",
  };

  it("creates a draft article tagged as a web source", async () => {
    const t = convexTest(schema, modules);
    aggregateTest.register(t, "contentCategoryCounts");

    const id = await t.mutation(internal.articles.import.insertImportedWebArticle, ARTICLE);

    const doc = await t.run((ctx) => ctx.db.get(id));
    expect(doc?.kind).toBe("article");
    expect(doc?.status).toBe("draft");
    expect(doc?.source).toBe("web");
    expect(doc?.canonicalUrl).toBe(ARTICLE.canonicalUrl);
    expect(doc?.articleBody).toBe(ARTICLE.articleBody);
    expect(doc?.heroImageUrl).toBe(ARTICLE.imageUrl);
  });

  it("is idempotent on the same title + url", async () => {
    const t = convexTest(schema, modules);
    aggregateTest.register(t, "contentCategoryCounts");

    const first = await t.mutation(internal.articles.import.insertImportedWebArticle, ARTICLE);
    const second = await t.mutation(internal.articles.import.insertImportedWebArticle, ARTICLE);

    expect(second).toBe(first);
    const all = await t.run((ctx) => ctx.db.query("contents").collect());
    expect(all).toHaveLength(1);
  });
});
