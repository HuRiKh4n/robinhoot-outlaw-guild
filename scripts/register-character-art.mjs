import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Registers original character artwork dropped at
 *   public/characters/<species>/<class>/<outfit-slug>.png
 * e.g. public/characters/fox/scout/wanderer-pack.png → Fox / Scout / "Wanderer Pack".
 *
 * New files get a `ready` catalogue entry with their real PNG dimensions.
 * Existing `awaiting-artwork` entries whose file now exists are activated.
 * Files already registered are left untouched. Images are never modified.
 * Run `npm run validate:art` afterwards (the build does this automatically).
 */
const root = process.cwd();
const catalogueFile = path.join(root, 'lib/character/portraits.json');
const charactersDir = path.join(root, 'public/characters');
const credit = 'Approved original artwork uploaded by repository owner HuRiKh4n for RobinHoot integration; image preserved unchanged.';
const title = slug => slug.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');

const catalogue = JSON.parse(await readFile(catalogueFile, 'utf8'));
const bySrc = new Map(catalogue.map(asset => [asset.src, asset]));
const added = []; const activated = [];

async function dims(file) {
  const bytes = await readFile(file);
  if (bytes.length < 24 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error(`${file} is not a real PNG`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

for (const speciesDir of (await readdir(charactersDir, { withFileTypes: true })).filter(entry => entry.isDirectory())) {
  for (const classDir of (await readdir(path.join(charactersDir, speciesDir.name), { withFileTypes: true })).filter(entry => entry.isDirectory())) {
    for (const file of (await readdir(path.join(charactersDir, speciesDir.name, classDir.name))).filter(name => /^[a-z0-9-]+\.png$/.test(name)).sort()) {
      const src = `/characters/${speciesDir.name}/${classDir.name}/${file}`;
      const existing = bySrc.get(src);
      if (existing?.status === 'ready') continue;
      const size = await dims(path.join(charactersDir, speciesDir.name, classDir.name, file));
      if (existing) { Object.assign(existing, size, { status: 'ready', credit: existing.credit || credit }); activated.push(src); continue; }
      if (file === 'portrait.png') continue; // legacy fallback name, never a new outfit
      const outfit = title(file.replace(/\.png$/, ''));
      const entry = { id: `${speciesDir.name}-${classDir.name}-${file.replace(/\.png$/, '')}`, species: title(speciesDir.name), class: title(classDir.name), outfit, status: 'ready', src, ...size, credit };
      catalogue.push(entry); bySrc.set(src, entry); added.push(`${entry.species} / ${entry.class} / ${outfit}`);
    }
  }
}

await writeFile(catalogueFile, `${JSON.stringify(catalogue, null, 2)}\n`);
for (const line of added) console.log(`Registered: ${line}`);
for (const line of activated) console.log(`Activated: public${line}`);
if (added.length || activated.length) console.log('Next: python3 scripts/make-web-derivatives.py to create the lightweight display copies.');
console.log(`${added.length} new, ${activated.length} activated, ${catalogue.filter(asset => asset.status === 'ready').length} ready in total.`);
