"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, ChevronDown } from "lucide-react";
import { clearGroup, instructionOf, setEdit, toggleOption } from "@/lib/config";
import type { PickerGroup, PickerOption } from "@/lib/types";
import { useEditor } from "./editor-context";
import { Button, cx, Input, TextArea } from "./ui";

export function OptionGroup({
  group,
  options,
  context,
}: {
  group: PickerGroup;
  /** Subset to show (search results); defaults to all options in the group. */
  options?: PickerOption[];
  /** Extra label shown above the group, e.g. the section name in search results. */
  context?: string;
}) {
  const { config, update, conflicts } = useEditor();
  const [limitMsg, setLimitMsg] = useState("");
  const headingId = useId();
  const shown = options ?? group.options;
  const selectedCount = config.selected.filter((id) =>
    group.options.some((o) => o.id === id),
  ).length;
  const conflicted = useMemo(
    () => new Set(conflicts.flatMap((c) => c.optionIds)),
    [conflicts],
  );

  function toggle(id: string) {
    const result = toggleOption(config, id);
    if (!result.ok) {
      setLimitMsg(result.reason);
      return;
    }
    setLimitMsg("");
    update(() => result.config);
  }

  const rule =
    group.selectionType === "single"
      ? "Pick one"
      : group.maxSelections
        ? `Up to ${group.maxSelections}`
        : "Pick any";

  return (
    <section aria-labelledby={headingId} className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          {context && (
            <p className="text-[11px] font-medium tracking-wide text-faint uppercase">
              {context}
            </p>
          )}
          <h3 id={headingId} className="text-[13px] font-semibold text-fg">
            {group.label}
            <span className="ml-2 font-normal text-faint">
              {rule}
              {selectedCount > 0 && ` · ${selectedCount} selected`}
            </span>
          </h3>
          {group.hint && !context && (
            <p className="text-xs text-muted">{group.hint}</p>
          )}
        </div>
        {selectedCount > 0 && !context && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setLimitMsg("");
              update((c) => clearGroup(c, group.id));
            }}
            aria-label={`Clear ${group.label} selection`}
          >
            Clear
          </Button>
        )}
      </div>
      <p
        role="status"
        aria-live="polite"
        className={cx("text-xs text-warn", !limitMsg && "sr-only")}
      >
        {limitMsg}
      </p>
      <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-panel">
        {shown.map((option) => (
          <OptionRow
            key={option.id}
            option={option}
            single={group.selectionType === "single"}
            selected={config.selected.includes(option.id)}
            conflicted={conflicted.has(option.id)}
            onToggle={() => toggle(option.id)}
            instruction={instructionOf(config, option.id)}
            edited={config.edits[option.id]?.instruction !== undefined}
            qualifier={config.edits[option.id]?.qualifier ?? ""}
          />
        ))}
      </ul>
    </section>
  );
}

function OptionRow({
  option,
  single,
  selected,
  conflicted,
  onToggle,
  instruction,
  edited,
  qualifier,
}: {
  option: PickerOption;
  single: boolean;
  selected: boolean;
  conflicted: boolean;
  onToggle: () => void;
  instruction: string;
  edited: boolean;
  qualifier: string;
}) {
  const { update, focusRequest, clearFocusRequest } = useEditor();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const qualifierRef = useRef<HTMLInputElement>(null);
  const rowRef = useRef<HTMLLIElement>(null);
  const baseId = useId();
  const isCustom = option.id === "interface.custom";

  useEffect(() => {
    if (
      focusRequest?.kind === "qualifier" &&
      focusRequest.optionId === option.id
    ) {
      rowRef.current?.scrollIntoView({ block: "center" });
      qualifierRef.current?.focus();
      clearFocusRequest();
    }
  }, [focusRequest, option.id, clearFocusRequest]);

  const showDetails = (selected || expanded) && !isCustom;

  return (
    <li
      ref={rowRef}
      className={cx(
        "relative transition-colors duration-100",
        selected && "bg-accent-soft shadow-[inset_2px_0_0_var(--accent)]",
        conflicted && "bg-warn-soft shadow-[inset_2px_0_0_var(--warn)]",
      )}
    >
      <div className="flex items-start gap-2 pr-2">
        <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 py-2.5 pl-3">
          <input
            type={single ? "radio" : "checkbox"}
            name={single ? option.group : undefined}
            checked={selected}
            onChange={() => {
              if (!single || !selected) onToggle();
            }}
            onClick={() => {
              if (single && selected) onToggle();
            }}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className={cx(
              "mt-0.5 flex size-4 shrink-0 items-center justify-center border transition-colors duration-100 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent",
              single ? "rounded-full" : "rounded-[4px]",
              selected
                ? "border-accent bg-accent text-accent-fg"
                : "border-line-strong bg-raised",
            )}
          >
            {selected &&
              (single ? (
                <span className="size-1.5 rounded-full bg-accent-fg" />
              ) : (
                <Check size={12} strokeWidth={3} />
              ))}
          </span>
          <span className="min-w-0 space-y-0.5">
            <span className="flex flex-wrap items-center gap-x-2 text-sm font-medium text-fg">
              {option.label}
              {conflicted && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-warn">
                  <AlertTriangle size={12} aria-hidden /> Conflict
                </span>
              )}
              {edited && selected && (
                <span className="text-[11px] font-normal text-accent-ink">
                  Edited
                </span>
              )}
            </span>
            <span className="block text-[13px] leading-snug text-muted">
              {option.description}
            </span>
          </span>
        </label>
        {!selected && !isCustom && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls={`${baseId}-details`}
            className="mt-2 inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-faint hover:bg-hover hover:text-fg"
          >
            <span className="sr-only">{option.label}: </span>
            {expanded ? "Hide" : "Adds"}
            <ChevronDown
              size={12}
              aria-hidden
              className={cx(
                "transition-transform duration-100",
                expanded && "rotate-180",
              )}
            />
          </button>
        )}
      </div>
      {showDetails && (
        <div id={`${baseId}-details`} className="space-y-3 pr-3 pb-3 pl-10">
          <div className="space-y-1">
            <p className="text-[11px] font-medium tracking-wide text-faint uppercase">
              Adds to prompt
            </p>
            {editing ? (
              <div className="space-y-2">
                <label htmlFor={`${baseId}-instr`} className="sr-only">
                  Instruction for {option.label}
                </label>
                <TextArea
                  id={`${baseId}-instr`}
                  autoFocus
                  value={instruction}
                  rows={3}
                  onChange={(e) =>
                    update((c) =>
                      setEdit(c, option.id, { instruction: e.target.value }),
                    )
                  }
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setEditing(false)}>
                    Done
                  </Button>
                  {edited && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        update((c) =>
                          setEdit(c, option.id, { instruction: undefined }),
                        );
                        setEditing(false);
                      }}
                    >
                      Restore default
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <p
                className={cx(
                  "text-[13px] leading-relaxed",
                  selected ? "text-fg" : "text-muted",
                )}
              >
                {instruction || (
                  <span className="text-faint italic">
                    Empty — nothing will be added.
                  </span>
                )}
              </p>
            )}
          </div>
          {selected && !editing && (
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[12rem] flex-1 space-y-1">
                <label
                  htmlFor={`${baseId}-q`}
                  className="block text-xs text-muted"
                >
                  Qualifier{" "}
                  <span className="text-faint">(optional scope or nuance)</span>
                </label>
                <Input
                  id={`${baseId}-q`}
                  ref={qualifierRef}
                  value={qualifier}
                  placeholder={
                    option.qualifierHint ?? "e.g. on the settings page"
                  }
                  onChange={(e) =>
                    update((c) =>
                      setEdit(c, option.id, { qualifier: e.target.value }),
                    )
                  }
                  className="h-8 text-[13px]"
                />
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditing(true)}
              >
                Edit wording
              </Button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
