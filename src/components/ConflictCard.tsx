"use client";

import { AlertTriangle } from "lucide-react";
import type { Conflict } from "@/lib/conflicts";
import { joinList } from "@/lib/generate";
import { getOption } from "@/lib/options";
import { useEditor } from "./editor-context";
import { Button } from "./ui";

export function excludedSummary(
  conflict: Conflict,
  pairName: (id: string) => string,
): string {
  const parts = [
    ...conflict.optionIds.map((id) => getOption(id)?.label ?? id),
    ...conflict.pairIds.map((id) => `“Avoid ${pairName(id)}”`),
    ...conflict.terms.map((t) => `“${t.term}” in the preserve lists`),
  ];
  return joinList(parts);
}

export function ConflictCard({ conflict }: { conflict: Conflict }) {
  const { resolve, config } = useEditor();
  const pairName = (id: string) =>
    config.avoidPairs.find((p) => p.id === id)?.avoid ?? id;
  return (
    <div
      role="group"
      aria-label={`Conflict: ${conflict.title}`}
      className="space-y-2.5 rounded-lg border border-warn-line bg-warn-soft p-3"
    >
      <div className="flex gap-2">
        <AlertTriangle
          size={16}
          className="mt-0.5 shrink-0 text-warn"
          aria-hidden
        />
        <div className="space-y-1">
          <p className="text-[13px] font-semibold text-fg">
            <span className="sr-only">Conflict: </span>
            {conflict.title}
          </p>
          <p className="text-[13px] leading-snug text-muted">
            {conflict.message}
          </p>
          <p className="text-xs text-muted">
            <span className="font-medium text-fg">
              Left out of copy and export until resolved:
            </span>{" "}
            {excludedSummary(conflict, pairName)}.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 pl-6">
        {conflict.resolutions.map((r) => (
          <Button key={r.label} size="sm" onClick={() => resolve(r)}>
            {r.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
