import { readFile, access } from 'node:fs/promises';
import path from 'node:path';

// Fail the build rather than publish a ready portrait with missing/incorrect art.
const root = process.cwd();
const assets = JSON.parse(await readFile(path.join(root, 'lib/character/portraits.json'), 'utf8'));
const species = ['Fox', 'Wolf', 'Raccoon', 'Bear', 'Rabbit', 'Badger', 'Owl'];
const classes = ['Scout', 'Ranger', 'Trickster', 'Guardian', 'Rogue', 'Warrior', 'Mage'];

const identities = new Set(); const coverage = new Set();
if (!Array.isArray(assets)) throw new Error('Portrait catalogue must be an array.');
for (const asset of assets) {
  const fail = message => { throw new Error(`Character asset ${asset.id ?? '(no id)'}: ${message}`); };
  if (!asset.id || identities.has(asset.id)) fail('missing or duplicate id');
  identities.add(asset.id);
  if (!species.includes(asset.species) || !classes.includes(asset.class)) fail('unknown species/class');
  if (!['ready', 'awaiting-artwork'].includes(asset.status)) fail('unknown status');
  if (!/^\/characters\/[a-z0-9/-]+\.png$/.test(asset.src)) fail('use a same-origin /characters/… PNG path');
  if (asset.outfit !== null && (typeof asset.outfit !== 'string' || !asset.outfit.trim())) fail('unknown outfit');
  if (asset.status !== 'ready') {
    try { await access(path.join(root, 'public', asset.src)); console.log(`Pending registration exists: public${asset.src}; record dimensions and activate after validation.`); }
    catch { console.log(`MISSING ARTWORK: public${asset.src}`); }
    continue;
  }
  if (!asset.outfit || !asset.credit?.trim()) fail('ready art requires an exact outfit and provenance');
  const key = `${asset.species}/${asset.class}/${asset.outfit}/${asset.fallback ? 'fallback' : 'primary'}`;
  if (coverage.has(key)) fail(`ambiguous coverage for ${key}`);
  coverage.add(key);
  const bytes = await readFile(path.join(root, 'public', asset.src));
  if (bytes.length < 24 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') fail('file must be a real PNG');
  if (bytes.length > 10 * 1024 * 1024) fail('PNG exceeds 10 MB; optimize before publishing');
  if (bytes.readUInt32BE(16) !== asset.width || bytes.readUInt32BE(20) !== asset.height) fail('dimensions do not match PNG');
  if (asset.width < 960 || asset.height < 1240) fail('production portrait must be at least 960×1240');
  for (const suffix of ['.webp', '.thumb.webp']) {
    const derived = asset.src.replace(/\.png$/, suffix);
    let webp;
    try { webp = await readFile(path.join(root, 'public', derived)); }
    catch { fail(`missing display copy public${derived}; run python3 scripts/make-web-derivatives.py`); }
    if (webp.subarray(0, 4).toString() !== 'RIFF' || webp.subarray(8, 12).toString() !== 'WEBP') fail(`${derived} is not a real WebP`);
  }
}
console.log(`Character catalogue valid: ${assets.filter(asset => asset.status === 'ready').length} ready, ${assets.filter(asset => asset.status !== 'ready').length} awaiting artwork.`);
