import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));

test("audit-assets.mjs outputs structured asset inventory JSON", async () => {
  const { stdout } = await execFileAsync(process.execPath, [
    path.join(root, "scripts/audit-assets.mjs"),
    "--json",
  ]);
  const report = JSON.parse(stdout);
  assert.ok(report.summary.totalFiles > 500);
  assert.ok(report.summary.totalBytes > 100_000_000);
  assert.equal(report.manifests.cloudflareR2.bucket, "loc-digital-assets");
  assert.equal(report.manifests.cloudflareR2.publicBaseUrl, "https://assets.loc.digital");
});

test("optimize-assets.mjs supports --dry-run and real bounded staging without touching originals", async () => {
  const dry = await execFileAsync(process.execPath, [
    path.join(root, "scripts/optimize-assets.mjs"),
    "--dry-run",
    "--scope=images",
    "--filter=about-photographer",
  ]);
  const dryReport = JSON.parse(dry.stdout);
  assert.equal(dryReport.dryRun, true);
  assert.equal(dryReport.candidates, 1);

  const tmpOut = await mkdtemp(path.join(os.tmpdir(), "loc-r2-opt-"));
  try {
    const run = await execFileAsync(process.execPath, [
      path.join(root, "scripts/optimize-assets.mjs"),
      "--scope=images",
      "--filter=about-photographer",
      `--out=${tmpOut}`,
    ]);
    const runReport = JSON.parse(run.stdout);
    assert.equal(runReport.processed, 1);
    assert.ok(runReport.totalOutputBytes < runReport.totalInputBytes);

    const manifest = JSON.parse(
      await readFile(path.join(tmpOut, "optimization-manifest.json"), "utf8"),
    );
    const entry = manifest.assets["/images/about-photographer.png"];
    assert.ok(entry);
    assert.ok(entry.blurDataURL.startsWith("data:image/webp;base64,"));
    assert.ok(entry.thumbnail.key.endsWith(".webp"));
    assert.ok(entry.variants.some((v) => v.width === 480));
    assert.ok(entry.variants.some((v) => v.width === 768));

    // Re-running should be idempotent (0 processed, 1 skipped)
    const secondRun = await execFileAsync(process.execPath, [
      path.join(root, "scripts/optimize-assets.mjs"),
      "--scope=images",
      "--filter=about-photographer",
      `--out=${tmpOut}`,
    ]);
    const secondReport = JSON.parse(secondRun.stdout);
    assert.equal(secondReport.processed, 0);
    assert.equal(secondReport.skipped, 1);

    // Dry-run R2 migration against the staged directory requires no credentials
    const mig = await execFileAsync(process.execPath, [
      path.join(root, "scripts/migrate-assets-to-r2.mjs"),
      "--dry-run",
      `--staging=${tmpOut}`,
    ]);
    const migReport = JSON.parse(mig.stdout);
    assert.equal(migReport.dryRun, true);
    assert.equal(migReport.stagedAssets, 1);
    assert.equal(migReport.pendingAssets + migReport.alreadyMigrated, 1);
    if (migReport.pendingAssets > 0) {
      assert.ok(migReport.pendingObjects >= 4);
    }
  } finally {
    await rm(tmpOut, { recursive: true, force: true });
  }
});
