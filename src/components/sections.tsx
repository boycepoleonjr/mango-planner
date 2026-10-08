"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, Plus, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { uid } from "@/lib/config";
import { PRESERVE_LABELS, type PreserveKey } from "@/lib/conflicts";
import { deriveCriteria } from "@/lib/generate";
import { BUILT_IN_PAIRS, groupsForSection } from "@/lib/options";
import type { AvoidPair, Config, SectionId } from "@/lib/types";
import { useEditor } from "./editor-context";
import { OptionGroup } from "./OptionGroup";
import { Button, cx, Field, Input } from "./ui";

// ---------- shared pieces ----------

function Groups({ section, only }: { section: SectionId; only?: string[] }) {
  const groups = groupsForSection(section).filter(
    (g) => !only || only.includes(g.id),
  );
  return (
    <>
      {groups.map((g) => (
        <OptionGroup key={g.id} group={g} />
      ))}
    </>
  );
}

function SubHeading({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <h3 className="text-[13px] font-semibold text-fg">{children}</h3>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

function Callout({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent-line bg-accent-soft px-3 py-2.5 text-[13px] text-fg">
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  );
}

/** Editable list of free-text items with an add field. */
function TextList({
  label,
  items,
  onChange,
  placeholder,
  addLabel,
  lint,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  addLabel: string;
  lint?: (text: string) => string | null;
}) {
  const [draft, setDraft] = useState("");
  const id = useId();
  const add = () => {
    const t = draft.trim();
    if (!t) return;
    onChange([...items, t]);
    setDraft("");
  };
  const draftLint = lint?.(draft);
  return (
    <div className="space-y-2">
      {items.length > 0 && (
        <ul className="space-y-1.5">
          {items.map((item, i) => {
            const warning = lint?.(item);
            return (
              <li key={i} className="space-y-1">
                <div className="flex gap-1.5">
                  <label htmlFor={`${id}-${i}`} className="sr-only">
                    {label} {i + 1}
                  </label>
                  <Input
                    id={`${id}-${i}`}
                    value={item}
                    onChange={(e) =>
                      onChange(
                        items.map((x, j) => (j === i ? e.target.value : x)),
                      )
                    }
                    className="h-8 text-[13px]"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Remove “${item || `item ${i + 1}`}”`}
                    onClick={() => onChange(items.filter((_, j) => j !== i))}
                  >
                    <Trash2 size={14} aria-hidden />
                  </Button>
                </div>
                {warning && <p className="text-xs text-warn">{warning}</p>}
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex gap-1.5">
        <label htmlFor={`${id}-new`} className="sr-only">
          {addLabel}
        </label>
        <Input
          id={`${id}-new`}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className="h-8 text-[13px]"
        />
        <Button size="sm" onClick={add} disabled={!draft.trim()}>
          <Plus size={14} aria-hidden /> Add
        </Button>
      </div>
      {draftLint && <p className="text-xs text-warn">{draftLint}</p>}
    </div>
  );
}

export function CustomInstructions({ section }: { section: SectionId }) {
  const { config, update } = useEditor();
  return (
    <div className="space-y-2 border-t border-line pt-5">
      <SubHeading hint="Added to this part of the prompt exactly as written. Duplicates are removed automatically.">
        Custom instructions
      </SubHeading>
      <TextList
        label="Custom instruction"
        addLabel="New custom instruction"
        items={config.custom[section] ?? []}
        placeholder="e.g. Show the last sync time in the header"
        onChange={(items) =>
          update((c) => ({ ...c, custom: { ...c.custom, [section]: items } }))
        }
      />
    </div>
  );
}

const ctx = (c: Config, patch: Partial<Config["context"]>): Config => ({
  ...c,
  context: { ...c.context, ...patch },
});
const det = (c: Config, patch: Partial<Config["details"]>): Config => ({
  ...c,
  details: { ...c.details, ...patch },
});

// ---------- 1. Project context ----------

export function ContextSection() {
  const { config, update, goToSection } = useEditor();
  const c = config.context;
  const isRevision = config.selected.includes("kind.revision");
  const isCustom = config.selected.includes("interface.custom");
  return (
    <>
      <Field
        label="Project or screen name"
        value={c.projectName}
        placeholder="e.g. Fleet operations dashboard"
        onChange={(v) => update((x) => ctx(x, { projectName: v }))}
      />
      <Groups section="context" only={["interface"]} />
      {isCustom && (
        <Field
          label="Describe the interface type"
          value={c.customInterfaceType}
          placeholder="e.g. kiosk check-in screen"
          onChange={(v) => update((x) => ctx(x, { customInterfaceType: v }))}
        />
      )}
      <Groups section="context" only={["kind"]} />
      {isRevision && (
        <Callout
          action={
            <Button size="sm" onClick={() => goToSection("preserve")}>
              Go to Preserve and scope <ArrowRight size={14} aria-hidden />
            </Button>
          }
        >
          Revising an existing interface: list what must stay unchanged so the
          agent doesn&rsquo;t redesign it.
        </Callout>
      )}
      <Field
        label="Target user"
        hint="Who uses this, in their own terms."
        value={c.targetUser}
        placeholder="e.g. Dispatchers managing 50–200 vehicles during a shift"
        onChange={(v) => update((x) => ctx(x, { targetUser: v }))}
      />
      <Field
        label="Primary user goal"
        hint="What they need to accomplish."
        value={c.primaryGoal}
        placeholder="e.g. Spot delayed vehicles and reassign routes quickly"
        onChange={(v) => update((x) => ctx(x, { primaryGoal: v }))}
      />
      <Field
        label="Primary action"
        hint="The one action that should stand out."
        value={c.primaryAction}
        placeholder="e.g. Reassign route"
        onChange={(v) => update((x) => ctx(x, { primaryAction: v }))}
      />
      <Groups section="context" only={["platform"]} />
      <Field
        label="Framework or component-library constraints"
        hint="Optional. Leave blank to let the agent choose."
        multiline
        rows={2}
        value={c.constraints}
        placeholder="e.g. Next.js App Router, Tailwind, existing shadcn/ui components"
        onChange={(v) => update((x) => ctx(x, { constraints: v }))}
      />
    </>
  );
}

// ---------- 4. Typography ----------

export function TypographySection() {
  const { config, update } = useEditor();
  const d = config.details;
  return (
    <>
      <Groups section="typography" />
      <div className="space-y-4">
        <SubHeading hint="Optional. Blank fields add nothing — the agent won't be told to use any particular font.">
          Fonts
        </SubHeading>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Heading font"
            value={d.headingFont}
            placeholder="e.g. Inter Display"
            onChange={(v) => update((x) => det(x, { headingFont: v }))}
          />
          <Field
            label="Body font"
            value={d.bodyFont}
            placeholder="e.g. Inter"
            onChange={(v) => update((x) => det(x, { bodyFont: v }))}
          />
        </div>
        <Field
          label="Additional typography instructions"
          multiline
          rows={2}
          value={d.typographyNotes}
          placeholder="e.g. Use sentence case for all headings"
          onChange={(v) => update((x) => det(x, { typographyNotes: v }))}
        />
      </div>
    </>
  );
}

// ---------- 5. Color, surfaces, shape ----------

export function ColorSection() {
  const { config, update } = useEditor();
  const d = config.details;
  return (
    <>
      <Groups section="color" />
      <div className="space-y-4">
        <SubHeading hint="Optional. Only what you type is added.">
          Specific values
        </SubHeading>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Accent color"
            value={d.accentColor}
            placeholder="e.g. #2F6FEB"
            onChange={(v) => update((x) => det(x, { accentColor: v }))}
          />
          <Field
            label="Border-radius preference"
            value={d.radius}
            placeholder="e.g. 6px on controls, 10px on panels"
            onChange={(v) => update((x) => det(x, { radius: v }))}
          />
        </div>
        <Field
          label="Brand colors"
          value={d.brandColors}
          placeholder="e.g. Navy #0B1F3A, Sand #E9DCC4"
          onChange={(v) => update((x) => det(x, { brandColors: v }))}
        />
      </div>
    </>
  );
}

// ---------- 8. Avoid and replace ----------

export function AvoidSection() {
  const { config, update, conflicts } = useEditor();
  const [avoid, setAvoid] = useState("");
  const [use, setUse] = useState("");
  const selected = new Set(config.selected);
  const conflicted = new Set(conflicts.flatMap((c) => c.pairIds));
  const setPair = (id: string, patch: Partial<AvoidPair>) =>
    update((c) => ({
      ...c,
      avoidPairs: c.avoidPairs.map((p) =>
        p.id === id ? { ...p, ...patch } : p,
      ),
    }));
  const addPair = () => {
    if (!avoid.trim()) return;
    update((c) => ({
      ...c,
      avoidPairs: [
        ...c.avoidPairs,
        {
          id: uid("pair"),
          avoid: avoid.trim(),
          use: use.trim(),
          scope: "",
          enabled: true,
          builtIn: false,
        },
      ],
    }));
    setAvoid("");
    setUse("");
  };

  return (
    <>
      <p className="text-[13px] text-muted">
        Each rule becomes &ldquo;Avoid&nbsp;[pattern]; use&nbsp;[alternative]
        instead.&rdquo; None of these are wrong everywhere — add a scope when a
        rule only applies to part of the interface.
      </p>
      <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-panel">
        {config.avoidPairs.map((pair) => {
          const def = BUILT_IN_PAIRS.find((b) => b.id === pair.id);
          const suggested =
            !pair.enabled && def?.suggestedBy.some((id) => selected.has(id));
          const modified =
            def && (pair.avoid !== def.avoid || pair.use !== def.use);
          return (
            <PairRow
              key={pair.id}
              pair={pair}
              suggested={!!suggested}
              conflicted={conflicted.has(pair.id)}
              onChange={(patch) => setPair(pair.id, patch)}
              onRestore={
                modified
                  ? () => setPair(pair.id, { avoid: def.avoid, use: def.use })
                  : undefined
              }
              onDelete={
                pair.builtIn
                  ? undefined
                  : () =>
                      update((c) => ({
                        ...c,
                        avoidPairs: c.avoidPairs.filter(
                          (p) => p.id !== pair.id,
                        ),
                      }))
              }
            />
          );
        })}
      </ul>
      <div className="space-y-2">
        <SubHeading>Add your own pair</SubHeading>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Field
            label="Avoid"
            value={avoid}
            placeholder="e.g. modal dialogs for simple edits"
            onChange={setAvoid}
          />
          <Field
            label="Use instead"
            value={use}
            placeholder="e.g. inline editing"
            onChange={setUse}
          />
          <div className="flex items-end">
            <Button onClick={addPair} disabled={!avoid.trim()}>
              <Plus size={14} aria-hidden /> Add pair
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function PairRow({
  pair,
  suggested,
  conflicted,
  onChange,
  onRestore,
  onDelete,
}: {
  pair: AvoidPair;
  suggested: boolean;
  conflicted: boolean;
  onChange: (patch: Partial<AvoidPair>) => void;
  onRestore?: () => void;
  onDelete?: () => void;
}) {
  const { focusRequest, clearFocusRequest } = useEditor();
  const scopeRef = useRef<HTMLInputElement>(null);
  const id = useId();
  useEffect(() => {
    if (focusRequest?.kind === "pairScope" && focusRequest.pairId === pair.id) {
      scopeRef.current?.scrollIntoView({ block: "center" });
      scopeRef.current?.focus();
      clearFocusRequest();
    }
  }, [focusRequest, pair.id, clearFocusRequest]);

  return (
    <li
      className={cx(
        pair.enabled && "bg-accent-soft shadow-[inset_2px_0_0_var(--accent)]",
        conflicted && "bg-warn-soft shadow-[inset_2px_0_0_var(--warn)]",
      )}
    >
      <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5">
        <input
          type="checkbox"
          checked={pair.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
        />
        <span className="min-w-0 text-[13px] leading-snug">
          <span className="text-muted">Avoid</span>{" "}
          <span className="font-medium text-fg">{pair.avoid || "…"}</span>
          <span className="text-faint"> → </span>
          <span className="text-fg">{pair.use || "…"}</span>
          {suggested && (
            <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-accent-ink">
              <Sparkles size={11} aria-hidden /> Suggested for your choices
            </span>
          )}
          {conflicted && (
            <span className="ml-2 text-[11px] font-medium text-warn">
              Conflict
            </span>
          )}
        </span>
      </label>
      {pair.enabled && (
        <div className="grid gap-2 pr-3 pb-3 pl-10 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor={`${id}-a`} className="text-xs text-muted">
              Avoid
            </label>
            <Input
              id={`${id}-a`}
              value={pair.avoid}
              onChange={(e) => onChange({ avoid: e.target.value })}
              className="h-8 text-[13px]"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor={`${id}-u`} className="text-xs text-muted">
              Use instead
            </label>
            <Input
              id={`${id}-u`}
              value={pair.use}
              onChange={(e) => onChange({ use: e.target.value })}
              className="h-8 text-[13px]"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor={`${id}-s`} className="text-xs text-muted">
              Where it applies <span className="text-faint">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              <Input
                id={`${id}-s`}
                ref={scopeRef}
                value={pair.scope}
                placeholder="e.g. in data tables"
                onChange={(e) => onChange({ scope: e.target.value })}
                className="h-8 min-w-[10rem] flex-1 text-[13px]"
              />
              {onRestore && (
                <Button size="sm" variant="ghost" onClick={onRestore}>
                  <RotateCcw size={13} aria-hidden /> Restore text
                </Button>
              )}
              {onDelete && (
                <Button size="sm" variant="ghost" onClick={onDelete}>
                  <Trash2 size={13} aria-hidden /> Delete pair
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

// ---------- 9. Preserve and scope ----------

const PRESERVE_FIELDS: { key: PreserveKey; placeholder: string }[] = [
  {
    key: "functionality",
    placeholder: "e.g. CSV export, bulk selection, keyboard shortcuts",
  },
  { key: "components", placeholder: "e.g. DataTable, DateRangePicker" },
  { key: "routes", placeholder: "e.g. /settings/billing, Stripe checkout" },
  { key: "copy", placeholder: "e.g. Legal disclaimer in the footer" },
  { key: "mayChange", placeholder: "e.g. header, filter bar, empty states" },
  {
    key: "mustNotChange",
    placeholder: "e.g. navigation structure, URL scheme",
  },
];

export function PreserveSection() {
  const { config, update } = useEditor();
  const isRevision = config.selected.includes("kind.revision");
  return (
    <>
      {isRevision && (
        <Callout>
          <strong className="font-semibold">
            You&rsquo;re revising an existing interface.
          </strong>{" "}
          Anything listed here is protected; the agent is told not to redesign
          unrelated areas.
        </Callout>
      )}
      <p className="text-[13px] text-muted">
        Separate items with commas or new lines. Listing the same item as both
        changeable and protected is flagged so you can decide.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {PRESERVE_FIELDS.map(({ key, placeholder }) => (
          <Field
            key={key}
            label={PRESERVE_LABELS[key]}
            multiline
            rows={2}
            value={config.preserve[key]}
            placeholder={placeholder}
            onChange={(v) =>
              update((c) => ({ ...c, preserve: { ...c.preserve, [key]: v } }))
            }
          />
        ))}
      </div>
    </>
  );
}

// ---------- 10. References ----------

export function ReferencesSection() {
  const { config, update } = useEditor();
  const set = (id: string, patch: Partial<Config["references"][number]>) =>
    update((c) => ({
      ...c,
      references: c.references.map((r) =>
        r.id === id ? { ...r, ...patch } : r,
      ),
    }));
  return (
    <>
      <p className="text-[13px] text-muted">
        Links are never opened or analyzed. Describe what to take from each
        reference — your notes are what the agent receives.
      </p>
      {config.references.length === 0 && (
        <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-[13px] text-faint">
          No references yet.
        </p>
      )}
      <ol className="space-y-3">
        {config.references.map((r, i) => (
          <li
            key={r.id}
            className="space-y-3 rounded-lg border border-line bg-panel p-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-faint">
                Reference {i + 1}
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  update((c) => ({
                    ...c,
                    references: c.references.filter((x) => x.id !== r.id),
                  }))
                }
              >
                <Trash2 size={13} aria-hidden /> Remove
              </Button>
            </div>
            <Field
              label="Name or URL"
              value={r.name}
              placeholder="e.g. linear.app"
              onChange={(v) => set(r.id, { name: v })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="What to borrow"
                multiline
                rows={2}
                value={r.borrow}
                placeholder="e.g. keyboard-first command menu"
                onChange={(v) => set(r.id, { borrow: v })}
              />
              <Field
                label="What not to borrow"
                multiline
                rows={2}
                value={r.avoid}
                placeholder="e.g. purple gradient branding"
                onChange={(v) => set(r.id, { avoid: v })}
              />
            </div>
          </li>
        ))}
      </ol>
      <Button
        onClick={() =>
          update((c) => ({
            ...c,
            references: [
              ...c.references,
              { id: uid("ref"), name: "", borrow: "", avoid: "" },
            ],
          }))
        }
      >
        <Plus size={14} aria-hidden /> Add reference
      </Button>
    </>
  );
}

// ---------- 11. Acceptance criteria ----------

const VAGUE =
  /\b(amazing|intuitive|beautiful|modern|clean|sleek|nice|user[- ]friendly|stunning|delightful|seamless|awesome|great|pops?|easy to use|looks good)\b/i;

export function lintCriterion(text: string): string | null {
  const m = text.match(VAGUE);
  return m
    ? `“${m[0]}” is hard to verify. Describe something observable, e.g. “The primary action is visible without scrolling.”`
    : null;
}

export function AcceptanceSection() {
  const { config, update } = useEditor();
  const derived = deriveCriteria(config);
  const setOverride = (
    id: string,
    patch: { enabled?: boolean; text?: string },
  ) =>
    update((c) => {
      const prev = c.criteria.overrides[id] ?? { enabled: true };
      return {
        ...c,
        criteria: {
          ...c.criteria,
          overrides: { ...c.criteria.overrides, [id]: { ...prev, ...patch } },
        },
      };
    });
  return (
    <>
      <div className="space-y-2">
        <SubHeading hint="Generated from your selections. Uncheck to leave one out, or edit the wording.">
          From your selections
        </SubHeading>
        {derived.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-[13px] text-faint">
            Choose options such as a primary action, states, or preserve items
            and criteria will appear here.
          </p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-panel">
            {derived.map((c) => {
              const o = config.criteria.overrides[c.id];
              const enabled = o?.enabled !== false;
              return (
                <li key={c.id} className="flex items-center gap-3 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={enabled}
                    aria-label={`Include criterion: ${o?.text ?? c.text}`}
                    onChange={(e) =>
                      setOverride(c.id, { enabled: e.target.checked })
                    }
                    className="size-4 shrink-0 accent-[var(--accent)]"
                  />
                  <label className="sr-only" htmlFor={`crit-${c.id}`}>
                    Criterion wording
                  </label>
                  <Input
                    id={`crit-${c.id}`}
                    value={o?.text ?? c.text}
                    disabled={!enabled}
                    onChange={(e) =>
                      setOverride(c.id, { text: e.target.value })
                    }
                    className={cx(
                      "h-8 border-transparent bg-transparent text-[13px] hover:border-line",
                      !enabled && "line-through",
                    )}
                  />
                  {o?.text !== undefined && o.text !== c.text && (
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="Restore original wording"
                      onClick={() =>
                        update((x) => ({
                          ...x,
                          criteria: {
                            ...x.criteria,
                            overrides: {
                              ...x.criteria.overrides,
                              [c.id]: { enabled },
                            },
                          },
                        }))
                      }
                    >
                      <RotateCcw size={13} aria-hidden />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="space-y-2">
        <SubHeading hint="Write criteria someone could check by looking at the result.">
          Your criteria
        </SubHeading>
        <TextList
          label="Custom criterion"
          addLabel="New criterion"
          items={config.criteria.custom}
          placeholder="e.g. The table remains usable at 360px wide"
          lint={lintCriterion}
          onChange={(items) =>
            update((c) => ({
              ...c,
              criteria: { ...c.criteria, custom: items },
            }))
          }
        />
      </div>
    </>
  );
}

// ---------- router ----------

export function SectionBody({ id }: { id: SectionId }) {
  switch (id) {
    case "context":
      return <ContextSection />;
    case "typography":
      return <TypographySection />;
    case "color":
      return <ColorSection />;
    case "avoid":
      return <AvoidSection />;
    case "preserve":
      return <PreserveSection />;
    case "references":
      return <ReferencesSection />;
    case "acceptance":
      return <AcceptanceSection />;
    default:
      return <Groups section={id} />;
  }
}

export const HAS_CUSTOM: SectionId[] = [
  "context",
  "visual",
  "layout",
  "typography",
  "color",
  "interaction",
  "states",
  "preserve",
];
