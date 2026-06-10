/**
 * Defensive sanitization for aggregated taste data before LLM prompts.
 * Adapted from Editia `convex/agent/sanitizeUserInput.ts`.
 */

const CONTROL_CHARS_RE = new RegExp(
  "[" +
    "\\u0000-\\u0008" +
    "\\u000B\\u000C" +
    "\\u000E-\\u001F" +
    "\\u007F-\\u009F" +
    "\\u200B-\\u200F" +
    "\\u202A-\\u202E" +
    "\\u2060-\\u206F" +
    "\\uFEFF" +
    "]",
  "g",
);

const HIGH_CONFIDENCE_PATTERNS: RegExp[] = [
  /<\|im_(start|end|sep)\|>/i,
  /\[\s*\/?\s*INST\s*\]/i,
  /<\/?(system|assistant|im_start|im_end|tool_call)>/i,
  /<<\s*SYS\s*>>/i,
];

const LOW_CONFIDENCE_PATTERNS: RegExp[] = [
  /\b(ignore|disregard|forget|override)\s+(all|the|every|your|previous|prior|above|earlier)\s+(instructions?|prompts?|rules?|messages?|system)/i,
  /\byou\s+are\s+(now|no longer|not|actually)\s+(an?|the)\b/i,
  /\b(ignore|oublie|oubliez)\s+(?:\S+\s+){0,2}(instructions?|consignes?|précédentes?|antérieures?|messages?)/i,
];

export type SanitizeResult = {
  sanitized: string;
  lowConfidenceMatches: string[];
  hadControlChars: boolean;
};

export class PromptInjectionRejected extends Error {
  matched: string;
  constructor(matched: string) {
    super(`prompt_injection_rejected:${matched}`);
    this.name = "PromptInjectionRejected";
    this.matched = matched;
  }
}

export function sanitizeInsightsInput(content: string): SanitizeResult {
  const stripped = content.replace(CONTROL_CHARS_RE, "");
  const hadControlChars = stripped.length !== content.length;

  for (const re of HIGH_CONFIDENCE_PATTERNS) {
    const match = stripped.match(re);
    if (match) {
      throw new PromptInjectionRejected(match[0]);
    }
  }

  const lowConfidenceMatches: string[] = [];
  for (const re of LOW_CONFIDENCE_PATTERNS) {
    const match = stripped.match(re);
    if (match) {
      lowConfidenceMatches.push(match[0]);
    }
  }

  return {
    sanitized: stripped,
    lowConfidenceMatches,
    hadControlChars,
  };
}
