// localStorage persistence. Stored data is untrusted: every read is parsed
// defensively and coerced onto a valid Config, so a corrupt or outdated entry
// never breaks the app.

import { builtInPairs, createDefaultConfig, emptyRevisionItem } from "./config";
import { getGroup, getOption } from "./options";
import type {
  AvoidPair,
  Config,
  CriterionOverride,
  OptionEdit,
  Preset,
  Reference,
  RevisionItem,
  SectionId,
} from "./types";

export const CONFIG_KEY = "mango-planner:config:v1";
export const PRESETS_KEY = "mango-planner:presets:v1";
export const THEME_KEY = "mango-planner:theme";

export type KeyValueStore = Pick<Storage, "getItem" | "setItem">;

const SECTION_IDS: SectionId[] = [
  "context",
  "visual",
  "layout",
  "typography",
  "color",
  "interaction",
  "states",
  "avoid",
  "preserve",
  "references",
  "acceptance",
];

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;
const strArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

function pickStrings<T extends { [K in keyof T]: string }>(
  raw: unknown,
  defaults: T,
): T {
  const src = isObj(raw) ? raw : {};
  const out = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    out[key] = str(src[key as string], defaults[key]) as T[keyof T];
  }
  return out;
}

function sanitizeSelected(raw: unknown): string[] {
  const ids = [...new Set(strArray(raw))].filter((id) => getOption(id));
  const out: string[] = [];
  const perGroup = new Map<string, number>();
  for (const id of ids) {
    const group = getGroup(getOption(id)!.group)!;
    const count = perGroup.get(group.id) ?? 0;
    const limit =
      group.selectionType === "single" ? 1 : (group.maxSelections ?? Infinity);
    if (count >= limit) continue;
    perGroup.set(group.id, count + 1);
    out.push(id);
  }
  return out;
}

function sanitizeEdits(raw: unknown): Record<string, OptionEdit> {
  const out: Record<string, OptionEdit> = {};
  if (!isObj(raw)) return out;
  for (const [id, value] of Object.entries(raw)) {
    if (!getOption(id) || !isObj(value)) continue;
    const edit: OptionEdit = {};
    if (typeof value.qualifier === "string" && value.qualifier)
      edit.qualifier = value.qualifier;
    if (typeof value.instruction === "string")
      edit.instruction = value.instruction;
    if (Object.keys(edit).length) out[id] = edit;
  }
  return out;
}

function sanitizePairs(raw: unknown): AvoidPair[] {
  const stored = Array.isArray(raw) ? raw.filter(isObj) : [];
  const byId = new Map(stored.map((p) => [str(p.id), p]));
  const builtIns = builtInPairs().map((def) => {
    const p = byId.get(def.id);
    if (!p) return def;
    return {
      ...def,
      avoid: str(p.avoid, def.avoid),
      use: str(p.use, def.use),
      scope: str(p.scope),
      enabled: p.enabled === true,
    };
  });
  const builtInIds = new Set(builtIns.map((p) => p.id));
  const custom = stored
    .filter((p) => str(p.id) && !builtInIds.has(str(p.id)))
    .map<AvoidPair>((p) => ({
      id: str(p.id),
      avoid: str(p.avoid),
      use: str(p.use),
      scope: str(p.scope),
      enabled: p.enabled !== false,
      builtIn: false,
    }));
  return [...builtIns, ...custom];
}

function sanitizeReferences(raw: unknown): Reference[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isObj).map((r, i) => ({
    id: str(r.id) || `ref-${i + 1}`,
    name: str(r.name),
    borrow: str(r.borrow),
    avoid: str(r.avoid),
  }));
}

function sanitizeRevision(raw: unknown): RevisionItem[] {
  const items = Array.isArray(raw)
    ? raw.filter(isObj).map((r, i) => ({
        id: str(r.id) || `rev-${i + 1}`,
        element: str(r.element),
        problem: str(r.problem),
        change: str(r.change),
        preserve: str(r.preserve),
      }))
    : [];
  return items.length ? items : [emptyRevisionItem()];
}

function sanitizeCriteria(raw: unknown): Config["criteria"] {
  const src = isObj(raw) ? raw : {};
  const overrides: Record<string, CriterionOverride> = {};
  if (isObj(src.overrides)) {
    for (const [id, v] of Object.entries(src.overrides)) {
      if (!isObj(v)) continue;
      const o: CriterionOverride = { enabled: v.enabled !== false };
      if (typeof v.text === "string") o.text = v.text;
      overrides[id] = o;
    }
  }
  return { overrides, custom: strArray(src.custom) };
}

function sanitizeCustom(raw: unknown): Config["custom"] {
  const out: Config["custom"] = {};
  if (!isObj(raw)) return out;
  for (const id of SECTION_IDS) {
    const list = strArray(raw[id]);
    if (list.length) out[id] = list;
  }
  return out;
}

/** Coerce unknown data into a valid Config. Returns null if it isn't a config at all. */
export function sanitizeConfig(raw: unknown): Config | null {
  if (!isObj(raw) || raw.version !== 1) return null;
  const d = createDefaultConfig();
  return {
    version: 1,
    mode: raw.mode === "revision" ? "revision" : "brief",
    outputLength: raw.outputLength === "concise" ? "concise" : "detailed",
    context: pickStrings(raw.context, d.context),
    details: pickStrings(raw.details, d.details),
    selected: Array.isArray(raw.selected)
      ? sanitizeSelected(raw.selected)
      : d.selected,
    edits: sanitizeEdits(raw.edits),
    custom: sanitizeCustom(raw.custom),
    avoidPairs: sanitizePairs(raw.avoidPairs),
    preserve: pickStrings(raw.preserve, d.preserve),
    references: sanitizeReferences(raw.references),
    criteria: sanitizeCriteria(raw.criteria),
    revision: sanitizeRevision(raw.revision),
  };
}

export interface LoadResult<T> {
  value: T;
  /** True when stored data existed but could not be used. */
  recovered: boolean;
}

function readJson(
  store: KeyValueStore,
  key: string,
): { found: boolean; data?: unknown; ok: boolean } {
  let raw: string | null;
  try {
    raw = store.getItem(key);
  } catch {
    return { found: false, ok: false };
  }
  if (raw === null) return { found: false, ok: true };
  try {
    return { found: true, data: JSON.parse(raw), ok: true };
  } catch {
    return { found: true, ok: false };
  }
}

export function loadConfig(store: KeyValueStore): LoadResult<Config> {
  const { found, data, ok } = readJson(store, CONFIG_KEY);
  if (!found) return { value: createDefaultConfig(), recovered: false };
  const config = ok ? sanitizeConfig(data) : null;
  if (!config) return { value: createDefaultConfig(), recovered: true };
  return { value: config, recovered: false };
}

export function saveConfig(store: KeyValueStore, config: Config): boolean {
  try {
    store.setItem(CONFIG_KEY, JSON.stringify(config));
    return true;
  } catch {
    return false;
  }
}

export function loadUserPresets(store: KeyValueStore): LoadResult<Preset[]> {
  const { found, data, ok } = readJson(store, PRESETS_KEY);
  if (!found) return { value: [], recovered: false };
  if (!ok || !Array.isArray(data)) return { value: [], recovered: true };
  let dropped = false;
  const presets: Preset[] = [];
  for (const item of data) {
    const config = isObj(item) ? sanitizeConfig(item.config) : null;
    if (!isObj(item) || !config || !str(item.name).trim()) {
      dropped = true;
      continue;
    }
    presets.push({
      id: str(item.id) || `preset-${presets.length + 1}`,
      name: str(item.name).trim(),
      description: str(item.description),
      builtIn: false,
      config,
    });
  }
  return { value: presets, recovered: dropped };
}

export function saveUserPresets(
  store: KeyValueStore,
  presets: Preset[],
): boolean {
  try {
    store.setItem(PRESETS_KEY, JSON.stringify(presets));
    return true;
  } catch {
    return false;
  }
}

/** localStorage if usable (it can throw in private modes or sandboxed frames). */
export function browserStore(): KeyValueStore | null {
  try {
    const s = window.localStorage;
    const probe = "mango-planner:probe";
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}
