"use client";

import { useMemo } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Search, X } from "lucide-react";
import { deriveCriteria } from "@/lib/generate";
import { GROUPS, groupsForSection } from "@/lib/options";
import { sectionLabel, type SectionMeta } from "@/lib/sections";
import type { Config, SectionId } from "@/lib/types";
import { ConflictCard } from "./ConflictCard";
import { useEditor } from "./editor-context";
import { OptionGroup } from "./OptionGroup";
import { CustomInstructions, HAS_CUSTOM, SectionBody } from "./sections";
import { Button, cx, Input } from "./ui";

const filled = (...values: string[]) => values.filter((v) => v.trim()).length;

export function sectionCount(config: Config, id: SectionId): number {
  const groupIds = new Set(groupsForSection(id).map((g) => g.id));
  let n = config.selected.filter((s) => groupIds.has(s.split(".")[0])).length;
  n += config.custom[id]?.length ?? 0;
  const c = config.context;
  const d = config.details;
  switch (id) {
    case "context":
      n += filled(
        c.projectName,
        c.targetUser,
        c.primaryGoal,
        c.primaryAction,
        c.constraints,
      );
      break;
    case "typography":
      n += filled(d.headingFont, d.bodyFont, d.typographyNotes);
      break;
    case "color":
      n += filled(d.accentColor, d.brandColors, d.radius);
      break;
    case "avoid":
      n += config.avoidPairs.filter((p) => p.enabled).length;
      break;
    case "preserve":
      n += filled(...Object.values(config.preserve));
      break;
    case "references":
      n += config.references.filter((r) => r.name.trim()).length;
      break;
    case "acceptance":
      n +=
        deriveCriteria(config).filter(
          (x) => config.criteria.overrides[x.id]?.enabled !== false,
        ).length + config.criteria.custom.length;
      break;
  }
  return n;
}

export function SectionNav({
  sections,
  active,
  onSelect,
}: {
  sections: SectionMeta[];
  active: SectionId;
  onSelect: (id: SectionId) => void;
}) {
  const { config, conflicts } = useEditor();
  const isRevision = config.selected.includes("kind.revision");
  return (
    <nav aria-label="Prompt sections" className="px-2 py-4">
      <p className="px-2 pb-2 text-[11px] font-medium tracking-wide text-faint uppercase">
        Sections
      </p>
      <ol className="space-y-px">
        {sections.map((s) => {
          const count = sectionCount(config, s.id);
          const conflicted = conflicts.some((c) => c.sections.includes(s.id));
          const current = s.id === active;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                aria-current={current ? "true" : undefined}
                className={cx(
                  "flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-[13px] transition-colors duration-100",
                  current
                    ? "bg-raised font-medium text-fg shadow-[inset_0_0_0_1px_var(--line)]"
                    : "text-muted hover:bg-hover hover:text-fg",
                )}
              >
                <span
                  aria-hidden
                  className={cx(
                    "h-3.5 w-0.5 shrink-0 rounded-full",
                    current ? "bg-accent" : "bg-transparent",
                  )}
                />
                <span className="min-w-0 flex-1 truncate">{s.label}</span>
                {s.id === "preserve" && isRevision && (
                  <span className="rounded border border-accent-line px-1 text-[10px] text-accent-ink">
                    Revision
                  </span>
                )}
                {conflicted && (
                  <AlertTriangle
                    size={13}
                    className="shrink-0 text-warn"
                    aria-label="Has a conflict"
                  />
                )}
                {count > 0 && (
                  <span className="min-w-4 text-right font-mono text-[11px] text-faint tabular-nums">
                    <span className="sr-only">, </span>
                    {count}
                    <span className="sr-only"> set</span>
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function SectionSelect({
  sections,
  active,
  onSelect,
}: {
  sections: SectionMeta[];
  active: SectionId;
  onSelect: (id: SectionId) => void;
}) {
  const { config, conflicts } = useEditor();
  return (
    <div className="lg:hidden">
      <label htmlFor="section-select" className="mb-1 block text-xs text-muted">
        Section
      </label>
      <select
        id="section-select"
        value={active}
        onChange={(e) => onSelect(e.target.value as SectionId)}
        className="h-10 w-full rounded-md border border-line bg-raised px-2.5 text-sm text-fg"
      >
        {sections.map((s, i) => {
          const count = sectionCount(config, s.id);
          const conflict = conflicts.some((c) => c.sections.includes(s.id));
          return (
            <option key={s.id} value={s.id}>
              {i + 1}. {s.label}
              {count ? ` (${count})` : ""}
              {conflict ? " — conflict" : ""}
            </option>
          );
        })}
      </select>
    </div>
  );
}

function matches(q: string, ...fields: (string | undefined)[]) {
  return fields.some((f) => f?.toLowerCase().includes(q));
}

function SearchResults({ query }: { query: string }) {
  const q = query.trim().toLowerCase();
  const results = useMemo(
    () =>
      GROUPS.map((g) => ({
        group: g,
        options: g.options.filter(
          (o) =>
            matches(q, o.label, o.description, o.instruction, o.category) ||
            matches(q, sectionLabel(g.section)),
        ),
      })).filter((r) => r.options.length),
    [q],
  );
  if (!results.length) {
    return (
      <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-[13px] text-muted">
        No options match &ldquo;{query.trim()}&rdquo;. Try a plain word like
        &ldquo;spacing&rdquo;, &ldquo;error&rdquo;, or &ldquo;dark&rdquo; — or
        add a custom instruction in any section.
      </p>
    );
  }
  const count = results.reduce((n, r) => n + r.options.length, 0);
  return (
    <div className="space-y-6">
      <p role="status" className="text-[13px] text-muted">
        {count} matching option{count === 1 ? "" : "s"}
      </p>
      {results.map(({ group, options }) => (
        <OptionGroup
          key={group.id}
          group={group}
          options={options}
          context={sectionLabel(group.section)}
        />
      ))}
    </div>
  );
}

export function Workspace({
  sections,
  active,
  onSelect,
  query,
  onQueryChange: setQuery,
}: {
  sections: SectionMeta[];
  active: SectionId;
  onSelect: (id: SectionId) => void;
  /** Owned by the parent so any navigation can clear it. */
  query: string;
  onQueryChange: (q: string) => void;
}) {
  const { conflicts } = useEditor();
  const index = sections.findIndex((s) => s.id === active);
  const meta = sections[index] ?? sections[0];
  const prev = sections[index - 1];
  const next = sections[index + 1];
  const sectionConflicts = conflicts.filter((c) =>
    c.sections.includes(meta.id),
  );
  const searching = query.trim().length > 0;

  return (
    <div className="@container mx-auto w-full max-w-3xl space-y-6 px-4 py-5 sm:px-6 lg:py-6">
      <div className="space-y-3">
        <div className="relative">
          <Search
            size={15}
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-faint"
          />
          <label htmlFor="option-search" className="sr-only">
            Search all options
          </label>
          <Input
            id="option-search"
            type="search"
            value={query}
            placeholder="Search all options — e.g. spacing, errors, dark"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setQuery("");
            }}
            className="pr-9 pl-8"
          />
          {searching && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-1 text-faint hover:text-fg"
            >
              <X size={14} aria-hidden />
            </button>
          )}
        </div>
        {!searching && (
          <SectionSelect
            sections={sections}
            active={meta.id}
            onSelect={onSelect}
          />
        )}
      </div>

      {searching ? (
        <SearchResults query={query} />
      ) : (
        <>
          <header className="space-y-1">
            <p className="font-mono text-[11px] text-faint">
              {String(index + 1).padStart(2, "0")} /{" "}
              {String(sections.length).padStart(2, "0")}
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-fg">
              {meta.label}
            </h2>
            <p className="text-[13px] text-muted">{meta.summary}</p>
          </header>
          {sectionConflicts.length > 0 && (
            <div className="space-y-2">
              {sectionConflicts.map((c) => (
                <ConflictCard key={c.id} conflict={c} />
              ))}
            </div>
          )}
          <div className="space-y-7">
            <SectionBody id={meta.id} />
            {HAS_CUSTOM.includes(meta.id) && (
              <CustomInstructions section={meta.id} />
            )}
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-line pt-4">
            {prev ? (
              <Button variant="ghost" onClick={() => onSelect(prev.id)}>
                <ArrowLeft size={14} aria-hidden /> {prev.label}
              </Button>
            ) : (
              <span />
            )}
            {next && (
              <Button onClick={() => onSelect(next.id)}>
                {next.label} <ArrowRight size={14} aria-hidden />
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
