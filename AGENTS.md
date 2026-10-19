<!-- conventions:begin agents-core -->

## Shared rules (conventions v1.3.1)

- Read this file, the README, `package.json` or equivalent, and `.github/workflows/` before changing code. Use the repo's real commands.
- One branch per task (`<type>/<slug>`), Conventional Commits, minimal diffs: no refactors or unrelated edits in a fix PR.
- Open a draft PR after the first commit. Mark it ready for review only when every command below passes and CI is green; AI reviews trigger on ready. Never merge.
- PR description follows `.github/pull_request_template.md`: what, why, every command run with its real pass/fail, risk, and decisions needed.
- Bug fixes add regression tests for every path of the fix (empty, invalid, valid input, and any guard you add), not just the reported repro. See `.claude/skills/fix-with-regression-tests`.
- Dependency changes are declared openly in the manifest. Never hide a version change in `overrides` or `resolutions` while the manifest claims a different range. See `.claude/skills/dependency-update`.
- Non-trivial work gets a plan in `docs/specs/` first. End each session with a handoff in `docs/handoffs/YYYY-MM-DD-<topic>.md`.
- Never commit secrets, real customer data or `.env` files. Use synthetic data in tests and fixtures.
- Standard: https://github.com/boycepoleonjr/conventions/blob/v1.3.1/STANDARD.md

<!-- conventions:end agents-core -->

<!-- conventions:begin agents-review -->

## Review guidelines

For AI reviewers (Codex, Claude, Cursor) and people. Report real defects with a concrete failing scenario. Skip style nits that lint already covers.

Treat as P1 (blocking):

- Secrets, API or write keys, tokens or credentials in source, config or client bundles, even if they look like placeholders.
- User-controlled input (query params, form fields, headers) reaching HTML (`dangerouslySetInnerHTML`, `innerHTML`), SQL, shell commands, redirects or file paths without escaping or validation.
- Personal data (names, emails, phone numbers, addresses, IDs) written to logs, `console.*`, analytics events or error reporters.
- A request or promise with no error handling, where failure shows a success message, leaves the UI stuck or causes an unhandled rejection.
- Validation that an alternate path skips (a second submit button, an API route, a shortcut).
- Version changes hidden in `overrides` or `resolutions`, or any other break of the shared rules above.

Also check:

- Off-by-one errors in indexes, ranges, modulo wraparound and pagination.
- Stale closures in React effects, intervals and handlers; missing cleanup.
- Bug fixes without a regression test for each path of the fix.
- Non-trivial features without a plan in `docs/specs/`.

Do not flag behavior-preserving refactors (renames, function style, reordering).

<!-- conventions:end agents-review -->

## Project

Mango Planner is a client-side UI/UX prompt picker: people choose design preferences in plain language and it generates a deterministic, actionable brief for LLM design and coding agents. Configuration and presets live in the browser's localStorage; there is no backend.

- Stack: Next.js 16 (static export, `output: "export"`), React 19, TypeScript, Tailwind CSS 4, Vitest, ESLint, Prettier; pnpm.
- Hosting and deploy: Cloudflare Workers static assets (`wrangler.jsonc`, serves `out/`). `.github/workflows/deploy.yml` deploys on every push to `main` after format, lint, typecheck, test and build pass.
- Default branch and protection: `main`. Branch protection is configured on GitHub, not in this repo.

<!-- conventions:begin agents-commands -->

## Commands

Run all of these before marking a PR ready, and report each with pass/fail:

- install: `pnpm install --frozen-lockfile`
- lint: `pnpm lint`
- typecheck: `pnpm typecheck`
- test: `pnpm test`
- build: `pnpm build`
- audit: `pnpm audit --audit-level high`
- format: `pnpm format:check`

<!-- conventions:end agents-commands -->

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Repo rules

Repo-specific rules and known issues go here. They override the shared rules where they conflict.

- Known issue: `pnpm audit --audit-level high` exits 1 on `main` (1 high: `braces <=3.0.3` via `eslint-config-next > @next/eslint-plugin-next > fast-glob > micromatch`, GHSA-vfj7-8cjw-p6xm, no patched version). Dev-only dependency; not caused by any PR. Report it, don't hide it in `overrides`.
