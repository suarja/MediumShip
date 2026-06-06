export type ArticleHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type ArticleBodyBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "heading"; level: ArticleHeadingLevel; text: string };

const MEDIAWIKI_HEADING_RE = /^(={1,6})\s*(.+?)\s*\1$/;

function parseHeadingLine(line: string): ArticleBodyBlock | null {
  const trimmed = line.trim();
  const match = trimmed.match(MEDIAWIKI_HEADING_RE);
  if (!match) {
    return null;
  }

  return {
    kind: "heading",
    level: Math.min(match[1].length, 6) as ArticleHeadingLevel,
    text: match[2].trim(),
  };
}

function flushParagraphBuffer(buffer: string[], blocks: ArticleBodyBlock[]) {
  const text = buffer.join("\n").trim();
  if (text) {
    blocks.push({ kind: "paragraph", text });
  }
}

/** Parses plaintext article bodies into paragraphs and MediaWiki-style headings. */
export function parseArticleBody(body: string): ArticleBodyBlock[] {
  const blocks: ArticleBodyBlock[] = [];

  for (const chunk of body.split(/\n{2,}/)) {
    const trimmed = chunk.trim();
    if (!trimmed) {
      continue;
    }

    const singleLineHeading = parseHeadingLine(trimmed);
    if (singleLineHeading) {
      blocks.push(singleLineHeading);
      continue;
    }

    const lines = trimmed.split("\n");
    if (lines.length === 1) {
      blocks.push({ kind: "paragraph", text: trimmed });
      continue;
    }

    let paragraphBuffer: string[] = [];
    for (const line of lines) {
      const heading = parseHeadingLine(line);
      if (heading) {
        flushParagraphBuffer(paragraphBuffer, blocks);
        paragraphBuffer = [];
        blocks.push(heading);
      } else if (line.trim()) {
        paragraphBuffer.push(line.trim());
      }
    }
    flushParagraphBuffer(paragraphBuffer, blocks);
  }

  return blocks;
}

/** @deprecated Use {@link parseArticleBody} for structured rendering. */
export function splitArticleBodyParagraphs(body: string): string[] {
  return parseArticleBody(body)
    .filter((block): block is Extract<ArticleBodyBlock, { kind: "paragraph" }> =>
      block.kind === "paragraph",
    )
    .map((block) => block.text);
}
