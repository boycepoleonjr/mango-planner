import { describe, expect, it } from "vitest";
import { createDefaultConfig } from "./config";
import { BUILT_IN_PRESETS } from "./presets";
import {
  CONFIG_KEY,
  loadConfig,
  loadUserPresets,
  PRESETS_KEY,
  saveConfig,
  saveUserPresets,
  sanitizeConfig,
  type KeyValueStore,
} from "./storage";

function memoryStore(
  initial: Record<string, string> = {},
): KeyValueStore & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}

describe("config persistence", () => {
  it("round-trips a configuration", () => {
    const store = memoryStore();
    const config = {
      ...BUILT_IN_PRESETS[2].config,
      context: { ...BUILT_IN_PRESETS[2].config.context, projectName: "Acme" },
    };
    expect(saveConfig(store, config)).toBe(true);
    const { value, recovered } = loadConfig(store);
    expect(recovered).toBe(false);
    expect(value).toEqual(config);
  });

  it("starts fresh without a warning when nothing is stored", () => {
    const { value, recovered } = loadConfig(memoryStore());
    expect(value).toEqual(createDefaultConfig());
    expect(recovered).toBe(false);
  });

  it("recovers from corrupt JSON", () => {
    const { value, recovered } = loadConfig(
      memoryStore({ [CONFIG_KEY]: "{not json" }),
    );
    expect(value).toEqual(createDefaultConfig());
    expect(recovered).toBe(true);
  });

  it("recovers from an unexpected shape or version", () => {
    expect(loadConfig(memoryStore({ [CONFIG_KEY]: "[1,2,3]" })).recovered).toBe(
      true,
    );
    expect(
      loadConfig(memoryStore({ [CONFIG_KEY]: JSON.stringify({ version: 99 }) }))
        .recovered,
    ).toBe(true);
  });

  it("survives a storage backend that throws", () => {
    const throwing: KeyValueStore = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("quota");
      },
    };
    expect(loadConfig(throwing).value).toEqual(createDefaultConfig());
    expect(saveConfig(throwing, createDefaultConfig())).toBe(false);
  });

  it("repairs partially invalid data instead of discarding it", () => {
    const config = sanitizeConfig({
      version: 1,
      mode: "nonsense",
      context: { projectName: "Kept", targetUser: 42 },
      selected: [
        "layout.grid",
        "not.real",
        "theme.light",
        "theme.dark",
        "layout.grid",
      ],
      edits: {
        "layout.grid": { qualifier: "on desktop" },
        "fake.id": { qualifier: "x" },
      },
      avoidPairs: [
        { id: "cards", enabled: true, avoid: "too many cards" },
        { id: "mine", avoid: "x", use: "y" },
      ],
      references: [{ name: "Ref" }, "junk"],
      revision: "bad",
    })!;
    expect(config.mode).toBe("brief");
    expect(config.context.projectName).toBe("Kept");
    expect(config.context.targetUser).toBe("");
    // unknown ids dropped, duplicates removed, single-select groups keep one
    expect(config.selected).toEqual(["layout.grid", "theme.light"]);
    expect(Object.keys(config.edits)).toEqual(["layout.grid"]);
    const cards = config.avoidPairs.find((p) => p.id === "cards")!;
    expect(cards).toMatchObject({
      enabled: true,
      avoid: "too many cards",
      builtIn: true,
    });
    expect(config.avoidPairs.filter((p) => p.builtIn)).toHaveLength(11);
    expect(config.avoidPairs.find((p) => p.id === "mine")).toMatchObject({
      builtIn: false,
      enabled: true,
    });
    expect(config.references).toHaveLength(1);
    expect(config.revision).toHaveLength(1);
  });

  it("enforces max selections from stored data", () => {
    const config = sanitizeConfig({
      version: 1,
      selected: [
        "aesthetic.minimalist",
        "aesthetic.premium",
        "aesthetic.warm",
        "aesthetic.playful",
      ],
    })!;
    expect(config.selected).toHaveLength(3);
  });
});

describe("user preset persistence", () => {
  it("round-trips presets", () => {
    const store = memoryStore();
    const preset = {
      id: "p1",
      name: "Mine",
      description: "",
      builtIn: false,
      config: createDefaultConfig(),
    };
    saveUserPresets(store, [preset]);
    expect(loadUserPresets(store)).toEqual({
      value: [preset],
      recovered: false,
    });
  });

  it("drops invalid entries and reports recovery", () => {
    const store = memoryStore({
      [PRESETS_KEY]: JSON.stringify([
        { id: "ok", name: "Good", config: createDefaultConfig() },
        { id: "bad", name: "No config" },
        { id: "unnamed", name: "  ", config: createDefaultConfig() },
      ]),
    });
    const { value, recovered } = loadUserPresets(store);
    expect(value.map((p) => p.name)).toEqual(["Good"]);
    expect(recovered).toBe(true);
  });

  it("recovers from corrupt preset storage", () => {
    expect(loadUserPresets(memoryStore({ [PRESETS_KEY]: "oops" }))).toEqual({
      value: [],
      recovered: true,
    });
  });
});
