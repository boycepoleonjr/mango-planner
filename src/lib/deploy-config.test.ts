import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// deploy.yml derives wranglerVersion from package.json in a workflow step, so
// the two cannot drift (Dependabot bumps no longer need a manual workflow edit).
// The input is separate from the lockfile install, though:
// cloudflare/wrangler-action reuses the lockfile CLI only when the input equals
// it; otherwise it runs `pnpm add wrangler@<input>` in the repo (see
// src/wranglerAction.ts L90-L176 at cloudflare/wrangler-action@953926a). If the
// two drift, `pnpm audit` can pass for the lockfile while production deploys
// with a different (possibly vulnerable) CLI.

function read(path: string): string {
  return readFileSync(
    fileURLToPath(new URL(`../../${path}`, import.meta.url)),
    "utf8",
  );
}

const EXACT_VERSION = /^\d+\.\d+\.\d+$/;

describe("deploy Wrangler version", () => {
  const manifest = JSON.parse(read("package.json")) as {
    devDependencies: Record<string, string>;
  };
  const declared = manifest.devDependencies.wrangler;
  const workflow = read(".github/workflows/deploy.yml");
  const deployVersions = [
    ...workflow.matchAll(/^\s*wranglerVersion:\s*"?([^"\n#]+?)"?\s*$/gm),
  ].map((match) => match[1]);

  it("declares an exact wrangler version in package.json", () => {
    expect(declared).toMatch(EXACT_VERSION);
  });

  it("sets wranglerVersion exactly once in deploy.yml", () => {
    expect(deployVersions).toHaveLength(1);
  });

  it("derives wranglerVersion from package.json, not a literal", () => {
    expect(deployVersions[0]).toBe("${{ steps.wrangler.outputs.version }}");
    expect(deployVersions[0]).not.toMatch(EXACT_VERSION);
  });

  it("reads the version step output from package.json devDependencies.wrangler", () => {
    expect(workflow).toMatch(/^\s*id:\s*wrangler\s*$/m);
    expect(workflow).toContain(
      'require("./package.json").devDependencies.wrangler',
    );
    expect(workflow).toContain('echo "version=$version" >> "$GITHUB_OUTPUT"');
  });

  it("reads the version before the deploy step", () => {
    expect(workflow.indexOf("id: wrangler")).toBeGreaterThan(-1);
    expect(workflow.indexOf("id: wrangler")).toBeLessThan(
      workflow.indexOf("id: deploy"),
    );
  });

  it("rejects non-exact versions in the workflow step", () => {
    expect(workflow).toContain("must be an exact version");
  });

  it("keeps persist-credentials: false on checkout", () => {
    expect(workflow).toMatch(/persist-credentials:\s*false/);
  });

  it("locks the declared Wrangler version in pnpm-lock.yaml", () => {
    expect(read("pnpm-lock.yaml")).toContain(`\n  wrangler@${declared}:`);
  });
});
