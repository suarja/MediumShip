const IPTC_BASE = "http://cv.iptc.org/newscodes/mediatopic/";
const SKOS_CONCEPT_SHORT = "skos:Concept";
const SKOS_CONCEPT_FULL = "http://www.w3.org/2004/02/skos/core#Concept";

/** Parsed intermediate before DB write — mirrors the upsertCatalogNodes args. */
export type RawIptcNode = {
  externalId: string;
  label: string;
  labelFr?: string;
  parentExternalId?: string;
  retired: boolean;
};

function toExternalId(uri: string): string {
  // "http://cv.iptc.org/newscodes/mediatopic/20000344" → "medtop:20000344"
  if (uri.startsWith(IPTC_BASE)) {
    return `medtop:${uri.slice(IPTC_BASE.length)}`;
  }
  return uri;
}

function isConceptType(types: unknown): boolean {
  const typeArr = Array.isArray(types)
    ? (types as string[])
    : typeof types === "string"
      ? [types]
      : [];
  return typeArr.some(
    (t) => t === SKOS_CONCEPT_SHORT || t === SKOS_CONCEPT_FULL,
  );
}

function resolveParentExternalId(broader: unknown): string | undefined {
  const broaderArr = Array.isArray(broader)
    ? broader
    : broader !== undefined && broader !== null
      ? [broader]
      : [];
  const parentRef = broaderArr[0];
  if (typeof parentRef !== "string") return undefined;
  if (parentRef.startsWith(IPTC_BASE)) return toExternalId(parentRef);
  if (parentRef.startsWith("medtop:")) return parentRef;
  return undefined;
}

function readEnglishLabel(prefLabel: unknown): string | undefined {
  if (!prefLabel || typeof prefLabel !== "object") return undefined;

  if (Array.isArray(prefLabel)) {
    const labelArr = prefLabel as Array<Record<string, string>>;
    return labelArr.find((l) => l["@language"] === "en")?.["@value"];
  }

  const labels = prefLabel as Record<string, string>;
  return labels["en-GB"] ?? labels["en-US"] ?? labels.en;
}

function readFrenchLabel(prefLabel: unknown): string | undefined {
  if (!prefLabel || typeof prefLabel !== "object") return undefined;

  if (Array.isArray(prefLabel)) {
    const labelArr = prefLabel as Array<Record<string, string>>;
    return labelArr.find((l) => l["@language"] === "fr")?.["@value"];
  }

  const labels = prefLabel as Record<string, string>;
  return labels["fr-FR"] ?? labels["fr-BE"] ?? labels.fr;
}

/** IPTC IKOS format (2025+): top-level `conceptSet` array. */
function parseIkosConceptSet(data: Record<string, unknown>): RawIptcNode[] {
  const conceptSet = Array.isArray(data.conceptSet)
    ? (data.conceptSet as unknown[])
    : [];
  const nodes: RawIptcNode[] = [];

  for (const item of conceptSet) {
    const concept = item as Record<string, unknown>;
    if (!isConceptType(concept.type)) continue;

    const uri = concept.uri as string | undefined;
    const qcode = concept.qcode as string | undefined;
    if (!uri?.startsWith(IPTC_BASE) && !qcode?.startsWith("medtop:")) {
      continue;
    }

    const externalId = qcode ?? toExternalId(uri!);
    const enLabel = readEnglishLabel(concept.prefLabel);
    if (!enLabel) continue;

    const frLabel = readFrenchLabel(concept.prefLabel);
    const parentExternalId = resolveParentExternalId(concept.broader);
    const retired = concept.retired !== undefined && concept.retired !== false;

    nodes.push({
      externalId,
      label: enLabel,
      ...(frLabel !== undefined && { labelFr: frLabel }),
      ...(parentExternalId !== undefined && { parentExternalId }),
      retired,
    });
  }

  return nodes;
}

/** Legacy JSON-LD `@graph` format. */
function parseJsonLdGraph(data: Record<string, unknown>): RawIptcNode[] {
  const graph = Array.isArray(data["@graph"])
    ? (data["@graph"] as unknown[])
    : [];
  const nodes: RawIptcNode[] = [];

  for (const item of graph) {
    const concept = item as Record<string, unknown>;
    if (!isConceptType(concept["@type"])) continue;

    const id = concept["@id"] as string | undefined;
    if (!id || !id.startsWith(IPTC_BASE)) continue;

    const externalId = toExternalId(id);
    const enLabel = readEnglishLabel(concept["skos:prefLabel"]);
    if (!enLabel) continue;

    const frLabel = readFrenchLabel(concept["skos:prefLabel"]);
    const broader = concept["skos:broader"];
    const broaderArr = Array.isArray(broader)
      ? (broader as Array<Record<string, string>>)
      : broader && typeof broader === "object"
        ? [broader as Record<string, string>]
        : [];
    const parentUri = broaderArr[0]?.["@id"];
    const parentExternalId =
      parentUri && parentUri.startsWith(IPTC_BASE)
        ? toExternalId(parentUri)
        : undefined;

    const deprecated = concept["owl:deprecated"];
    const retired = deprecated === true || deprecated === "true";

    nodes.push({
      externalId,
      label: enLabel,
      ...(frLabel !== undefined && { labelFr: frLabel }),
      ...(parentExternalId !== undefined && { parentExternalId }),
      retired,
    });
  }

  return nodes;
}

/**
 * Parse IPTC Media Topics JSON into a flat node list.
 * Supports the current IKOS `conceptSet` format and the legacy JSON-LD `@graph`.
 */
export function parseIptcJson(json: unknown): RawIptcNode[] {
  const data = json as Record<string, unknown>;
  if (Array.isArray(data.conceptSet)) {
    return parseIkosConceptSet(data);
  }
  return parseJsonLdGraph(data);
}

/** Merge French labels from a localized IPTC fetch into English-primary nodes. */
export function mergeIptcLocalizedNodes(
  enNodes: RawIptcNode[],
  frNodes: RawIptcNode[],
): RawIptcNode[] {
  const frById = new Map(frNodes.map((node) => [node.externalId, node.label]));
  return enNodes.map((node) => ({
    ...node,
    ...(frById.has(node.externalId) && { labelFr: frById.get(node.externalId) }),
  }));
}
