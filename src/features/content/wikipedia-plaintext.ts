const DISPLAYSTYLE_MARKER = "{\\displaystyle";

const LATEX_SYMBOLS: Record<string, string> = {
  "\\ell": "ℓ",
  "\\#": "#",
  "\\ldots": "…",
  "\\dots": "…",
  "\\Sigma": "Σ",
  "\\sigma": "σ",
  "\\cup": "∪",
  "\\cap": "∩",
  "\\in": "∈",
  "\\times": "×",
  "\\cdot": "·",
  "\\leq": "≤",
  "\\geq": "≥",
  "\\neq": "≠",
  "\\approx": "≈",
  "\\infty": "∞",
  "\\alpha": "α",
  "\\beta": "β",
  "\\gamma": "γ",
  "\\delta": "δ",
  "\\lambda": "λ",
  "\\pi": "π",
  "\\rightarrow": "→",
  "\\leftarrow": "←",
  "\\Rightarrow": "⇒",
  "\\Leftrightarrow": "⇔",
  "\\forall": "∀",
  "\\exists": "∃",
  "\\emptyset": "∅",
  "\\subset": "⊂",
  "\\supset": "⊃",
  "\\subseteq": "⊆",
  "\\supseteq": "⊇",
  "\\wedge": "∧",
  "\\vee": "∨",
  "\\neg": "¬",
  "\\star": "∗",
  "\\ast": "∗",
};

const SUBSCRIPT_DIGITS: Record<string, string> = {
  "0": "₀",
  "1": "₁",
  "2": "₂",
  "3": "₃",
  "4": "₄",
  "5": "₅",
  "6": "₆",
  "7": "₇",
  "8": "₈",
  "9": "₉",
};

const SUPERSCRIPT_CHARS: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  n: "ⁿ",
  "*": "∗",
  "+": "⁺",
  "-": "⁻",
  i: "ⁱ",
};

function toSubscript(value: string): string {
  return value
    .split("")
    .map((char) => SUBSCRIPT_DIGITS[char] ?? char)
    .join("");
}

function toSuperscript(value: string): string {
  return value
    .split("")
    .map((char) => SUPERSCRIPT_CHARS[char] ?? char)
    .join("");
}

function stripUnderlineBlocks(text: string): string {
  let output = text;
  let cursor = 0;

  while (cursor < output.length) {
    const start = output.indexOf("{\\underline", cursor);
    if (start === -1) {
      break;
    }

    let depth = 0;
    let end = start;
    for (; end < output.length; end += 1) {
      const char = output[end];
      if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          break;
        }
      }
    }

    const block = output.slice(start, end + 1);
    const inner = block.replace(/^\{\\underline\s+/, "").slice(0, -1);
    output = output.slice(0, start) + inner + output.slice(end + 1);
    cursor = start + inner.length;
  }

  return output;
}

/** Converts a small subset of LaTeX into readable Unicode/plain text. */
export function latexToReadable(latex: string): string {
  let text = latex.trim();

  text = stripUnderlineBlocks(text);
  text = text.replace(/\\#/g, "#");
  text = text.replace(/\\\{/g, "{");
  text = text.replace(/\\\}/g, "}");
  text = text.replace(/\^\{([^}]+)\}/g, (_, exp: string) => toSuperscript(exp));
  text = text.replace(/\^(\w|\*)/g, (_, exp: string) => toSuperscript(exp));
  text = text.replace(/_\{([^}]+)\}/g, (_, sub: string) => toSubscript(sub));
  text = text.replace(/_(\w)/g, (_, char: string) => toSubscript(char));

  for (const [command, symbol] of Object.entries(LATEX_SYMBOLS)) {
    text = text.split(command).join(symbol);
  }

  text = text.replace(/\\[a-zA-Z]+/g, " ");
  text = text.replace(/\{\s*([^{}]*)\s*\}/g, "$1");
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

/** True for single-char lines and other math-fallback debris from explaintext. */
export function isMathArtifactLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) {
    return true;
  }

  if (trimmed.length === 1) {
    return /[\(\[\]\{\}\),\.\…\*·#\\^=\|]/.test(trimmed);
  }

  if (trimmed.length === 2) {
    return /^[\(\[\]\{\}\),\.\…\*·#\\^=\|]+$/.test(trimmed);
  }

  if (/^[\(\[\]\{\}\),\.\…\*·#\s\\^=|]+$/.test(trimmed)) {
    return true;
  }

  if (/^\(?,?\s*\.\.\.\s*\)?[\.…]*$/.test(trimmed)) {
    return true;
  }

  return false;
}

function findDisplaystyleBlockEnd(text: string, start: number): number {
  let depth = 0;
  for (let end = start; end < text.length; end += 1) {
    const char = text[end];
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return end;
      }
    }
  }

  return text.length - 1;
}

function isMathFallbackFragment(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) {
    return true;
  }
  if (isMathArtifactLine(trimmed)) {
    return true;
  }
  // Single-symbol lines duplicated by the following displaystyle block.
  if (trimmed.length <= 3 && !trimmed.includes(" ")) {
    return true;
  }
  return false;
}

function stripPrecedingMathArtifactLines(before: string): string {
  const lines = before.split("\n");
  let cutAt = lines.length;

  while (cutAt > 0) {
    const line = lines[cutAt - 1];
    if (line.trim() === "") {
      cutAt -= 1;
      continue;
    }
    if (isMathFallbackFragment(line)) {
      cutAt -= 1;
      continue;
    }
    break;
  }

  const kept = lines.slice(0, cutAt);
  while (kept.length > 0 && kept[kept.length - 1].trim() === "") {
    kept.pop();
  }

  return kept.join("\n");
}

function isBlockFormula(readable: string): boolean {
  return readable.length > 24 || /[()]/.test(readable);
}

function appendReadableFormula(output: string, readable: string): string {
  if (isBlockFormula(readable)) {
    const prefix = output.endsWith("\n\n") || output.length === 0 ? "" : "\n\n";
    return `${output}${prefix}${readable}\n\n`;
  }

  const spacer = output.length > 0 && !/\s$/.test(output) ? " " : "";
  return `${output}${spacer}${readable} `;
}

function replaceDisplaystyleBlocks(text: string): string {
  let output = "";
  let cursor = 0;

  while (cursor < text.length) {
    const start = text.indexOf(DISPLAYSTYLE_MARKER, cursor);
    if (start === -1) {
      output += text.slice(cursor);
      break;
    }

    const cleanedBefore = stripPrecedingMathArtifactLines(text.slice(cursor, start));
    output += cleanedBefore;

    const end = findDisplaystyleBlockEnd(text, start);
    const block = text.slice(start, end + 1);
    const inner = block.slice(DISPLAYSTYLE_MARKER.length + 1, -1);
    const readable = latexToReadable(inner);
    if (readable) {
      output = appendReadableFormula(output, readable);
    }

    cursor = end + 1;
  }

  return output;
}

/**
 * MediaWiki math fallback often emits one character per line. Collapse those
 * runs into a single inline formula fragment.
 */
export function collapseVerticalCharacterRuns(text: string): string {
  const lines = text.split("\n");
  const output: string[] = [];
  let run: string[] = [];

  const flushRun = () => {
    if (run.length === 0) {
      return;
    }

    if (run.length >= 3 && run.every((line) => line.length <= 2)) {
      output.push(run.join(""));
    } else {
      output.push(...run);
    }
    run = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushRun();
      if (output.length > 0 && output[output.length - 1] !== "") {
        output.push("");
      }
      continue;
    }

    if (trimmed.length <= 2 && !/^=.*=$/.test(trimmed)) {
      run.push(trimmed);
      continue;
    }

    flushRun();
    output.push(trimmed);
  }

  flushRun();
  return output.join("\n");
}

function removeOrphanFormulaLines(text: string): string {
  return text
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return true;
      }
      return !isMathArtifactLine(trimmed);
    })
    .join("\n");
}

function removeBrokenFormulaFragments(text: string): string {
  return text
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return true;
      }
      if (/^[∗\*]$/.test(trimmed)) {
        return false;
      }
      if (/^\(\([^)]*$/.test(trimmed)) {
        return false;
      }
      if (/^\(\([^)]*\{$/.test(trimmed)) {
        return false;
      }
      return true;
    })
    .join("\n");
}

function dedupeConsecutiveLines(text: string): string {
  const lines = text.split("\n");
  const output: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && output.length > 0 && output[output.length - 1].trim() === trimmed) {
      continue;
    }
    output.push(line);
  }

  return output.join("\n");
}

function fixLeadingCommaLines(text: string): string {
  const lines = text.split("\n");
  const output: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith(", ") && output.length > 0) {
      output[output.length - 1] = `${output[output.length - 1]}${trimmed.slice(1)}`;
      continue;
    }
    output.push(line);
  }

  return output.join("\n");
}

function dedupeStandaloneSymbolLines(text: string): string {
  const lines = text.split("\n");

  return lines
    .filter((line, index) => {
      const trimmed = line.trim();
      if (trimmed.length !== 1) {
        return true;
      }

      const before = lines.slice(0, index).join(" ");
      const after = lines.slice(index + 1).join(" ");
      return !before.includes(trimmed) && !after.trim().startsWith(trimmed);
    })
    .join("\n");
}

function joinInlineSymbolLineBreaks(text: string): string {
  return text
    .replace(/([ℓ#])\n+\s*/g, "$1 ")
    .replace(/#\n+\s+but /g, "#, but ")
    .replace(/# , but /g, "#, but ");
}

function trimTrailingSymbolOrphans(text: string): string {
  return text.replace(/\s+[ℓ#]\s*$/u, "");
}

/** Cleans Wikipedia explaintext artifacts before article body parsing. */
export function sanitizeWikipediaPlaintext(body: string): string {
  let text = replaceDisplaystyleBlocks(body);
  text = collapseVerticalCharacterRuns(text);
  text = removeOrphanFormulaLines(text);
  text = removeBrokenFormulaFragments(text);
  text = joinInlineSymbolLineBreaks(text);
  text = fixLeadingCommaLines(text);
  text = dedupeStandaloneSymbolLines(text);
  text = dedupeConsecutiveLines(text);
  text = trimTrailingSymbolOrphans(text);
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}
