# 2026-10-25: Sync mango-planner to conventions 1.4.0

## State

Draft PR on branch `chore/sync-conventions-1.4.0`, waiting on CI.

## What changed

Ran `sync.mjs --only agents-md,claude-md,pr-template,dependabot --force` from conventions `main` (v1.4.0, boycepoleonjr/conventions#6).

- `AGENTS.md`: version line and Standard link now say 1.4.0.
- `.github/pull_request_template.md`: version header only.
- `.github/dependabot.yml`: now matches the template. The only differences were the version header and the wording of the checkout comment. The `actions/checkout` major ignore is unchanged.
- `.conventions.lock.json`: 1.3.1 to 1.4.0, with new hashes for the four files above.

## Not synced on purpose

`claude-code-review.yml` and `conventions-check.yml` still report "edited by hand". Dependabot bumped `claude-code-action` to v1.0.259 (#11, #16) and `setup-node` to v7.1.0 (#12), which is ahead of the templates (v1.0.253 and v4.4.0). A forced sync would silently downgrade them. Leaving them out keeps the weekly drift check flagging them.

## Open decisions

1. Move those Dependabot bumps into the conventions templates, or exclude the two workflows from Dependabot, so the drift check goes quiet?
2. The conventions repo has no `v1.4.0` tag yet (tags are pushed separately); the sync ran from `main`. The drift check clones the tag named in the lock file, so it will fail until `v1.4.0` is pushed.

## Resume

`git checkout chore/sync-conventions-1.4.0`, run the commands in AGENTS.md. Do not merge.
