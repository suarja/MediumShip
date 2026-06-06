/** Splits plaintext article bodies into display paragraphs. */
export function splitArticleBodyParagraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
