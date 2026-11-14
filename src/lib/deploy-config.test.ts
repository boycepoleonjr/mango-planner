import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// The wranglerVersion input in deploy.yml is separate from package.json.
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
  const deployVersions = [
    ...read(".github/workflows/deploy.yml").matchAll(
      /^\s*wranglerVersion:\s*"?([^"\s#]+)"?/gm,
    ),
  ].map((match) => match[1]);

  it("declares an exact wrangler version in package.json", () => {
    expect(declared).toMatch(EXACT_VERSION);
  });

  it("sets wranglerVersion exactly once in deploy.yml", () => {
    expect(deployVersions).toHaveLength(1);
  });

  it("deploys with the same Wrangler version that package.json declares", () => {
    expect(deployVersions[0]).toBe(declared);
  });

  it("locks the declared Wrangler version in pnpm-lock.yaml", () => {
    expect(read("pnpm-lock.yaml")).toContain(`\n  wrangler@${declared}:`);
  });
});
