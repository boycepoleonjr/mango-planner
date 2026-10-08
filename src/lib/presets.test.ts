import { describe, expect, it } from "vitest";
import { createDefaultConfig, hasUserChanges, toggleOption } from "./config";
import { detectConflicts } from "./conflicts";
import { generatePrompt } from "./generate";
import { getOption } from "./options";
import { applyPreset, BUILT_IN_PRESETS } from "./presets";
import { sanitizeConfig } from "./storage";

describe("built-in presets", () => {
  it("includes the six starter presets", () => {
    expect(BUILT_IN_PRESETS.map((p) => p.name)).toEqual([
      "Precision dashboard",
      "Editorial website",
      "Minimal SaaS workspace",
      "Playful onboarding",
      "Mobile-first commerce",
      "Dark system interface",
    ]);
  });

  it.each(BUILT_IN_PRESETS)(
    "$name references only real options and is conflict-free",
    (preset) => {
      for (const id of preset.config.selected)
        expect(getOption(id), id).toBeDefined();
      expect(sanitizeConfig(preset.config)).toEqual(preset.config);
      expect(detectConflicts(preset.config)).toEqual([]);
      const result = generatePrompt(preset.config);
      expect(result.isEmpty).toBe(false);
      expect(result.text).toContain("## VISUAL DIRECTION");
    },
  );

  it("does not invent user goals or branding", () => {
    for (const p of BUILT_IN_PRESETS) {
      expect(p.config.context.targetUser).toBe("");
      expect(p.config.context.primaryGoal).toBe("");
      expect(p.config.details.accentColor).toBe("");
      expect(p.config.references).toEqual([]);
    }
  });
});

describe("applyPreset", () => {
  it("loads selections and keeps the user's output length", () => {
    const current = {
      ...createDefaultConfig(),
      outputLength: "concise" as const,
    };
    const loaded = applyPreset(BUILT_IN_PRESETS[0], current);
    expect(loaded.selected).toEqual(BUILT_IN_PRESETS[0].config.selected);
    expect(loaded.outputLength).toBe("concise");
    expect(loaded.mode).toBe("brief");
  });

  it("returns an editable copy that does not mutate the preset", () => {
    const preset = BUILT_IN_PRESETS[0];
    const before = JSON.stringify(preset.config);
    const loaded = applyPreset(preset);
    const r = toggleOption(loaded, "aesthetic.precision");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.config.selected).not.toContain("aesthetic.precision");
    loaded.context.projectName = "Edited";
    loaded.edits["density.compact"]!.qualifier = "changed";
    expect(JSON.stringify(preset.config)).toBe(before);
  });

  it("counts as a change worth confirming before replacement", () => {
    expect(hasUserChanges(createDefaultConfig())).toBe(false);
    expect(hasUserChanges(applyPreset(BUILT_IN_PRESETS[1]))).toBe(true);
  });
});
