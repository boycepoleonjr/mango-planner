# Sync conventions v1.4.0 to v1.7.0

Date: 2026-11-09. Branch: `chore/conventions-v1-7-0`. Base: `main` at `83b3b95`.

## State

- Ran `sync.mjs` from the exact `v1.7.0` tag. `--check` now reports 0 to write, 0 conflicts. Lock is `1.7.0`.
- Updated: `AGENTS.md` (managed blocks only), PR template, `dependabot.yml`, `dependency-update` skill, `claude-code-review.yml`, `conventions-check.yml`, lock.
- Created: `.claude/settings.json`, `.github/workflows/deploy-secrets-lint.yml`.
- `--force` was used only on `claude-code-review.yml` and `conventions-check.yml`. Both differed from the lock hash only by v1.3.1 template text and the old "held at checkout v4.4.0" comment; the sync kept the repo's action SHAs and `node-version`. `persist-credentials: false` is now set on checkouts in managed workflows.
- Dependabot no longer ignores `actions/checkout` major bumps (v1.7.0 template drops the hold). Intended; not re-added.
- No `skip` entries existed, so none changed. App code, `deploy.yml`, Cloudflare config, secrets and settings are untouched.
- Open PRs at start: dependabot #20 (actions) and #21 (npm). The `chore/sync-conventions-1.4.0` branch exists on the remote but main already carries the 1.4.0 lock; no conventions PR was open.

## Checks (local)

install, lint, typecheck, test, build, format:check: exit 0. `deploy-secrets-lint` script: exit 0 (`deploy.yml` reads `CLOUDFLARE_*` inside `environment: production`).

`pnpm audit --audit-level high`: exit 1 before and after, output identical (9 vulnerabilities: 5 moderate, 4 high). Today the highs are `undici` (<7.30.1) via `.>wrangler>miniflare>undici`; no `braces` finding appears, so the AGENTS.md "Known issue" text is stale. Not hidden or relaxed.

## Left

- Wait for CI green, then mark the PR ready. Do not merge.
- Decide on the audit (see PR "Needs Boyce's decision").

## Resume

```bash
git checkout chore/conventions-v1-7-0
node <conventions-v1.7.0>/scripts/sync.mjs --repo . --check
```
