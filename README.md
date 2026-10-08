# Mango Planner

A UI/UX prompt picker. Choose design preferences in plain language, and Mango Planner turns them
into a coherent, actionable brief for LLM-based design and coding agents.

It covers what you're designing, who it's for, how it should look and behave, what to avoid,
what must not change, and how to judge the result. Every option contributes a concrete
instruction, never just a buzzword.

## Features

- **Picker-driven editor with a live preview.** On desktop you get section navigation, an editor
  and the prompt preview side by side. On mobile there's a single column with a Configure/Preview
  switch that keeps your place in each view.
- **Explained options.** Each option has a plain-language label, a short explanation, the exact
  instruction it adds, an editable wording, and an optional qualifier that scopes it (for
  example "Compact density — in data tables").
- **Eleven brief sections:** project context, visual direction, layout and density,
  typography, color/surfaces/shape, UX and interaction, states/accessibility/responsiveness,
  avoid-and-replace pairs, preserve and scope, references, and acceptance criteria. Each
  section also takes custom instructions.
- **Targeted revision mode** for focused critique: "The [element] has [problem]. Change […].
  Preserve […]. Do not redesign unrelated areas."
- **Conflict detection** using explicit rules (compact + spacious density, angular + strongly
  rounded corners, expressive + minimal motion, an area listed as both changeable and
  protected, and a few more). Scoping either side with a qualifier resolves the conflict, so
  creative combinations like "futuristic + minimalist" are never flagged. Unresolved conflicting
  instructions are left out of copy and export, and the UI explains why.
- **Concise or detailed output**, generated deterministically: the same configuration always
  produces the same text. Duplicates are removed, empty sections are omitted, and nothing is
  invented (no fonts, colors, goals or references you didn't enter).
- **Copy** (with a fallback for when the clipboard API is unavailable), **Markdown export**,
  **reset** with confirmation, and **presets**: six editable starter presets plus your own
  saved presets.
- **Local persistence.** Your configuration and presets are kept in `localStorage`. Corrupt or
  outdated stored data is repaired or discarded without breaking the app.
- Dark theme by default, with a light theme.

## Running it

Requires Node 20+ and pnpm.

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Other scripts:

```bash
pnpm test         # vitest unit tests
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
pnpm build        # static export to out/
pnpm preview      # serve out/ locally
```

`pnpm build` produces a fully static site in `out/` that you can host on any static host
(Cloudflare Pages, GitHub Pages, Netlify, and so on). There is no backend.

## Project structure

```
src/lib/
  types.ts       Typed option, configuration, and preset definitions
  options.ts     Option data: labels, explanations, instructions, conflict groups
  config.ts      Default configuration and pure update helpers
  generate.ts    Deterministic prompt generation (brief + targeted revision)
  conflicts.ts   Conflict rules, resolutions, and output exclusions
  presets.ts     Starter presets
  storage.ts     localStorage persistence with validation and recovery
  browser.ts     Clipboard and file-download helpers
src/components/  Presentation components (editor, picker rows, preview, dialogs)
```

The library modules have no React dependency. Tests live next to them (`*.test.ts`) and cover
prompt generation, empty-section omission, deduplication, conflict detection and resolution,
preset loading, and persistence recovery.

## Limitations

- Everything is stored in this browser's `localStorage`. There's no sync between devices, and
  clearing site data removes your presets.
- Conflict detection is rule-based and deliberately narrow. It catches the contradictions it
  knows about, not every possible tension between free-text instructions.
- Preserve-list conflicts match exact items, ignoring case and a leading "the". "Header" and
  "site header" are treated as different items.
- Accessibility selections describe intent. Including them in a prompt doesn't guarantee that
  the result is accessible or compliant, so test the output.
- Reference URLs are never fetched. The agent gets only the notes you write.
