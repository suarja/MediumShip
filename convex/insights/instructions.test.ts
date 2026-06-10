import { describe, expect, it } from "vitest";

import { buildBriefingInstructions } from "./instructions";

describe("buildBriefingInstructions", () => {
  it("french system prompt follows Editia-style anchors", () => {
    const system = buildBriefingInstructions("fr", { isColdStart: false });

    expect(system).toContain("Langue de sortie");
    expect(system).toContain("Tutoiement OBLIGATOIRE");
    expect(system).toContain("LECTURE PERSONNELLE");
    expect(system).toContain("Un seul bloc narratif");
    expect(system).toContain("INTERDITS");
    expect(system).toContain("BRIEFING DE SUIVI");
    expect(system).toContain("Un seul bloc narratif");
  });

  it("marks first briefing for cold start", () => {
    const system = buildBriefingInstructions("fr", { isColdStart: true });
    expect(system).toContain("PREMIER BRIEFING");
    expect(system).not.toContain("BRIEFING DE SUIVI");
  });

  it("english system prompt enforces second person", () => {
    const system = buildBriefingInstructions("en", { isColdStart: true });
    expect(system).toContain("Output language");
    expect(system).toContain("second person only");
    expect(system).toContain("FIRST BRIEFING");
  });
});
