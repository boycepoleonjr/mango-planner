// Configuration state: defaults and pure update helpers.

import { BUILT_IN_PAIRS, ESSENTIAL_A11Y, getGroup, getOption } from "./options";
import type { AvoidPair, Config, OptionEdit, RevisionItem } from "./types";

let counter = 0;
export function uid(prefix = "id"): string {
  counter += 1;
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rand}${counter}`;
}

export function builtInPairs(): AvoidPair[] {
  return BUILT_IN_PAIRS.map((p) => ({
    id: p.id,
    avoid: p.avoid,
    use: p.use,
    scope: "",
    enabled: false,
    builtIn: true,
  }));
}

export function emptyRevisionItem(id = "rev-1"): RevisionItem {
  return { id, element: "", problem: "", change: "", preserve: "" };
}

export function createDefaultConfig(): Config {
  return {
    version: 1,
    mode: "brief",
    outputLength: "detailed",
    context: {
      projectName: "",
      customInterfaceType: "",
      targetUser: "",
      primaryGoal: "",
      primaryAction: "",
      constraints: "",
    },
    details: {
      headingFont: "",
      bodyFont: "",
      typographyNotes: "",
      accentColor: "",
      brandColors: "",
      radius: "",
    },
    selected: [...ESSENTIAL_A11Y],
    edits: {},
    custom: {},
    avoidPairs: builtInPairs(),
    preserve: {
      functionality: "",
      components: "",
      routes: "",
      copy: "",
      mayChange: "",
      mustNotChange: "",
    },
    references: [],
    criteria: { overrides: {}, custom: [] },
    revision: [emptyRevisionItem()],
  };
}

export function isSelected(config: Config, optionId: string): boolean {
  return config.selected.includes(optionId);
}

export type ToggleResult =
  { ok: true; config: Config } | { ok: false; reason: string };

/**
 * Toggle an option. Single-select groups replace their current choice;
 * multi-select groups respect maxSelections.
 */
export function toggleOption(config: Config, optionId: string): ToggleResult {
  const option = getOption(optionId);
  if (!option) return { ok: false, reason: "Unknown option." };
  const group = getGroup(option.group)!;

  if (isSelected(config, optionId)) {
    return {
      ok: true,
      config: {
        ...config,
        selected: config.selected.filter((id) => id !== optionId),
      },
    };
  }

  if (group.selectionType === "single") {
    const others = new Set(group.options.map((o) => o.id));
    return {
      ok: true,
      config: {
        ...config,
        selected: [
          ...config.selected.filter((id) => !others.has(id)),
          optionId,
        ],
      },
    };
  }

  if (group.maxSelections) {
    const count = config.selected.filter(
      (id) => getOption(id)?.group === group.id,
    ).length;
    if (count >= group.maxSelections) {
      return {
        ok: false,
        reason: `Choose at most ${group.maxSelections} for ${group.label.toLowerCase()}. Deselect one first.`,
      };
    }
  }

  return {
    ok: true,
    config: { ...config, selected: [...config.selected, optionId] },
  };
}

export function deselect(config: Config, optionId: string): Config {
  return {
    ...config,
    selected: config.selected.filter((id) => id !== optionId),
  };
}

export function clearGroup(config: Config, groupId: string): Config {
  return {
    ...config,
    selected: config.selected.filter((id) => getOption(id)?.group !== groupId),
  };
}

export function setEdit(
  config: Config,
  optionId: string,
  patch: OptionEdit,
): Config {
  const next = { ...config.edits[optionId], ...patch };
  const edits = { ...config.edits };
  const empty = !next.qualifier && next.instruction === undefined;
  if (empty) delete edits[optionId];
  else edits[optionId] = next;
  return { ...config, edits };
}

export function qualifierOf(config: Config, optionId: string): string {
  return (config.edits[optionId]?.qualifier ?? "").trim();
}

/** The instruction to emit: the user's rewrite if present, else the default. */
export function instructionOf(config: Config, optionId: string): string {
  const custom = config.edits[optionId]?.instruction;
  if (custom !== undefined) return custom.trim();
  return getOption(optionId)?.instruction ?? "";
}

/** Whether there is anything worth protecting before replacing the config. */
export function hasUserChanges(config: Config): boolean {
  const strip = (c: Config) =>
    JSON.stringify({
      ...c,
      mode: null,
      outputLength: null,
      revision: c.revision.map((r) => ({ ...r, id: null })),
    });
  return strip(config) !== strip(createDefaultConfig());
}
