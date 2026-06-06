import { parseArticleBody } from "../src/features/content/article-body";

describe("parseArticleBody", () => {
  it("splits plain paragraphs on blank lines", () => {
    expect(parseArticleBody("First paragraph.\n\nSecond paragraph.")).toEqual([
      { kind: "paragraph", text: "First paragraph." },
      { kind: "paragraph", text: "Second paragraph." },
    ]);
  });

  it("parses MediaWiki section headings with equals signs", () => {
    expect(
      parseArticleBody(
        "Intro paragraph.\n\n== History ==\n\nEvents unfolded quickly.\n\n=== Early years ===\n\nMore detail.",
      ),
    ).toEqual([
      { kind: "paragraph", text: "Intro paragraph." },
      { kind: "heading", level: 2, text: "History" },
      { kind: "paragraph", text: "Events unfolded quickly." },
      { kind: "heading", level: 3, text: "Early years" },
      { kind: "paragraph", text: "More detail." },
    ]);
  });

  it("parses headings embedded in a multi-line chunk without extra blank lines", () => {
    expect(
      parseArticleBody("Lead sentence.\n== Background ==\nSupporting facts."),
    ).toEqual([
      { kind: "paragraph", text: "Lead sentence." },
      { kind: "heading", level: 2, text: "Background" },
      { kind: "paragraph", text: "Supporting facts." },
    ]);
  });

  it("supports deeper heading levels", () => {
    expect(parseArticleBody("==== Subsection ====")).toEqual([
      { kind: "heading", level: 4, text: "Subsection" },
    ]);
  });
});
