/**
 * Genereaza imaginea implicita pentru distribuiri (Open Graph).
 *
 * Cand cineva pune un link al site-ului pe Facebook, WhatsApp sau LinkedIn,
 * reteaua cere adresa din `og:image`. Daca acolo nu e nimic, cardul apare gol
 * si linkul arata a spam. Pana la o fotografie reala a clinicii, imaginea de
 * aici tine locul: aceleasi culori si acelasi semn ca in antetul site-ului.
 *
 * Se poate inlocui oricand din CMS (Setări → SEO implicit → Imagine implicită
 * social media) cu o fotografie adevarata. 1200x630 e formatul cerut de toate
 * retelele; sub 200 KB, ca sa se incarce si pe date mobile.
 *
 * Rulare:  node scripts/make-og-image.mjs
 *
 * Textul e desenat cu fonturile sistemului, nu cu Inter/Public Sans: scriptul
 * ruleaza rar si local, iar librsvg (din sharp) nu stie sa citeasca fonturile
 * web ale site-ului. Diferenta se vede doar daca pui cele doua imagini una
 * langa alta.
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'public/uploads/og-default.png');

const WIDTH = 1200;
const HEIGHT = 630;

/* Aceleasi valori ca in src/styles/global.css. */
const BRAND = '#2563eb';
const BRAND_50 = '#eff6ff';
const INK = '#1f2937';
const INK_MUTED = '#4b5563';
const INK_SUBTLE = '#6b7280';

const FONT = 'Liberation Sans, DejaVu Sans, sans-serif';

/* Specializarile se citesc din continut, nu se scriu de mana: imaginea asta
 * ajunge in fiecare distribuire, deci nu are voie sa promita o specializare
 * care intre timp a disparut de pe site. */
const specialityDir = resolve(root, 'src/content/specializari');
const specialities = (
  await Promise.all(
    (await readdir(specialityDir))
.filter((file) => file.endsWith('.mdx'))
.map(async (file) => /^title:\s*(.+)$/m.exec(await readFile(resolve(specialityDir, file), 'utf8'))?.[1]?.trim()),
  )
)
.filter((title) => Boolean(title))
.sort((a, b) => a.localeCompare(b, 'ro'));

/** Le imparte pe randuri, ca sa nu iasa din marginea imaginii. */
const LINE_BUDGET = 62;
const specialityLines = specialities.reduce((lines, title) => {
  const last = lines[lines.length - 1];
  if (last && `${last} · ${title}`.length <= LINE_BUDGET) lines[lines.length - 1] = `${last} · ${title}`;
  else lines.push(title);
  return lines;
}, []);

/* Adresa si telefonul se iau din setarile site-ului: cardul de distribuire e
 * adesea primul lucru pe care il vede cineva, iar un numar gresit acolo costa
 * un pacient. */
const settings = JSON.parse(await readFile(resolve(root, 'src/content/settings/site.json'), 'utf8'));
const contactLine = `${settings.topBar.addressShort} · ${settings.phones[0].value}`;

/* Randul cu decontarea sta sub lista, oricate randuri ar avea ea. */
const SPECIALITY_TOP = 412;
const SPECIALITY_STEP = 42;
const claimY = SPECIALITY_TOP + (specialityLines.length - 1) * SPECIALITY_STEP + 62;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#ffffff"/>

  <!-- Pata de brand din coltul din dreapta-sus, ca imaginea sa nu fie o foaie alba. -->
  <circle cx="${WIDTH - 60}" cy="-40" r="330" fill="${BRAND_50}"/>

  <!-- Semnul din antet: patrat rotunjit albastru cu cruce alba. -->
  <g transform="translate(96, 132)">
    <rect width="112" height="112" rx="34" fill="${BRAND}"/>
    <g transform="translate(16, 16) scale(2.4)">
      <path d="M17 10h6a1 1 0 0 1 1 1v5h5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-5v5a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-5h-5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h5v-5a1 1 0 0 1 1-1Z"
        fill="#ffffff" transform="translate(-10, -10)"/>
    </g>
  </g>

  <text x="240" y="182" font-family="${FONT}" font-size="58" font-weight="700" fill="${INK}">Policlinica</text>
  <text x="240" y="244" font-family="${FONT}" font-size="58" font-weight="700" fill="${INK}">Bastion</text>

  <text x="96" y="350" font-family="${FONT}" font-size="44" font-weight="400" fill="${INK_MUTED}">Policlinică medicală privată în Timișoara</text>

  ${specialityLines
.map(
      (line, index) =>
        `<text x="96" y="${SPECIALITY_TOP + index * SPECIALITY_STEP}" font-family="${FONT}" font-size="30" font-weight="400" fill="${INK_SUBTLE}">${line}</text>`,
    )
.join('\n  ')}

  <text x="96" y="${claimY}" font-family="${FONT}" font-size="28" font-weight="700" fill="${BRAND}">Consultații decontate prin CNAS</text>

  <text x="96" y="${claimY + 62}" font-family="${FONT}" font-size="26" font-weight="400" fill="${INK_SUBTLE}">${contactLine}</text>

  <rect x="0" y="${HEIGHT - 16}" width="${WIDTH}" height="16" fill="${BRAND}"/>
</svg>`;

await mkdir(dirname(output), { recursive: true });

const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
await writeFile(output, png);

const { width, height } = await sharp(png).metadata();
console.log(`✅ ${output.replace(`${root}/`, '')}, ${width}x${height}, ${(png.length / 1024).toFixed(0)} KB`);
