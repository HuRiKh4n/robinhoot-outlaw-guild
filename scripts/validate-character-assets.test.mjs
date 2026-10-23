import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';

const validator = path.resolve('scripts/validate-character-assets.mjs');
const mascot = await readFile('public/images/file_000000001d188246a150a12121d3ed34.png');
// Existing mascot copied only into a temporary validation fixture; never registered in the app.
const entry = { id: 'fixture', species: 'Fox', class: 'Scout', outfit: 'Patched Cloak', status: 'ready', src: '/characters/fixture.png', width: mascot.readUInt32BE(16), height: mascot.readUInt32BE(20), credit: 'Repository mascot; validator test fixture only' };
async function check(entries, withFile, action, image = mascot) {
  const directory = await mkdtemp(path.join(tmpdir(), 'robinhoot-art-test-'));
  try {
    await mkdir(path.join(directory, 'lib/character'), { recursive: true });
    await mkdir(path.join(directory, 'public/characters'), { recursive: true });
    await writeFile(path.join(directory, 'lib/character/portraits.json'), JSON.stringify(entries));
    if (withFile) await writeFile(path.join(directory, 'public/characters/fixture.png'), image);
    action(() => execFileSync(process.execPath, [validator], { cwd: directory, stdio: 'pipe' }).toString());
  } finally { await rm(directory, { recursive: true, force: true }); }
}

test('pending portraits need no file, while ready portraits require a real matching local file', async () => {
  await check([{ ...entry, status: 'awaiting-artwork', outfit: null }], false, run => assert.match(run(), /0 ready, 1 awaiting/));
  await check([entry], false, run => assert.throws(run, /ENOENT/));
  await check([entry], true, run => assert.match(run(), /1 ready, 0 awaiting/));
  await check([{ ...entry, width: entry.width + 1 }], true, run => assert.throws(run, /dimensions do not match/));
});

test('publishing rejects permission gaps, remote sources and conflicting combination coverage', async () => {
  await check([{ ...entry, credit: '' }], true, run => assert.throws(run, /provenance/));
  await check([{ ...entry, src: 'https://example.com/portrait.png' }], false, run => assert.throws(run, /same-origin/));
  await check([entry, { ...entry, id: 'conflict' }], true, run => assert.throws(run, /ambiguous coverage/));
  await check([{ ...entry, outfit: null }], true, run => assert.throws(run, /exact outfit/));
});


test('JPEG originals at supplied PNG paths are checked by signature and real dimensions', async () => {
  const original = await readFile('public/characters/wolf/warrior/battle-armor.png');
  const jpeg = { ...entry, width: 1024, height: 1536 };
  await check([jpeg], true, run => assert.match(run(), /1 ready, 0 awaiting/), original);
  await check([{ ...jpeg, width: 1025 }], true, run => assert.throws(run, /dimensions do not match/), original);
  await check([jpeg], true, run => assert.throws(run, /truncated JPEG|invalid JPEG/), original.subarray(0, 10));
  await check([jpeg], true, run => assert.throws(run, /real PNG or JPEG/), Buffer.from('not an image'));
});
