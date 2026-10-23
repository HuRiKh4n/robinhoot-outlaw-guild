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
  if (bytes.length > 10 * 1024 * 1024) fail('image exceeds 10 MB; optimize before publishing');
  let width, height;
  if (bytes.length >= 24 && bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') {
    width = bytes.readUInt32BE(16); height = bytes.readUInt32BE(20);
  } else if (bytes.length >= 4 && bytes.readUInt16BE(0) === 0xffd8) {
    // Preserve approved JPEG originals uploaded with .png names. Inspect actual
    // SOF dimensions rather than trusting the filename or registry metadata.
    let offset = 2;
    while (offset < bytes.length) {
      if (bytes[offset++] !== 0xff) fail('invalid JPEG marker');
      while (offset < bytes.length && bytes[offset] === 0xff) offset++;
      const marker = bytes[offset++];
      if (marker === 0xda || marker === 0xd9) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > bytes.length) fail('truncated JPEG segment');
      const length = bytes.readUInt16BE(offset);
      if (length < 2 || offset + length > bytes.length) fail('invalid JPEG segment length');
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        if (length < 8) fail('truncated JPEG dimensions');
        height = bytes.readUInt16BE(offset + 3); width = bytes.readUInt16BE(offset + 5); break;
      }
      offset += length;
    }
    if (!width || !height) fail('JPEG dimensions not found');
  } else fail('file must be a real PNG or JPEG');
  if (width !== asset.width || height !== asset.height) fail('dimensions do not match image');
  if (asset.width < 960 || asset.height < 1240) fail('production portrait must be at least 960×1240');
}
console.log(`Character catalogue valid: ${assets.filter(asset => asset.status === 'ready').length} ready, ${assets.filter(asset => asset.status !== 'ready').length} awaiting artwork.`);
