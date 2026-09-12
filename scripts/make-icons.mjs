/**
 * Genereaza iconitele derivate din `public/favicon.svg`.
 *
 * De ce e nevoie de ele: Safari pe iOS nu stie favicon SVG. Cand cineva pune
 * site-ul pe ecranul de start al telefonului, fara `apple-touch-icon.png`
 * sistemul face o captura a paginii si o foloseste ca iconita.
 *
 * Fundalul e alb, nu transparent: iOS pune oricum un dreptunghi alb sub iconita
 * si, cu semnul lipit de margini, ar iesi taiat de coltul rotunjit.
 *
 * Rulare:  node scripts/make-icons.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'public/favicon.svg');

/** Dimensiunea ceruta de iOS, cu semnul la 70% din latura. */
const SIZE = 180;
const MARK = Math.round(SIZE * 0.7);

const svg = await readFile(source);

const mark = await sharp(svg, { density: 600 }).resize(MARK, MARK, { fit: 'contain' }).png().toBuffer();

const icon = await sharp({
  create: { width: SIZE, height: SIZE, channels: 4, background: '#ffffff' },
})
  .composite([{ input: mark, gravity: 'center' }])
  .png({ compressionLevel: 9 })
  .toBuffer();

const output = resolve(root, 'public/apple-touch-icon.png');
await writeFile(output, icon);

console.log(`✅ public/apple-touch-icon.png, ${SIZE}x${SIZE}, ${(icon.length / 1024).toFixed(0)} KB`);
