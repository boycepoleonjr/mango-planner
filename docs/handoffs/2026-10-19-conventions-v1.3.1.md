# Handoff: adopt conventions v1.3.1

- Synced from conventions v1.3.0 to v1.3.1 with `scripts/sync.mjs` (no conflicts, no `--force`, nothing skipped).
- Removed the conventions-related ignores from `.prettierignore`; the v1.3.1 templates are Prettier-clean.
- Added a blank line after `## Project` and `## Repo rules` in `AGENTS.md` (repo-owned text, whitespace only) so `pnpm format:check` passes.
- Known issue unchanged: `pnpm audit --audit-level high` exits 1 (`braces`, GHSA-vfj7-8cjw-p6xm), same on `main`.
