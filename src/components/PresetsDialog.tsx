"use client";

import { useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { BUILT_IN_PRESETS } from "@/lib/presets";
import type { Preset } from "@/lib/types";
import { Button, Dialog, Input } from "./ui";

export function PresetsDialog({
  open,
  onClose,
  userPresets,
  onLoad,
  onSave,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  userPresets: Preset[];
  onLoad: (preset: Preset) => void;
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const trimmed = name.trim();
  const existing = userPresets.find(
    (p) => p.name.toLowerCase() === trimmed.toLowerCase(),
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Presets"
      description="Start from a coherent direction, or save your own. Loading copies the preset — every choice stays editable."
      width="max-w-xl"
    >
      <div className="space-y-6">
        <form
          className="space-y-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!trimmed) return;
            onSave(trimmed);
            setName("");
          }}
        >
          <label
            htmlFor="preset-name"
            className="block text-[13px] font-medium"
          >
            Save current configuration
          </label>
          <div className="flex gap-2">
            <Input
              id="preset-name"
              value={name}
              placeholder="Preset name"
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
            />
            <Button type="submit" variant="primary" disabled={!trimmed}>
              <Save size={14} aria-hidden /> {existing ? "Replace" : "Save"}
            </Button>
          </div>
          {existing && (
            <p className="text-xs text-muted">
              A preset named &ldquo;{existing.name}&rdquo; exists. Saving
              replaces it.
            </p>
          )}
        </form>

        <section aria-labelledby="your-presets" className="space-y-2">
          <h3 id="your-presets" className="text-[13px] font-semibold">
            Your presets
          </h3>
          {userPresets.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line px-4 py-4 text-center text-[13px] text-faint">
              Saved presets appear here. They&rsquo;re stored in this browser
              only.
            </p>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
              {userPresets.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center gap-2 px-3 py-2"
                >
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                    {p.name}
                  </span>
                  {confirmDelete === p.id ? (
                    <span className="flex items-center gap-1.5">
                      <span className="text-xs text-muted">
                        Delete permanently?
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmDelete(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          onDelete(p.id);
                          setConfirmDelete(null);
                        }}
                      >
                        Delete
                      </Button>
                    </span>
                  ) : (
                    <>
                      <Button size="sm" onClick={() => onLoad(p)}>
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Delete preset ${p.name}`}
                        onClick={() => setConfirmDelete(p.id)}
                      >
                        <Trash2 size={13} aria-hidden />
                      </Button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="starter-presets" className="space-y-2">
          <h3 id="starter-presets" className="text-[13px] font-semibold">
            Starter presets
          </h3>
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
            {BUILT_IN_PRESETS.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium">{p.name}</p>
                  <p className="text-xs text-muted">{p.description}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => onLoad(p)}
                  aria-label={`Load ${p.name}`}
                >
                  Load
                </Button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Dialog>
  );
}
