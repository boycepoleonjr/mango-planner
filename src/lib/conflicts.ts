// Conflict detection. Rules are explicit and narrow: two choices only conflict
// when both apply everywhere. Scoping either one with a qualifier resolves it,
// so creative combinations ("futuristic" + "minimalist") are never flagged.

import { deselect, qualifierOf } from "./config";
import { getOption, GROUPS, OPTIONS, optionOrder } from "./options";
import type { Config, PreserveFields, SectionId } from "./types";

export type PreserveKey = keyof PreserveFields;

export type Resolution =
  | { type: "keepOnly"; keep: string; remove: string[]; label: string }
  | { type: "deselect"; optionId: string; label: string }
  | { type: "disablePair"; pairId: string; label: string }
  | { type: "scopeOption"; optionId: string; label: string }
  | { type: "scopePair"; pairId: string; label: string }
  | { type: "removeTerm"; fields: PreserveKey[]; term: string; label: string };

export interface Conflict {
  id: string;
  sections: SectionId[];
  title: string;
  message: string;
  optionIds: string[];
  pairIds: string[];
  /** Preserve-field terms excluded from output while unresolved. */
  terms: { term: string; fields: PreserveKey[] }[];
  resolutions: Resolution[];
}

const GROUP_SECTION = new Map(GROUPS.map((g) => [g.id, g.section]));

const CONFLICT_GROUP_NAMES: Record<string, string> = {
  density: "density",
  radius: "corner style",
  "type-scale": "type scale",
  motion: "motion",
};

/** Option pairs that contradict each other when both apply everywhere. */
const OPTION_RULES: { a: string; b: string; why: string }[] = [
  {
    a: "surface.flat",
    b: "surface.layered",
    why: "Flat surfaces have no depth, while a layered model depends on visible depth.",
  },
  {
    a: "surface.flat",
    b: "surface.elevation",
    why: "Flat surfaces rule out shadows, while restrained elevation adds them.",
  },
];

/** Options that contradict an avoid/replace pair when both are unscoped. */
const PAIR_RULES: { optionId: string; pairId: string; why: string }[] = [
  {
    optionId: "density.spacious",
    pairId: "whitespace",
    why: "Spacious density asks for more whitespace, while the avoid rule asks for less.",
  },
  {
    optionId: "motion.expressive",
    pairId: "animation",
    why: "Expressive motion asks for decorative animation, while the avoid rule removes it.",
  },
];

// Deliberately NOT conflicts:
// - Expressive motion + reduced-motion support: honoring the OS setting is
//   how expressive motion should behave.
// - Muted saturation + high-contrast accents: muted base, vivid emphasis.
// - Angular shapes + pill-shaped controls: a common deliberate contrast.

const PROTECTED_FIELDS: PreserveKey[] = [
  "functionality",
  "components",
  "routes",
  "copy",
  "mustNotChange",
];

export const PRESERVE_LABELS: Record<PreserveKey, string> = {
  functionality: "Functionality to preserve",
  components: "Components to preserve",
  routes: "Routes or integrations to preserve",
  copy: "Copy or content to preserve",
  mayChange: "Areas that may change",
  mustNotChange: "Areas that must not change",
};

export function normalizeTerm(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^the /, "")
    .replace(/[.!]+$/, "")
    .trim();
}

/** Split a free-text list on newlines, commas, and semicolons. */
export function splitTerms(text: string): string[] {
  return text
    .split(/[\n,;]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Remove every occurrence of a term from a free-text list, keeping line structure. */
export function removeTerm(text: string, term: string): string {
  const target = normalizeTerm(term);
  return text
    .split("\n")
    .map((line) =>
      line
        .split(/[,;]/)
        .map((t) => t.trim())
        .filter((t) => t && normalizeTerm(t) !== target)
        .join(", "),
    )
    .filter((line) => line.trim())
    .join("\n");
}

function label(id: string): string {
  return getOption(id)?.label ?? id;
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

export function detectConflicts(config: Config): Conflict[] {
  const conflicts: Conflict[] = [];
  const selected = new Set(config.selected);
  const unscoped = (id: string) => selected.has(id) && !qualifierOf(config, id);
  const section = (id: string): SectionId =>
    GROUP_SECTION.get(getOption(id)?.group ?? "") ?? "context";

  // 1. Conflict groups: two or more unscoped picks from the same group.
  const byGroup = new Map<string, string[]>();
  for (const option of OPTIONS) {
    if (option.conflictGroup && unscoped(option.id)) {
      const list = byGroup.get(option.conflictGroup) ?? [];
      list.push(option.id);
      byGroup.set(option.conflictGroup, list);
    }
  }
  for (const [key, ids] of byGroup) {
    if (ids.length < 2) continue;
    const names = ids.map(label);
    const groupName = CONFLICT_GROUP_NAMES[key] ?? key;
    conflicts.push({
      id: `group:${key}`,
      sections: [section(ids[0])],
      title: `Conflicting ${groupName}`,
      message: `${joinNames(names)} are ${ids.length === 2 ? "both" : "all"} set to apply everywhere, so the agent can't follow ${ids.length === 2 ? "both" : "them all"}. Keep one, or add a qualifier that scopes one to a specific area (for example “${getOption(ids[0])?.qualifierHint ?? "in one area"}”).`,
      optionIds: ids,
      pairIds: [],
      terms: [],
      resolutions: [
        ...ids.map<Resolution>((keep) => ({
          type: "keepOnly",
          keep,
          remove: ids.filter((id) => id !== keep),
          label: `Keep only ${label(keep)}`,
        })),
        ...ids.map<Resolution>((optionId) => ({
          type: "scopeOption",
          optionId,
          label: `Scope ${label(optionId)}`,
        })),
      ],
    });
  }

  // 2. Explicit option-vs-option rules.
  for (const rule of OPTION_RULES) {
    if (!unscoped(rule.a) || !unscoped(rule.b)) continue;
    conflicts.push({
      id: `rule:${rule.a}|${rule.b}`,
      sections: [section(rule.a)],
      title: `${label(rule.a)} vs. ${label(rule.b)}`,
      message: `${rule.why} Remove one, or add a qualifier to scope one of them.`,
      optionIds: [rule.a, rule.b],
      pairIds: [],
      terms: [],
      resolutions: [
        {
          type: "deselect",
          optionId: rule.b,
          label: `Keep only ${label(rule.a)}`,
        },
        {
          type: "deselect",
          optionId: rule.a,
          label: `Keep only ${label(rule.b)}`,
        },
        {
          type: "scopeOption",
          optionId: rule.a,
          label: `Scope ${label(rule.a)}`,
        },
        {
          type: "scopeOption",
          optionId: rule.b,
          label: `Scope ${label(rule.b)}`,
        },
      ],
    });
  }

  // 3. Option vs. enabled avoid/replace pair.
  for (const rule of PAIR_RULES) {
    const pair = config.avoidPairs.find((p) => p.id === rule.pairId);
    if (!pair || !pair.enabled || pair.scope.trim() || !unscoped(rule.optionId))
      continue;
    conflicts.push({
      id: `pair:${rule.optionId}|${rule.pairId}`,
      sections: [section(rule.optionId), "avoid"],
      title: `${label(rule.optionId)} vs. “Avoid ${pair.avoid}”`,
      message: `${rule.why} Remove one, or scope either the option or the avoid rule to a specific area.`,
      optionIds: [rule.optionId],
      pairIds: [rule.pairId],
      terms: [],
      resolutions: [
        {
          type: "disablePair",
          pairId: rule.pairId,
          label: `Keep ${label(rule.optionId)}`,
        },
        {
          type: "deselect",
          optionId: rule.optionId,
          label: `Keep the avoid rule`,
        },
        {
          type: "scopeOption",
          optionId: rule.optionId,
          label: `Scope ${label(rule.optionId)}`,
        },
        {
          type: "scopePair",
          pairId: rule.pairId,
          label: "Scope the avoid rule",
        },
      ],
    });
  }

  // 4. The same item listed as both changeable and protected.
  const mayChange = new Map<string, string>();
  for (const t of splitTerms(config.preserve.mayChange)) {
    mayChange.set(normalizeTerm(t), t);
  }
  const seen = new Set<string>();
  for (const [norm, original] of mayChange) {
    if (!norm || seen.has(norm)) continue;
    const fields = PROTECTED_FIELDS.filter((f) =>
      splitTerms(config.preserve[f]).some((t) => normalizeTerm(t) === norm),
    );
    if (!fields.length) continue;
    seen.add(norm);
    const where = joinNames(fields.map((f) => `“${PRESERVE_LABELS[f]}”`));
    conflicts.push({
      id: `preserve:${norm}`,
      sections: ["preserve"],
      title: `“${original}” is both changeable and protected`,
      message: `“${original}” appears in “Areas that may change” and in ${where}. Decide whether it may be redesigned.`,
      optionIds: [],
      pairIds: [],
      terms: [{ term: original, fields: ["mayChange", ...fields] }],
      resolutions: [
        {
          type: "removeTerm",
          fields,
          term: original,
          label: "Allow it to change",
        },
        {
          type: "removeTerm",
          fields: ["mayChange"],
          term: original,
          label: "Keep it protected",
        },
      ],
    });
  }

  return conflicts;
}

/** Apply a data-changing resolution. Scope resolutions are UI focus actions and return config unchanged. */
export function applyResolution(config: Config, r: Resolution): Config {
  switch (r.type) {
    case "keepOnly":
      return r.remove.reduce(deselect, config);
    case "deselect":
      return deselect(config, r.optionId);
    case "disablePair":
      return {
        ...config,
        avoidPairs: config.avoidPairs.map((p) =>
          p.id === r.pairId ? { ...p, enabled: false } : p,
        ),
      };
    case "removeTerm": {
      const preserve = { ...config.preserve };
      for (const f of r.fields) preserve[f] = removeTerm(preserve[f], r.term);
      return { ...config, preserve };
    }
    case "scopeOption":
    case "scopePair":
      return config;
  }
}

export interface Exclusions {
  options: Set<string>;
  pairs: Set<string>;
  terms: { term: string; fields: PreserveKey[] }[];
}

export function exclusionsFor(conflicts: Conflict[]): Exclusions {
  return {
    options: new Set(conflicts.flatMap((c) => c.optionIds)),
    pairs: new Set(conflicts.flatMap((c) => c.pairIds)),
    terms: conflicts.flatMap((c) => c.terms),
  };
}

export function sortByDefinition(ids: string[]): string[] {
  return [...ids].sort((a, b) => optionOrder(a) - optionOrder(b));
}
