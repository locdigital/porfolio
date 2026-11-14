import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, unlink, utimes, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { syncPhotoUpdates } from "./sync-photo-updates.mjs";

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "photo-updates-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await Promise.all(["src/content/photos", "public/assets/photos", "data"].map((dir) => mkdir(path.join(root, dir), { recursive: true })));
  for (const [slug, date] of [["older", "2025-01-01"], ["newer", "2025-02-01"]]) {
    await writeFile(path.join(root, `public/assets/photos/${slug}.webp`), `${slug} image`);
    await writeFile(path.join(root, `src/content/photos/${slug}.json`), JSON.stringify({ slug, images: [{ src: `/assets/photos/${slug}.webp` }] }));
    for (const file of [`public/assets/photos/${slug}.webp`, `src/content/photos/${slug}.json`]) {
      await utimes(path.join(root, file), new Date(date), new Date(date));
    }
  }
  const read = async () => JSON.parse(await readFile(path.join(root, "data/photo-updates.json"), "utf8"));
  return { root, read };
}

test("initial timestamps reflect content/asset updates and survive checkout timestamp changes", async (t) => {
  const { root, read } = await fixture(t);
  assert.equal((await syncPhotoUpdates({ root })).changed, 2);
  const before = await read();
  assert(Date.parse(before.newer.updatedAt) > Date.parse(before.older.updatedAt));
  await utimes(path.join(root, "src/content/photos/older.json"), new Date(), new Date());
  await utimes(path.join(root, "public/assets/photos/older.webp"), new Date(), new Date());
  assert.equal((await syncPhotoUpdates({ root })).changed, 0);
  assert.deepEqual(await read(), before);
});

test("editing one album moves only that album to the latest update", async (t) => {
  const { root, read } = await fixture(t);
  await syncPhotoUpdates({ root });
  const before = await read();
  const file = path.join(root, "src/content/photos/older.json");
  const album = JSON.parse(await readFile(file, "utf8"));
  await writeFile(file, JSON.stringify({ ...album, headline: "Updated field notes" }));
  const now = new Date("2026-11-09T04:00:00Z");
  assert.equal((await syncPhotoUpdates({ root, now })).changed, 1);
  const after = await read();
  assert.equal(after.older.updatedAt, now.toISOString());
  assert.deepEqual(after.newer, before.newer);
});

test("replacing image bytes updates its album while formatting-only edits do not", async (t) => {
  const { root, read } = await fixture(t);
  await syncPhotoUpdates({ root });
  const file = path.join(root, "src/content/photos/older.json");
  const album = JSON.parse(await readFile(file, "utf8"));
  await writeFile(file, JSON.stringify({ images: album.images, slug: album.slug }, null, 4));
  assert.equal((await syncPhotoUpdates({ root })).changed, 0);
  await writeFile(path.join(root, "public/assets/photos/older.webp"), "replacement image");
  const now = new Date("2026-11-09T05:00:00Z");
  assert.equal((await syncPhotoUpdates({ root, now })).changed, 1);
  assert.equal((await read()).older.updatedAt, now.toISOString());
});

test("replacing an UploadThing mapping updates only the affected album", async (t) => {
  const { root, read } = await fixture(t);
  await syncPhotoUpdates({ root });
  const before = await read();
  await writeFile(path.join(root, "data/uploadthing-images.json"), JSON.stringify({ images: { "public/assets/photos/older.webp": "https://example.test/new-image" } }));
  assert.equal((await syncPhotoUpdates({ root, now: new Date("2026-11-09T06:00:00Z") })).changed, 1);
  assert.deepEqual((await read()).newer, before.newer);
});

test("deleted albums do not leave stale update records", async (t) => {
  const { root, read } = await fixture(t);
  await syncPhotoUpdates({ root });
  await unlink(path.join(root, "src/content/photos/older.json"));
  await syncPhotoUpdates({ root });
  assert.deepEqual(Object.keys(await read()), ["newer"]);
});
