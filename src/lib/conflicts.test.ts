import { describe, expect, it } from "vitest";
import { createDefaultConfig, setEdit, toggleOption } from "./config";
import { applyResolution, detectConflicts, removeTerm } from "./conflicts";
import { generatePrompt } from "./generate";
import { getOption } from "./options";
import type { Config } from "./types";

function select(config: Config, ...ids: string[]): Config {
  return ids.reduce((c, id) => {
    const r = toggleOption(c, id);
    if (!r.ok) throw new Error(r.reason);
    return r.config;
  }, config);
}

const blank = (): Config => ({ ...createDefaultConfig(), selected: [] });

function enablePair(c: Config, id: string, scope = ""): Config {
  return {
    ...c,
    avoidPairs: c.avoidPairs.map((p) =>
      p.id === id ? { ...p, enabled: true, scope } : p,
    ),
  };
}

describe("detectConflicts", () => {
  it("flags compact and spacious density applied everywhere", () => {
    const c = select(blank(), "density.compact", "density.spacious");
    const conflicts = detectConflicts(c);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].id).toBe("group:density");
    expect(conflicts[0].optionIds).toEqual([
      "density.compact",
      "density.spacious",
    ]);
  });

  it("treats a scoped density as a valid combination", () => {
    let c = select(blank(), "density.compact", "density.spacious");
    c = setEdit(c, "density.compact", { qualifier: "in data tables" });
    expect(detectConflicts(c)).toEqual([]);
  });

  it("flags angular with strongly rounded shapes", () => {
    const c = select(blank(), "shape.angular", "shape.strong");
    expect(detectConflicts(c).map((x) => x.id)).toEqual(["group:radius"]);
  });

  it("flags expressive motion against minimal motion and the avoid-animation rule", () => {
    let c = select(blank(), "motion.expressive", "motion.minimal");
    c = enablePair(c, "animation");
    const ids = detectConflicts(c).map((x) => x.id);
    expect(ids).toContain("group:motion");
    expect(ids).toContain("pair:motion.expressive|animation");
  });

  it("does not flag expressive motion with reduced-motion support", () => {
    const c = select(blank(), "motion.expressive", "a11y.reduced-motion");
    expect(detectConflicts(c)).toEqual([]);
  });

  it("does not flag creative combinations", () => {
    const c = select(
      blank(),
      "aesthetic.futuristic",
      "aesthetic.minimalist",
      "palette.muted",
      "palette.high-contrast-accent",
      "shape.angular",
      "shape.pill",
      "layout.cards",
      "layout.table-first",
    );
    expect(detectConflicts(enablePair(c, "cards"))).toEqual([]);
  });

  it("flags spacious density against the avoid-whitespace rule unless one is scoped", () => {
    const c = enablePair(select(blank(), "density.spacious"), "whitespace");
    expect(detectConflicts(c).map((x) => x.id)).toEqual([
      "pair:density.spacious|whitespace",
    ]);
    expect(detectConflicts(enablePair(c, "whitespace", "data tables"))).toEqual(
      [],
    );
  });

  it("flags flat surfaces with a layered model", () => {
    const c = select(blank(), "surface.flat", "surface.layered");
    expect(detectConflicts(c)).toHaveLength(1);
  });

  it("flags an area marked both changeable and preserved", () => {
    const c = blank();
    c.preserve.mayChange = "Header, footer";
    c.preserve.components = "the header\nDate picker";
    const conflicts = detectConflicts(c);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].terms[0]).toEqual({
      term: "Header",
      fields: ["mayChange", "components"],
    });
  });
});

describe("conflicting instructions are excluded from output", () => {
  it("omits both sides of an unresolved conflict and keeps the rest", () => {
    const c = select(
      blank(),
      "density.compact",
      "density.spacious",
      "layout.grid",
    );
    const text = generatePrompt(c).text;
    expect(text).not.toContain(
      getOption("density.compact")!.instruction.slice(0, 30),
    );
    expect(text).not.toContain(
      getOption("density.spacious")!.instruction.slice(0, 30),
    );
    expect(text).toContain(getOption("layout.grid")!.instruction);
  });

  it("omits a disputed preserve term but keeps other terms", () => {
    const c = blank();
    c.preserve.mayChange = "header, sidebar";
    c.preserve.mustNotChange = "header";
    const text = generatePrompt(c).text;
    expect(text).toContain("You may change: sidebar.");
    expect(text).not.toMatch(/header/i);
  });
});

describe("applyResolution", () => {
  it("keeps one option of a conflict group", () => {
    const c = select(blank(), "density.compact", "density.spacious");
    const [conflict] = detectConflicts(c);
    const keep = conflict.resolutions.find(
      (r) => r.type === "keepOnly" && r.keep === "density.spacious",
    )!;
    const next = applyResolution(c, keep);
    expect(next.selected).toEqual(["density.spacious"]);
    expect(detectConflicts(next)).toEqual([]);
  });

  it("disables the avoid rule", () => {
    const c = enablePair(select(blank(), "density.spacious"), "whitespace");
    const [conflict] = detectConflicts(c);
    const next = applyResolution(
      c,
      conflict.resolutions.find((r) => r.type === "disablePair")!,
    );
    expect(next.avoidPairs.find((p) => p.id === "whitespace")!.enabled).toBe(
      false,
    );
    expect(detectConflicts(next)).toEqual([]);
  });

  it("removes a preserve term from the chosen fields", () => {
    const c = blank();
    c.preserve.mayChange = "Header, footer";
    c.preserve.mustNotChange = "header";
    const [conflict] = detectConflicts(c);
    const protect = conflict.resolutions.find(
      (r) => r.label === "Keep it protected",
    )!;
    const next = applyResolution(c, protect);
    expect(next.preserve.mayChange).toBe("footer");
    expect(next.preserve.mustNotChange).toBe("header");
    expect(detectConflicts(next)).toEqual([]);
  });
});

describe("removeTerm", () => {
  it("keeps line structure and other entries", () => {
    expect(removeTerm("a, The Header; b\nheader\nc", "header")).toBe("a, b\nc");
  });
});
