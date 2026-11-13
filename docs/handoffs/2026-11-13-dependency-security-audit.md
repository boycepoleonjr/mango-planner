# Handoff: dependency security audit (2026-11-13)

Owner: Aside, in the owning chat. Not shipped: nothing is merged or deployed.

Branch `fix/dependency-security-audit`, based on `main` at `3e2bce3`. Plan: `docs/specs/2026-11-13-dependency-security-audit.md`.

## State

Branch-only draft PR into `main`. Merge and the production auto-deploy that follows are NOT authorized. Review status is tracked on the PR for the exact head, not here.

## What changed

| File                              | Change                                                                                                                           |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/deploy.yml`    | `wranglerVersion` `"4.149.0"` to `"4.158.0"`, matching `package.json`. One line.                                                 |
| `src/lib/deploy-config.test.ts`   | New dependency-free test: `deploy.yml` `wranglerVersion` equals the exact `wrangler` in `package.json`, which is locked.         |
| `AGENTS.md`                       | Replaced the stale "braces" known issue with the dated audit result and the remaining moderate. Added the deploy-CLI audit rule. |
| `docs/specs/…`, `docs/handoffs/…` | Plan and this note.                                                                                                              |

`package.json` and `pnpm-lock.yaml` are unchanged. There are no `overrides` or `resolutions`, and no dependency changes.

## Evidence (Node v22.23.4, pnpm 10.33.0, 2026-11-13)

Each command ran separately with its real exit code.

| Command                                      | Result                              |
| -------------------------------------------- | ----------------------------------- |
| `pnpm install --frozen-lockfile`             | PASS (0)                            |
| `pnpm format:check`                          | PASS (0)                            |
| `pnpm lint`                                  | PASS (0)                            |
| `pnpm typecheck`                             | PASS (0)                            |
| `pnpm test`                                  | PASS (0): 5 files, 67 tests         |
| `pnpm build`                                 | PASS (0)                            |
| `pnpm audit --audit-level high`              | PASS (0)                            |
| `pnpm audit --prod`                          | PASS (0): no findings               |
| `pnpm audit` (full)                          | FAIL (1): 1 moderate, see below     |
| `pnpm exec wrangler --version`               | 4.158.0                             |
| `wrangler deploy --dry-run` (no credentials) | PASS (0): read 43 files from `out/` |
| Local serve of `out/` plus browser smoke     | PASS on 1280x800 and 390x844        |

The new test failed before the `deploy.yml` edit (expected `4.158.0`, got `4.149.0`) and passes after it.

The smoke served `out/` with a throwaway static server. On both viewports it typed a project name, reloaded and saw it restored, saved a preset, reloaded and saw it kept in `localStorage`, and saw no page errors. Prompt generation is covered only by the unit tests, not the smoke.

### Deploy CLI audit (separate from the lockfile)

I resolved each Wrangler version in an empty temporary directory with `pnpm add wrangler@<v>` and ran `pnpm audit` there. This assumes the action installs the requested exact version and resolves its dependencies fresh; I did not read the action's install code.

| Deploy CLI                    | undici | Findings           | `--audit-level high` exit |
| ----------------------------- | ------ | ------------------ | ------------------------- |
| 4.149.0 (before, from `main`) | 7.29.1 | 4 high, 4 moderate | 1                         |
| 4.158.0 (after)               | 7.30.1 | none               | 0                         |

The 4 high advisories on 4.149.0 were GHSA-xjj6-f33q-929c, GHSA-4w7w-5xrc-9h26, GHSA-2m5v-pch6-74hx and GHSA-qrxm-fqhp-jwvm. All are patched in undici `>=7.30.1`.

### Remaining advisory (parked)

`GHSA-g3hv-75wg-m249` (moderate): `minimatch@10.2.6` via `eslint`, patched in `>=11.0.1`. It is dev-only and absent from `--prod` and the deploy CLI. The `eslint` 10 parent range still resolves minimatch 10.x, so a fix needs an incompatible override, which I did not apply.

Revisit when `eslint` or `@eslint/config-array` accepts minimatch `>=11.0.1`, or when the advisory changes. Run `pnpm audit` then and drop the `AGENTS.md` note if it is clean.

## Remaining work

- Boyce decides whether to merge. A merge triggers the production deploy workflow on `main`.
- After a separately approved merge, watch the first deploy run on Wrangler 4.158.0.
- Confirm a complete review receipt for the final head SHA before treating review as done. Repeat after every push.

## Safe resume

```bash
git fetch origin
git checkout fix/dependency-security-audit
pnpm install --frozen-lockfile
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm audit --audit-level high; echo "exit=$?"
```

## Rollback

Nothing is deployed from this branch. After a separately approved merge, revert the focused PR through the normal gates, or do a separately approved Cloudflare version rollback.
