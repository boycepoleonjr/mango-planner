# Dependency security audit (2026-11-13)

Owner: Aside, in the owning chat. Base: `main` at `3e2bce3`. Branch: `fix/dependency-security-audit`.

## Goal

Remove the remaining high-severity dependency exposure with the smallest safe change, and report audit results truthfully.

## Evidence (observed 2026-11-13, Node 22, pnpm 10.33.0)

Scope A, the repo lockfile (`pnpm audit`, `pnpm audit --prod`):

- Full audit: 1 moderate, 0 high, exit 1. The finding is `minimatch@10.2.6` via `eslint` (GHSA-g3hv-75wg-m249, patched `>=11.0.1`). The `eslint` 10 parent range still uses minimatch 10.x.
- `pnpm audit --audit-level high`: exit 0.
- `pnpm audit --prod`: 0 findings, exit 0.
- The lockfile has `wrangler@4.158.0` and `undici@7.30.1` (Dependabot #21). `braces@3.0.3` is still locked but no longer flagged, so the old "braces" note in `AGENTS.md` is stale.

Scope B, the Wrangler CLI that `deploy.yml` actually runs. It passes `wranglerVersion: "4.149.0"` to `cloudflare/wrangler-action@v4`, independent of `package.json`. I resolved each version in an empty temporary directory with `pnpm add wrangler@<v>` and audited it:

| Deploy CLI                      | undici | High | Moderate | `--audit-level high` exit |
| ------------------------------- | ------ | ---- | -------- | ------------------------- |
| 4.149.0 (current `deploy.yml`)  | 7.29.1 | 4    | 4        | 1                         |
| 4.158.0 (manifest and lockfile) | 7.30.1 | 0    | 0        | 0                         |

The lockfile audit is green while the production deploy runs a CLI with 4 high advisories. That is the exposure.

## Non-goals

- No change to `package.json` or `pnpm-lock.yaml` unless a fresh audit proves it is required. It is not.
- No `overrides` or `resolutions`. No incompatible major bumps. No downgrade to 4.153.0.
- No change to action refs, Node versions, triggers, environments, permissions, secrets, review policy or runtime features.
- No deploy, no production `workflow_dispatch`, no merge.

## Approach

1. `deploy.yml`: change only `wranglerVersion` from `"4.149.0"` to `"4.158.0"`, matching the manifest.
2. `src/lib/deploy-config.test.ts`: a dependency-free Vitest test asserting that `deploy.yml`'s `wranglerVersion` equals the exact `wrangler` version in `package.json`, and that the lockfile resolves that same version. This stops the two drifting again.
3. `AGENTS.md`: replace only the stale known-issue note with the dated observed result and the remaining moderate finding.
4. `docs/handoffs/2026-11-13-dependency-security-audit.md`: evidence, remaining work, resume and rollback.

## Parked finding

The moderate minimatch advisory (GHSA-g3hv-75wg-m249) is parked with Aside, with the evidence above. It sits in the dev-only lint toolchain, not in the deployed CLI or in `--prod`. Revisit when `eslint` or `@eslint/config-array` ships a release that accepts minimatch `>=11.0.1`, or when the advisory changes. Do not override it, and do not force an incompatible major.

## Acceptance criteria

- `deploy.yml` differs from `main` by the one `wranglerVersion` line.
- Audit of the resolved deploy CLI: 0 high.
- `pnpm audit --audit-level high` and `pnpm audit --prod` exit 0. The full audit reports exactly the one moderate, with its real exit code.
- Frozen install, format:check, lint, typecheck, test and build pass.
- `pnpm exec wrangler --version` prints 4.158.0.
- A secret-free `wrangler deploy --dry-run` or local serve of `out/` is run, or marked NOT RUN with the reason.
- Prompt and preset persistence smoke is run, or marked NOT RUN.

## Test plan

Run the commands from `AGENTS.md` and record each real exit code (no `|| true`). Audit both scopes. Verify the new test fails against `4.149.0` and passes against `4.158.0`.

## Risks

Low. This changes only the Wrangler CLI version in the deploy workflow, to the version already locked and tested locally. Wrangler 4.149.0 to 4.158.0 is a minor and patch step within 4.x. Residual risk: the first real deploy on 4.158.0 happens only after a separately approved merge.

## Rollback

After a separately approved merge: revert the focused PR through the normal gates, or do a separately approved Cloudflare version rollback.
