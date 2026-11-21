// Nightshade — Shadow Courier: the hand-in program. Copies game/ and
// screenshots/ from this repository into the output directory and writes
// /output/dossier.json with buildDossier from vendor/makefun-game.ts.
// Runs on Node 22 with the standard library only, no network, no install.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.
//
// The output directory is never deleted: in the grader it is a mounted
// volume, so deleting its root fails. The directory is created only when
// it is missing, the game and screenshots are copied over whatever is
// already there, and dossier.json is rewritten in place.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Create the output directory if it is missing; never remove it or
// anything inside it first, so a mounted volume's root stays intact.
mkdirSync(outDir, { recursive: true });
cpSync(join(root, 'game'), join(outDir, 'game'), { recursive: true });
const screenshotsDir = join(outDir, 'screenshots');
mkdirSync(screenshotsDir, { recursive: true });
if (existsSync(join(root, 'screenshots'))) {
  cpSync(join(root, 'screenshots'), screenshotsDir, { recursive: true });
}

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`Wrote ${join(outDir, 'dossier.json')} (${dossier.length} bytes)`);
