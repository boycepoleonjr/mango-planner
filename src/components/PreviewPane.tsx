"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Copy,
  Download,
  Lightbulb,
} from "lucide-react";
import {
  copyText,
  downloadMarkdown,
  selectContents,
  slugify,
} from "@/lib/browser";
import { hasUserChanges } from "@/lib/config";
import { generatePrompt, generateRevision, suggestions } from "@/lib/generate";
import type { OutputLength } from "@/lib/types";
import { ConflictCard } from "./ConflictCard";
import { useEditor } from "./editor-context";
import { Button, cx, Segmented } from "./ui";

function PromptText({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => {
        const cls = line.startsWith("# ")
          ? "text-fg font-semibold"
          : line.startsWith("## ")
            ? "text-accent-ink font-semibold"
            : line.startsWith("**")
              ? "text-fg"
              : "text-fg/90";
        return (
          <span key={i} className={cx("block min-h-[1.6em]", cls)}>
            {line}
          </span>
        );
      })}
    </>
  );
}

export function PreviewPane({
  onBrowsePresets,
}: {
  onBrowsePresets: () => void;
}) {
  const { config, update, conflicts, notify, goToSection } = useEditor();
  const [copied, setCopied] = useState(false);
  const textRef = useRef<HTMLPreElement>(null);
  const isBrief = config.mode === "brief";

  const brief = useMemo(() => generatePrompt(config), [config]);
  const revision = useMemo(() => generateRevision(config), [config]);
  const hints = useMemo(() => suggestions(config), [config]);
  const { text, isEmpty } = isBrief ? brief : revision;

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  async function onCopy() {
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      notify(
        isBrief
          ? "Prompt copied to clipboard"
          : "Revision prompt copied to clipboard",
      );
    } else {
      if (textRef.current) selectContents(textRef.current);
      notify(
        "Couldn’t copy automatically. The text is selected — press Ctrl+C or ⌘C.",
        "error",
      );
    }
  }

  function onExport() {
    const base = slugify(
      config.context.projectName || (isBrief ? "design-brief" : "revision"),
    );
    const filename = `${base}${isBrief ? "" : "-revision"}.md`;
    downloadMarkdown(filename, text);
    notify(`Exported ${filename}`);
  }

  const words = text ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="flex min-h-full flex-col">
      <div className="z-10 space-y-3 border-b border-line bg-panel px-4 py-3 sm:px-5 sticky top-[95px] lg:top-0">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[13px] font-semibold">
            {isBrief ? "Generated prompt" : "Revision prompt"}
            {!isEmpty && (
              <span className="ml-2 font-mono text-[11px] font-normal text-faint tabular-nums">
                {words} words
              </span>
            )}
          </h2>
          {isBrief && (
            <Segmented<OutputLength>
              label="Output length"
              value={config.outputLength}
              onChange={(v) => update((c) => ({ ...c, outputLength: v }))}
              options={[
                { value: "concise", label: "Concise" },
                { value: "detailed", label: "Detailed" },
              ]}
            />
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={onCopy}
            disabled={isEmpty}
            className="flex-1"
          >
            {copied ? (
              <Check size={15} aria-hidden />
            ) : (
              <Copy size={15} aria-hidden />
            )}
            {copied ? "Copied" : "Copy prompt"}
          </Button>
          <Button onClick={onExport} disabled={isEmpty} className="flex-1">
            <Download size={15} aria-hidden /> Export .md
          </Button>
        </div>
        {isBrief && conflicts.length > 0 && (
          <p className="flex items-start gap-1.5 text-xs text-warn">
            <AlertTriangle size={13} className="mt-px shrink-0" aria-hidden />
            {conflicts.length} conflict{conflicts.length === 1 ? "" : "s"}: the
            instructions involved are left out of copy and export until you
            choose.
          </p>
        )}
      </div>

      <div className="flex-1 space-y-4 px-4 py-4 sm:px-5">
        {isBrief && conflicts.length > 0 && (
          <div className="space-y-2">
            {conflicts.map((c) => (
              <ConflictCard key={c.id} conflict={c} />
            ))}
          </div>
        )}

        {isBrief && !isEmpty && !hasUserChanges(config) && (
          <div className="space-y-2.5 rounded-lg border border-line bg-raised px-3.5 py-3">
            <p className="text-[13px] text-fg">
              Only the default accessibility requirements are set so far.
            </p>
            <p className="text-xs text-muted">
              Describe what you&rsquo;re designing, or start from a preset.
              Everything you choose becomes a concrete instruction here.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => goToSection("context")}>
                Start with project context
              </Button>
              <Button size="sm" variant="ghost" onClick={onBrowsePresets}>
                Browse presets
              </Button>
            </div>
          </div>
        )}

        {isEmpty ? (
          <div className="space-y-3 rounded-lg border border-dashed border-line-strong px-4 py-8 text-center">
            <p className="text-sm font-medium">Nothing to copy yet</p>
            {isBrief ? (
              <>
                <p className="mx-auto max-w-xs text-[13px] text-muted">
                  Describe what you&rsquo;re designing in Project context, pick
                  a few options, or start from a preset. The brief builds here
                  as you go.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button size="sm" onClick={() => goToSection("context")}>
                    Start with project context
                  </Button>
                  <Button size="sm" variant="ghost" onClick={onBrowsePresets}>
                    Browse presets
                  </Button>
                </div>
              </>
            ) : (
              <p className="mx-auto max-w-xs text-[13px] text-muted">
                Fill in at least the element and the problem you observed. The
                scoped instruction appears here.
              </p>
            )}
          </div>
        ) : (
          <pre
            ref={textRef}
            tabIndex={0}
            aria-label={
              isBrief ? "Generated prompt text" : "Revision prompt text"
            }
            className="overflow-x-hidden rounded-lg border border-line bg-bg px-3.5 py-3 font-mono text-[12px] leading-[1.6] break-words whitespace-pre-wrap"
          >
            <PromptText text={text} />
          </pre>
        )}

        {isBrief && hints.length > 0 && (
          <details className="group rounded-lg border border-line">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-[13px] text-muted hover:text-fg [&::-webkit-details-marker]:hidden">
              <Lightbulb size={14} aria-hidden />
              Optional improvements ({hints.length})
              <ChevronRight
                size={14}
                aria-hidden
                className="ml-auto transition-transform duration-100 group-open:rotate-90"
              />
            </summary>
            <ul className="space-y-1 border-t border-line px-2 py-2">
              {hints.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => goToSection(h.section)}
                    className="w-full rounded-md px-2 py-1.5 text-left text-[13px] text-muted hover:bg-hover hover:text-fg"
                  >
                    {h.text}
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}
