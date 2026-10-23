# 2026-10-22: Pin pnpm/action-setup and setup-node in the Claude workflow

## State

Follow-up to boycepoleonjr/mango-planner#10. Draft PR on branch `ci/pin-setup-actions-claude`, waiting on CI.

## What changed

- `.github/workflows/claude.yml`: `pnpm/action-setup@v6` is now `@0977fd99725f1db4007ccb2928dbb4e90d06cc86 # v6.0.10`, the commit the moving `v6` tag resolved to on 2026-10-22, so behaviour is unchanged. `pnpm/action-setup` also has a `v6.1.0` tag (`ea17c68d…`) that the `v6` tag did not yet point to.
- `.github/workflows/claude.yml`: `actions/setup-node@v7` is now `@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0`, the same commit as the `v7` tag.

## Not changed

`ci.yml` still uses `pnpm/action-setup@v6`, `actions/setup-node@v7` and `actions/checkout@v7`. Pinning them was out of scope. The Claude workflows were the ask.

## Resume

`git checkout ci/pin-setup-actions-claude`, run the commands in AGENTS.md. Do not merge.
