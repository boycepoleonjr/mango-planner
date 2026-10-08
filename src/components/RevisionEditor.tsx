"use client";

import { Plus, Trash2 } from "lucide-react";
import { uid } from "@/lib/config";
import type { RevisionItem } from "@/lib/types";
import { useEditor } from "./editor-context";
import { Button, Field } from "./ui";

export function RevisionEditor() {
  const { config, update } = useEditor();
  const set = (id: string, patch: Partial<RevisionItem>) =>
    update((c) => ({
      ...c,
      revision: c.revision.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-5 sm:px-6 lg:py-6">
      <header className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight">
          Targeted revision
        </h2>
        <p className="text-[13px] text-muted">
          Write focused feedback on one part of an existing design. Each issue
          becomes a scoped instruction that tells the agent what to change and
          what to leave alone.
        </p>
        <p className="rounded-md border border-line bg-panel px-3 py-2 font-mono text-xs leading-relaxed text-muted">
          The <span className="text-accent-ink">[element]</span> has{" "}
          <span className="text-accent-ink">[problem]</span>. Change{" "}
          <span className="text-accent-ink">[specific instruction]</span>.
          Preserve <span className="text-accent-ink">[protected elements]</span>
          . Do not redesign unrelated areas.
        </p>
      </header>

      <ol className="space-y-4">
        {config.revision.map((item, i) => (
          <li
            key={item.id}
            className="space-y-4 rounded-lg border border-line bg-panel p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-faint">Issue {i + 1}</p>
              {config.revision.length > 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    update((c) => ({
                      ...c,
                      revision: c.revision.filter((r) => r.id !== item.id),
                    }))
                  }
                >
                  <Trash2 size={13} aria-hidden /> Remove issue
                </Button>
              )}
            </div>
            <Field
              label="Element or area"
              value={item.element}
              placeholder="e.g. filter bar"
              onChange={(v) => set(item.id, { element: v })}
            />
            <Field
              label="Observed problem"
              hint="Describe what you see, not how you feel about it."
              value={item.problem}
              placeholder="e.g. too many controls competing at the same visual weight"
              onChange={(v) => set(item.id, { problem: v })}
            />
            <Field
              label="Requested change"
              multiline
              rows={2}
              value={item.change}
              placeholder="e.g. the secondary filters into a “More filters” menu, keeping search visible"
              onChange={(v) => set(item.id, { change: v })}
            />
            <Field
              label="What must remain unchanged"
              value={item.preserve}
              placeholder="e.g. the saved-views dropdown and URL filter parameters"
              onChange={(v) => set(item.id, { preserve: v })}
            />
          </li>
        ))}
      </ol>
      <Button
        onClick={() =>
          update((c) => ({
            ...c,
            revision: [
              ...c.revision,
              {
                id: uid("rev"),
                element: "",
                problem: "",
                change: "",
                preserve: "",
              },
            ],
          }))
        }
      >
        <Plus size={14} aria-hidden /> Add another issue
      </Button>
    </div>
  );
}
