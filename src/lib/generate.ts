// Deterministic prompt generation. The same Config always yields the same
// text: options are emitted in definition order, never click order, and no
// randomness or time is involved.

import { instructionOf, qualifierOf } from "./config";
import {
  detectConflicts,
  exclusionsFor,
  removeTerm,
  type Conflict,
  type Exclusions,
  type PreserveKey,
} from "./conflicts";
import { getOption, GROUPS, optionOrder } from "./options";
import type { Config, OutputHeading, SectionId } from "./types";

export const FINAL_INSTRUCTION =
  "Before implementing, briefly describe the proposed approach and flag any conflicting requirements.";

export const HEADING_ORDER: OutputHeading[] = [
  "TASK",
  "USER AND GOAL",
  "VISUAL DIRECTION",
  "LAYOUT AND HIERARCHY",
  "INTERACTION REQUIREMENTS",
  "STATES AND ACCESSIBILITY",
  "RESPONSIVE BEHAVIOR",
  "AVOID AND REPLACE",
  "PRESERVE AND SCOPE",
  "REFERENCES",
  "ACCEPTANCE CRITERIA",
];

/** Which editor sections feed custom instructions into which heading. */
const CUSTOM_TARGET: Record<SectionId, OutputHeading> = {
  context: "TASK",
  visual: "VISUAL DIRECTION",
  color: "VISUAL DIRECTION",
  layout: "LAYOUT AND HIERARCHY",
  typography: "LAYOUT AND HIERARCHY",
  interaction: "INTERACTION REQUIREMENTS",
  states: "STATES AND ACCESSIBILITY",
  avoid: "AVOID AND REPLACE",
  preserve: "PRESERVE AND SCOPE",
  references: "REFERENCES",
  acceptance: "ACCEPTANCE CRITERIA",
};

const CUSTOM_ORDER: SectionId[] = [
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

export interface PromptItem {
  text: string;
  sub?: string[];
}

export interface PromptSection {
  heading: OutputHeading;
  items: PromptItem[];
}

export interface DerivedCriterion {
  id: string;
  text: string;
}

export interface GeneratedPrompt {
  text: string;
  title: string;
  sections: PromptSection[];
  isEmpty: boolean;
  conflicts: Conflict[];
}

// ---------- text helpers ----------

export function clean(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Capitalize and terminate a fragment as a sentence. */
export function sentence(s: string): string {
  const t = clean(s);
  if (!t) return "";
  const cap = t[0].toUpperCase() + t.slice(1);
  return /[.!?:)”"]$/.test(cap) ? cap : `${cap}.`;
}

function stripEnd(s: string): string {
  return clean(s).replace(/[.!]+$/, "");
}

/** Lowercase a leading word unless it looks like an acronym or proper noun run. */
function lowerFirst(s: string): string {
  const t = clean(s);
  if (t.length > 1 && /[A-Z]/.test(t[0]) && /[a-z]/.test(t[1])) {
    return t[0].toLowerCase() + t.slice(1);
  }
  return t;
}

function withQualifier(instruction: string, qualifier: string): string {
  const base = clean(instruction);
  const q = stripEnd(qualifier);
  if (!q) return sentence(base);
  return `${stripEnd(sentence(base))} (${q}).`;
}

function listText(s: string): string {
  return s
    .split("\n")
    .map((l) => stripEnd(l))
    .filter(Boolean)
    .join("; ");
}

export function dedupeKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function article(word: string): string {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

export function joinList(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

// ---------- section builders ----------

class Builder {
  private sections = new Map<OutputHeading, PromptItem[]>();
  private seen = new Set<string>();

  add(heading: OutputHeading, text: string, sub?: string[]) {
    const t = clean(text);
    if (!t) return;
    const key = dedupeKey(t);
    if (!key || this.seen.has(key)) return;
    this.seen.add(key);
    const subs = sub?.map(clean).filter(Boolean);
    const list = this.sections.get(heading) ?? [];
    list.push(subs?.length ? { text: t, sub: subs } : { text: t });
    this.sections.set(heading, list);
  }

  build(): PromptSection[] {
    return HEADING_ORDER.filter((h) => this.sections.get(h)?.length).map(
      (h) => ({
        heading: h,
        items: this.sections.get(h)!,
      }),
    );
  }
}

function selectedInGroup(
  config: Config,
  groupId: string,
  ex: Exclusions,
): string[] {
  return config.selected
    .filter((id) => getOption(id)?.group === groupId && !ex.options.has(id))
    .sort((a, b) => optionOrder(a) - optionOrder(b));
}

function optionLine(config: Config, id: string): string {
  return withQualifier(instructionOf(config, id), qualifierOf(config, id));
}

function taskLead(config: Config): string {
  const iface = config.selected.find(
    (id) => getOption(id)?.group === "interface",
  );
  const kind = config.selected.find((id) => getOption(id)?.group === "kind");
  const platform = config.selected.find(
    (id) => getOption(id)?.group === "platform",
  );
  if (!iface && !kind && !platform) return "";

  let noun = iface ? (getOption(iface)?.phrase ?? "interface") : "interface";
  if (iface === "interface.custom") {
    noun = stripEnd(config.context.customInterfaceType) || "interface";
  }
  let lead: string;
  if (kind === "kind.revision") lead = `Revise the existing ${noun}`;
  else if (kind === "kind.new") lead = `Design a new ${noun}`;
  else lead = `Design ${article(noun)} ${noun}`;
  if (platform) lead += ` for ${getOption(platform)?.phrase}`;
  return sentence(lead);
}

function preserveItems(config: Config, ex: Exclusions): string[] {
  const p = { ...config.preserve };
  for (const { term, fields } of ex.terms) {
    for (const f of fields) p[f] = removeTerm(p[f], term);
  }
  const lines: [PreserveKey, string][] = [
    ["functionality", "Preserve this functionality exactly as it works today"],
    ["components", "Keep these components unchanged"],
    ["routes", "Keep these routes and integrations working unchanged"],
    ["copy", "Keep this copy and content as written"],
    ["mustNotChange", "Do not change"],
    ["mayChange", "You may change"],
  ];
  return lines
    .filter(([k]) => listText(p[k]))
    .map(([k, prefix]) => `${prefix}: ${listText(p[k])}.`);
}

function scopePrefix(scope: string): string {
  const s = stripEnd(scope);
  if (!s) return "";
  const starts =
    /^(in|on|for|within|across|when|during|at|inside|outside|throughout)\b/i;
  const phrase = starts.test(s) ? s : `in ${s}`;
  return phrase[0].toUpperCase() + phrase.slice(1);
}

function avoidLine(avoid: string, use: string, scope: string): string {
  const a = stripEnd(avoid).replace(/^avoid\s+/i, "");
  const u = stripEnd(use).replace(/^use\s+/i, "");
  if (!a) return "";
  const prefix = scopePrefix(scope);
  const verb = prefix ? `${prefix}, avoid` : "Avoid";
  return u ? `${verb} ${a}; use ${u} instead.` : `${verb} ${a}.`;
}

export function deriveCriteria(
  config: Config,
  ex?: Exclusions,
): DerivedCriterion[] {
  const exclusions = ex ?? exclusionsFor(detectConflicts(config));
  const out: DerivedCriterion[] = [];
  const action = stripEnd(config.context.primaryAction);
  if (action) {
    out.push({
      id: "primary-action",
      text: `“${action}” is the most prominent action on its screen.`,
    });
  }
  const ordered = [...config.selected]
    .filter((id) => !exclusions.options.has(id))
    .sort((a, b) => optionOrder(a) - optionOrder(b));
  for (const id of ordered) {
    const c = getOption(id)?.criterion;
    if (c) out.push({ id: `opt:${id}`, text: c });
  }
  const states = ordered
    .filter((id) => getOption(id)?.group === "state")
    .map((id) => getOption(id)!.label.toLowerCase());
  if (states.length) {
    out.push({
      id: "states",
      text: sentence(`${joinList(states)} states are specified`),
    });
  }
  const p = config.preserve;
  if (p.functionality.trim())
    out.push({
      id: "preserve:functionality",
      text: "Existing functionality listed under “Preserve” remains unchanged.",
    });
  if (p.components.trim())
    out.push({
      id: "preserve:components",
      text: "Components listed under “Preserve” keep their current appearance and behavior.",
    });
  if (p.routes.trim())
    out.push({
      id: "preserve:routes",
      text: "Routes and integrations listed under “Preserve” still work.",
    });
  if (p.copy.trim())
    out.push({
      id: "preserve:copy",
      text: "Preserved copy appears exactly as written.",
    });
  if (p.mustNotChange.trim())
    out.push({
      id: "preserve:must-not-change",
      text: "Areas marked “Do not change” are untouched.",
    });
  if (
    config.avoidPairs.some(
      (pair) =>
        pair.enabled && !exclusions.pairs.has(pair.id) && pair.avoid.trim(),
    )
  ) {
    out.push({
      id: "avoid",
      text: "None of the patterns listed under “Avoid and replace” appear in the result.",
    });
  }
  return out;
}

/** Derived criteria after the user's enable/edit overrides, plus custom criteria. */
export function finalCriteria(config: Config, ex?: Exclusions): string[] {
  const derived = deriveCriteria(config, ex)
    .filter((c) => config.criteria.overrides[c.id]?.enabled !== false)
    .map((c) => config.criteria.overrides[c.id]?.text ?? c.text);
  return [...derived, ...config.criteria.custom].map(sentence).filter(Boolean);
}

export function buildSections(
  config: Config,
  conflicts: Conflict[],
): PromptSection[] {
  const ex = exclusionsFor(conflicts);
  const b = new Builder();

  // TASK
  b.add("TASK", taskLead(config));
  if (config.context.projectName.trim() && !taskLead(config)) {
    b.add("TASK", `Project: ${stripEnd(config.context.projectName)}.`);
  }
  for (const g of ["interface", "kind", "platform"]) {
    for (const id of selectedInGroup(config, g, ex)) {
      if (id === "interface.custom") continue;
      b.add("TASK", optionLine(config, id));
    }
  }
  if (config.context.constraints.trim()) {
    b.add(
      "TASK",
      `Implementation constraints: ${listText(config.context.constraints)}.`,
    );
  }

  // USER AND GOAL
  const { targetUser, primaryGoal, primaryAction } = config.context;
  if (targetUser.trim())
    b.add("USER AND GOAL", `Target user: ${stripEnd(targetUser)}.`);
  if (primaryGoal.trim())
    b.add("USER AND GOAL", `Primary user goal: ${stripEnd(primaryGoal)}.`);
  if (primaryAction.trim()) {
    b.add(
      "USER AND GOAL",
      `Primary action: “${stripEnd(primaryAction)}”. Make it the most prominent action on its screen.`,
    );
  }

  // Option groups, in definition order, under their headings.
  for (const g of GROUPS) {
    if (g.section === "context") continue;
    const ids = selectedInGroup(config, g.id, ex);
    if (!ids.length) continue;
    if (g.id === "state") {
      const subs = ids.map((id) => optionLine(config, id));
      b.add(
        g.heading,
        "Specify these states for each interactive component:",
        subs,
      );
      continue;
    }
    for (const id of ids) b.add(g.heading, optionLine(config, id));
    if (g.id === "shape" && config.details.radius.trim()) {
      b.add(
        "VISUAL DIRECTION",
        `Border radius: ${stripEnd(config.details.radius)}.`,
      );
    }
  }

  // Detail fields — only what the user typed; nothing invented.
  const d = config.details;
  if (d.accentColor.trim())
    b.add(
      "VISUAL DIRECTION",
      `Use ${stripEnd(d.accentColor)} as the accent color.`,
    );
  if (d.brandColors.trim())
    b.add(
      "VISUAL DIRECTION",
      `Brand colors to incorporate: ${listText(d.brandColors)}.`,
    );
  if (d.radius.trim())
    b.add("VISUAL DIRECTION", `Border radius: ${stripEnd(d.radius)}.`);
  if (d.headingFont.trim())
    b.add(
      "LAYOUT AND HIERARCHY",
      `Use ${stripEnd(d.headingFont)} for headings.`,
    );
  if (d.bodyFont.trim())
    b.add("LAYOUT AND HIERARCHY", `Use ${stripEnd(d.bodyFont)} for body text.`);
  if (d.typographyNotes.trim())
    b.add("LAYOUT AND HIERARCHY", sentence(listText(d.typographyNotes)));

  // AVOID AND REPLACE
  for (const pair of config.avoidPairs) {
    if (!pair.enabled || ex.pairs.has(pair.id)) continue;
    b.add("AVOID AND REPLACE", avoidLine(pair.avoid, pair.use, pair.scope));
  }

  // PRESERVE AND SCOPE
  const preserve = preserveItems(config, ex);
  for (const line of preserve) b.add("PRESERVE AND SCOPE", line);
  if (preserve.length && config.selected.includes("kind.revision")) {
    b.add(
      "PRESERVE AND SCOPE",
      "Do not redesign areas this brief does not mention.",
    );
  }

  // REFERENCES
  const refs = config.references.filter((r) => r.name.trim());
  if (refs.length) {
    b.add(
      "REFERENCES",
      "These notes describe user-chosen references; the references have not been fetched or analyzed. Work from the notes, not assumptions about the references.",
    );
    for (const r of refs) {
      const sub: string[] = [];
      if (r.borrow.trim()) sub.push(`Borrow: ${stripEnd(r.borrow)}.`);
      if (r.avoid.trim()) sub.push(`Do not borrow: ${stripEnd(r.avoid)}.`);
      b.add("REFERENCES", `${stripEnd(r.name)}${sub.length ? "" : "."}`, sub);
    }
  }

  // Custom instructions per section.
  for (const s of CUSTOM_ORDER) {
    for (const text of config.custom[s] ?? []) {
      if (s === "acceptance") continue; // handled with criteria
      b.add(CUSTOM_TARGET[s], sentence(text));
    }
  }

  // ACCEPTANCE CRITERIA
  for (const c of finalCriteria(config, ex)) b.add("ACCEPTANCE CRITERIA", c);

  return b.build();
}

function titleCase(h: string): string {
  const s = h.toLowerCase();
  return s[0].toUpperCase() + s.slice(1);
}

export function renderSections(
  title: string,
  sections: PromptSection[],
  length: Config["outputLength"],
): string {
  const parts: string[] = [`# ${title}`];
  for (const s of sections) {
    if (length === "detailed") {
      const lines = s.items.flatMap((i) => [
        `- ${i.text}`,
        ...(i.sub ?? []).map((t) => `  - ${t}`),
      ]);
      parts.push(`## ${s.heading}\n${lines.join("\n")}`);
    } else {
      const text = s.items
        .map((i) => {
          if (!i.sub?.length) return i.text;
          const lead = i.text.replace(/:$/, "");
          return `${lead}: ${i.sub.map(stripEnd).join("; ")}.`;
        })
        .join(" ");
      parts.push(`**${titleCase(s.heading)}:** ${text}`);
    }
  }
  parts.push(FINAL_INSTRUCTION);
  return parts.join("\n\n") + "\n";
}

export function generatePrompt(config: Config): GeneratedPrompt {
  const conflicts = detectConflicts(config);
  const sections = buildSections(config, conflicts);
  const name = stripEnd(config.context.projectName);
  const title = name ? `Design brief: ${name}` : "Design brief";
  const isEmpty = sections.length === 0;
  return {
    title,
    sections,
    conflicts,
    isEmpty,
    text: isEmpty ? "" : renderSections(title, sections, config.outputLength),
  };
}

// ---------- targeted revision mode ----------

export function revisionParagraph(item: Config["revision"][number]): string {
  const element = stripEnd(item.element).replace(/^the\s+/i, "");
  const problem = lowerFirst(
    stripEnd(item.problem).replace(/^(has|have)\s+/i, ""),
  );
  const change = lowerFirst(stripEnd(item.change).replace(/^change\s+/i, ""));
  const keep = lowerFirst(stripEnd(item.preserve).replace(/^preserve\s+/i, ""));
  if (!element && !problem && !change && !keep) return "";
  const out: string[] = [];
  if (problem) out.push(`The ${element || "selected area"} has ${problem}.`);
  else if (element) out.push(`This feedback is about the ${element}.`);
  if (change) out.push(`Change ${change}.`);
  if (keep) out.push(`Preserve ${keep}.`);
  out.push("Do not redesign unrelated areas.");
  return out.join(" ");
}

export function generateRevision(config: Config): {
  text: string;
  isEmpty: boolean;
} {
  const paragraphs = config.revision.map(revisionParagraph).filter(Boolean);
  if (!paragraphs.length) return { text: "", isEmpty: true };
  const name = stripEnd(config.context.projectName);
  const title = name ? `Targeted revision: ${name}` : "Targeted revision";
  const body =
    paragraphs.length === 1
      ? paragraphs[0]
      : paragraphs.map((p, i) => `${i + 1}. ${p}`).join("\n\n");
  return {
    text: `# ${title}\n\n${body}\n\n${FINAL_INSTRUCTION}\n`,
    isEmpty: false,
  };
}

// ---------- optional improvement hints ----------

export interface Suggestion {
  id: string;
  section: SectionId;
  text: string;
}

export function suggestions(config: Config): Suggestion[] {
  const out: Suggestion[] = [];
  const has = (g: string) =>
    config.selected.some((id) => getOption(id)?.group === g);
  const c = config.context;
  if (!has("interface"))
    out.push({
      id: "interface",
      section: "context",
      text: "Choose an interface type so the brief starts with a clear task.",
    });
  if (!c.targetUser.trim())
    out.push({
      id: "user",
      section: "context",
      text: "Describe the target user to make decisions easier to judge.",
    });
  if (!c.primaryGoal.trim())
    out.push({
      id: "goal",
      section: "context",
      text: "Add the primary user goal.",
    });
  if (!c.primaryAction.trim())
    out.push({
      id: "action",
      section: "context",
      text: "Name the primary action so it can be made prominent.",
    });
  if (!has("platform"))
    out.push({
      id: "platform",
      section: "context",
      text: "Pick a platform so layout expectations are explicit.",
    });
  const preserveEmpty = Object.values(config.preserve).every((v) => !v.trim());
  if (config.selected.includes("kind.revision") && preserveEmpty)
    out.push({
      id: "preserve",
      section: "preserve",
      text: "You're revising an existing interface. List what must stay unchanged.",
    });
  if (!has("state"))
    out.push({
      id: "states",
      section: "states",
      text: "Specify states such as loading, empty, and error.",
    });
  return out;
}
