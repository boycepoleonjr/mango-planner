import { describe, expect, it } from "vitest";
import { createDefaultConfig, setEdit, toggleOption } from "./config";
import {
  FINAL_INSTRUCTION,
  generatePrompt,
  generateRevision,
  revisionParagraph,
} from "./generate";
import { getOption, OPTIONS } from "./options";
import type { Config } from "./types";

function select(config: Config, ...ids: string[]): Config {
  return ids.reduce((c, id) => {
    const r = toggleOption(c, id);
    if (!r.ok) throw new Error(r.reason);
    return r.config;
  }, config);
}

function blank(): Config {
  return { ...createDefaultConfig(), selected: [] };
}

describe("generatePrompt", () => {
  it("is deterministic regardless of selection order", () => {
    const a = select(
      blank(),
      "aesthetic.minimalist",
      "layout.grid",
      "ux.progressive",
    );
    const b = select(
      blank(),
      "ux.progressive",
      "layout.grid",
      "aesthetic.minimalist",
    );
    expect(generatePrompt(a).text).toBe(generatePrompt(b).text);
    expect(generatePrompt(a).text).toBe(
      generatePrompt(structuredClone(a)).text,
    );
  });

  it("translates selections into instructions, not labels", () => {
    const c = select(blank(), "ux.progressive");
    const text = generatePrompt(c).text;
    expect(text).toContain(
      "Show essential controls first and place advanced settings in an expandable section.",
    );
    expect(text).not.toContain("Progressive disclosure");
  });

  it("gives every option except Custom a non-empty instruction that reaches the prompt", () => {
    for (const option of OPTIONS) {
      if (option.id === "interface.custom") continue;
      expect(option.instruction.length, option.id).toBeGreaterThan(10);
      const r = toggleOption(blank(), option.id);
      expect(r.ok).toBe(true);
      if (!r.ok) continue;
      const text = generatePrompt(r.config).text;
      const firstWords = option.instruction.split(" ").slice(0, 4).join(" ");
      expect(text, option.id).toContain(firstWords);
    }
  });

  it("builds the task sentence from interface, kind, and platform", () => {
    const c = select(
      blank(),
      "interface.dashboard",
      "kind.revision",
      "platform.responsive-web",
    );
    expect(generatePrompt(c).text).toContain(
      "- Revise the existing dashboard for responsive web.",
    );
  });

  it("uses the custom interface description when Custom is chosen", () => {
    let c = select(blank(), "interface.custom", "kind.new");
    c = {
      ...c,
      context: { ...c.context, customInterfaceType: "kiosk check-in screen" },
    };
    expect(generatePrompt(c).text).toContain(
      "Design a new kiosk check-in screen.",
    );
  });

  it("appends qualifiers and honors edited instructions", () => {
    let c = select(blank(), "density.compact", "aesthetic.premium");
    c = setEdit(c, "density.compact", { qualifier: "in data tables" });
    c = setEdit(c, "aesthetic.premium", {
      instruction: "Use a serif for headlines",
    });
    const text = generatePrompt(c).text;
    expect(text).toMatch(/below usable size \(in data tables\)\./);
    expect(text).toContain("- Use a serif for headlines.");
    expect(text).not.toContain(getOption("aesthetic.premium")!.instruction);
  });

  it("ends with the required final instruction", () => {
    const c = select(blank(), "layout.grid");
    expect(generatePrompt(c).text.trim().endsWith(FINAL_INSTRUCTION)).toBe(
      true,
    );
  });

  it("never invents fonts, colors, or references when fields are blank", () => {
    const c = select(blank(), "type.heading-hierarchy", "palette.neutral");
    const text = generatePrompt(c).text;
    expect(text).not.toMatch(
      /for headings\.|for body text\.|accent color\.|REFERENCES/,
    );
  });

  it("includes user-typed details verbatim", () => {
    const c = blank();
    c.details.headingFont = "Söhne";
    c.details.accentColor = "#F2A33A";
    const text = generatePrompt(c).text;
    expect(text).toContain("Use Söhne for headings.");
    expect(text).toContain("Use #F2A33A as the accent color.");
  });

  it("formats avoid pairs, including scoped ones", () => {
    const c = blank();
    c.avoidPairs = c.avoidPairs.map((p) =>
      p.id === "cards"
        ? { ...p, enabled: true }
        : p.id === "whitespace"
          ? { ...p, enabled: true, scope: "data tables" }
          : p,
    );
    const text = generatePrompt(c).text;
    expect(text).toContain(
      "Avoid overusing cards; use rows for comparable records and cards for independent summaries instead.",
    );
    expect(text).toContain("In data tables, avoid excessive whitespace; use");
  });

  it("notes that references were not fetched", () => {
    const c = blank();
    c.references = [
      {
        id: "r",
        name: "linear.app",
        borrow: "keyboard-first command menu",
        avoid: "",
      },
    ];
    const text = generatePrompt(c).text;
    expect(text).toContain("have not been fetched or analyzed");
    expect(text).toContain(
      "- linear.app\n  - Borrow: keyboard-first command menu.",
    );
  });

  it("produces a concise variant with the same content in compact form", () => {
    const c = select(blank(), "layout.grid", "state.loading", "state.empty");
    const concise = generatePrompt({ ...c, outputLength: "concise" }).text;
    expect(concise).not.toContain("## ");
    expect(concise).toContain("**Layout and hierarchy:** Align content");
    expect(concise).toContain(
      "Specify these states for each interactive component: Loading: show progress",
    );
    expect(concise.trim().endsWith(FINAL_INSTRUCTION)).toBe(true);
  });
});

describe("empty-section omission", () => {
  it("returns an empty prompt when nothing is configured", () => {
    const result = generatePrompt(blank());
    expect(result.isEmpty).toBe(true);
    expect(result.text).toBe("");
  });

  it("only emits headings that have content", () => {
    const c = select(blank(), "ux.retry");
    const { sections, text } = generatePrompt(c);
    expect(sections.map((s) => s.heading)).toEqual([
      "INTERACTION REQUIREMENTS",
      "ACCEPTANCE CRITERIA",
    ]);
    expect(text).not.toContain("## TASK");
    expect(text).not.toContain("## VISUAL DIRECTION");
  });

  it("omits whitespace-only fields", () => {
    const c = blank();
    c.context.targetUser = "   ";
    c.preserve.components = "\n \n";
    expect(generatePrompt(c).isEmpty).toBe(true);
  });

  it("drops criteria the user disabled", () => {
    let c = select(blank(), "ux.retry");
    c = {
      ...c,
      criteria: {
        overrides: { "opt:ux.retry": { enabled: false } },
        custom: [],
      },
    };
    expect(generatePrompt(c).sections.map((s) => s.heading)).toEqual([
      "INTERACTION REQUIREMENTS",
    ]);
  });
});

describe("deduplication", () => {
  it("removes a custom instruction that repeats an option instruction", () => {
    let c = select(blank(), "ux.progressive");
    c = {
      ...c,
      custom: {
        interaction: [
          "show essential controls first and place advanced settings in an expandable section",
        ],
      },
    };
    const text = generatePrompt(c).text;
    expect(text.match(/essential controls first/gi)).toHaveLength(1);
  });

  it("removes duplicates across sections and repeated custom entries", () => {
    const c = blank();
    c.custom = {
      visual: ["Use a 12-column grid.", "use a 12 column grid"],
      layout: ["Use a 12-column grid"],
    };
    expect(generatePrompt(c).text.match(/12.column grid/gi)).toHaveLength(1);
  });

  it("does not repeat a custom criterion that matches a derived one", () => {
    let c = select(blank(), "ux.retry");
    c = {
      ...c,
      criteria: {
        overrides: {},
        custom: ["Every recoverable failure offers a retry action"],
      },
    };
    expect(generatePrompt(c).text.match(/offers a retry action/g)).toHaveLength(
      1,
    );
  });
});

describe("acceptance criteria", () => {
  it("derives verifiable criteria from selections and preserve fields", () => {
    let c = select(
      blank(),
      "type.dominant-primary",
      "state.loading",
      "state.empty",
      "state.error",
    );
    c = { ...c, preserve: { ...c.preserve, functionality: "CSV export" } };
    const text = generatePrompt(c).text;
    expect(text).toContain(
      "The primary action is clearly distinguishable from secondary actions.",
    );
    expect(text).toContain("Loading, empty, and error states are specified.");
    expect(text).toContain(
      "Existing functionality listed under “Preserve” remains unchanged.",
    );
  });

  it("applies edited criterion text", () => {
    let c = select(blank(), "ux.retry");
    c = {
      ...c,
      criteria: {
        overrides: {
          "opt:ux.retry": { enabled: true, text: "Failed saves offer Retry" },
        },
        custom: [],
      },
    };
    expect(generatePrompt(c).text).toContain("- Failed saves offer Retry.");
  });
});

describe("targeted revision mode", () => {
  it("uses the scoped feedback format", () => {
    const text = revisionParagraph({
      id: "1",
      element: "filter bar",
      problem: "too many competing controls",
      change: "collapse secondary filters into a “More filters” menu",
      preserve: "the search field and saved views",
    });
    expect(text).toBe(
      "The filter bar has too many competing controls. Change collapse secondary filters into a “More filters” menu. Preserve the search field and saved views. Do not redesign unrelated areas.",
    );
  });

  it("tidies redundant leading words", () => {
    const text = revisionParagraph({
      id: "1",
      element: "The header",
      problem: "Has weak contrast.",
      change: "Change the title color to the primary text color.",
      preserve: "",
    });
    expect(text).toBe(
      "The header has weak contrast. Change the title color to the primary text color. Do not redesign unrelated areas.",
    );
  });

  it("is empty until a field is filled, and numbers multiple items", () => {
    const c = blank();
    expect(generateRevision(c).isEmpty).toBe(true);
    c.revision = [
      {
        id: "a",
        element: "nav",
        problem: "low contrast",
        change: "",
        preserve: "",
      },
      {
        id: "b",
        element: "table",
        problem: "cramped rows",
        change: "",
        preserve: "",
      },
    ];
    const { text } = generateRevision(c);
    expect(text).toContain("1. The nav has low contrast.");
    expect(text).toContain("2. The table has cramped rows.");
    expect(text.trim().endsWith(FINAL_INSTRUCTION)).toBe(true);
  });
});
