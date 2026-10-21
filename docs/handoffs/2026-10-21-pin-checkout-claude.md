# 2026-10-21: Pin checkout in the Claude workflow

## State
Done and pushed as a draft PR; waiting on CI. Branch: `claude/eloquent-mayer-ix53er` (see decision 1).

## What changed
- `.github/workflows/claude.yml`: `actions/checkout@v7` is now `actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4.4.0`, with the same "Held at checkout v4.4.0 on purpose" comment as `claude-code-review.yml`.
- `.github/workflows/claude.yml`: `anthropics/claude-code-action@v1` is now `@5eb090f3c3afd701a0672cd32981197ca27688f6 # v1.0.253`, the SHA `claude-code-review.yml` uses.
- `.github/dependabot.yml`: the `github-actions` ecosystem ignores `actions/checkout` for `version-update:semver-major`. Nothing else changed.

## Checks (local)
format, lint, typecheck, test and build pass. `pnpm audit --audit-level high` exits 1 on the known `braces` issue in AGENTS.md; this PR did not cause it. No version bump: `package.json` is untouched, and the task has no app change.

## Open decisions
1. The task named `ci/pin-checkout-claude`, but this session is limited to pushing `claude/eloquent-mayer-ix53er`. Rename or recreate the branch if you want the other name.
2. `claude.yml` still has `pnpm/action-setup@v6` and `actions/setup-node@v7` on moving tags. They were out of scope. Pin them in a follow-up if you want.
3. `dependabot.yml` and the workflows are marked "Synced from conventions v1.3.1". The weekly conventions-check will report drift until the same change lands in the conventions repo.

## Resume
`git checkout claude/eloquent-mayer-ix53er`, then run the commands in AGENTS.md. After CI is green, mark the PR ready. Do not merge.
