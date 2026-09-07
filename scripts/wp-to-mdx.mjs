#!/usr/bin/env node
/**
 * Converteste un articol WordPress in fisierul .mdx al colectiei `articole`.
 *
 * Se citeste un JSON de pe stdin, cu forma:
 *
 *   { "slug", "title", "date", "category", "excerpt", "cover", "seo", "html" }
 *
 * Motivul pentru care conversia e un script si nu se face de mana: continutul
 * postarilor e HTML semantic curat (`<p>`, `<h2>`, `<ul>`, `<strong>`), deci
 * transformarea e deterministica. Facuta de mana pe 61 de articole, ar fi
 * introdus greseli de transcriere in text medical.
 *
 *   node scripts/wp-to-mdx.mjs < articol.json
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const ENTITIES = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#039;': "'",
  '&#8217;': '’',
  '&#8216;': '‘',
  '&#8220;': '„',
  '&#8221;': '”',
  '&#8211;': '–',
  '&#8212;': '—',
  '&#8230;': '…',
  '&hellip;': '…',
  '&bdquo;': '„',
  '&ldquo;': '„',
  '&rdquo;': '”',
};

const decode = (text) =>
  text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&[a-z]+;|&#\d+;/gi, (entity) => ENTITIES[entity] ?? entity);

/** Continutul inline al unui tag: bold, italic, linkuri. Restul se arunca. */
const inline = (html) =>
  decode(
    html
      .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, text) => {
        const inner = text.replace(/<[^>]+>/g, '').trim();
        return inner ? `**${inner}**` : '';
      })
      .replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, text) => {
        const inner = text.replace(/<[^>]+>/g, '').trim();
        return inner ? `*${inner}*` : '';
      })
      .replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => {
        const label = text.replace(/<[^>]+>/g, '').trim();
        // Linkurile interne pastreaza doar calea: domeniul se schimba la mutare.
        const url = href.replace(/^https?:\/\/(www\.)?policlinicabastion\.ro/, '') || '/';
        return label ? `[${label}](${url})` : '';
      })
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[ \t ]+/g, ' ')
    .trim();

/**
 * Un paragraf integral ingrosat (tipar frecvent pe site-ul vechi, unde
 * `<strong>` era folosit ca stil, nu ca accent) se scrie ca text normal.
 * Altfel jumatate din articole ar fi bold din cap pana in coada.
 */
const unwrapWholeBold = (text) => {
  const match = text.match(/^\*\*([\s\S]+)\*\*$/);
  return match && !match[1].includes('**') ? match[1] : text;
};

const toMarkdown = (html) => {
  const blocks = [];
  const pattern =
    /<(h[1-6]|p|ul|ol|blockquote|pre)\b[^>]*>([\s\S]*?)<\/\1>|<(hr)\s*\/?>/gi;

  for (const match of html.matchAll(pattern)) {
    const tag = (match[1] ?? match[3]).toLowerCase();
    const body = match[2] ?? '';

    if (tag === 'hr') {
      blocks.push('---');
      continue;
    }

    if (tag === 'ul' || tag === 'ol') {
      const items = [...body.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
        .map((item, index) => {
          const text = unwrapWholeBold(inline(item[1]));
          return text ? `${tag === 'ol' ? `${index + 1}.` : '-'} ${text}` : '';
        })
        .filter(Boolean);
      if (items.length) blocks.push(items.join('\n'));
      continue;
    }

    const text = inline(body);
    if (!text) continue;

    if (tag === 'p' || tag === 'pre') blocks.push(unwrapWholeBold(text));
    else if (tag === 'blockquote') blocks.push(`> ${unwrapWholeBold(text)}`);
    else {
      // `<h1>` e titlul articolului, deja in frontmatter si randat de sablon;
      // devine `##`, ca sa nu existe doi h1 in pagina. Restul raman la nivelul
      // lor: `<h2>` -> `##`, la fel ca in articolele scrise direct pentru site.
      const level = Math.max(Number(tag[1]), 2);
      blocks.push(`${'#'.repeat(level)} ${text}`);
    }
  }

  return blocks.join('\n\n');
};

/** YAML: ghilimele doar cand chiar sunt necesare. */
const yaml = (value) =>
  /^[\w\săâîșțĂÂÎȘȚ.,()–—-]+$/u.test(value) && !/^[-?:>|&*!%@`]/.test(value) && !value.includes(': ')
    ? value
    : JSON.stringify(value);

const input = JSON.parse(await new Response(process.stdin).text());
const { slug, title, date, category, author, excerpt, cover, seo, html, projects = [] } = input;

const front = [
  '---',
  `title: ${yaml(title)}`,
  `date: ${date}`,
  `excerpt: ${yaml(excerpt)}`,
  ...(category ? [`category: ${category}`] : []),
  ...(author ? [`author: ${author}`] : []),
  ...(projects.length ? ['projects:', ...projects.map((entry) => `  - ${entry}`)] : []),
  'featured: false',
  'seo:',
  `  description: ${yaml(seo ?? excerpt)}`,
  '---',
  '',
  '',
].join('\n');

const body = toMarkdown(html);
if (!body.trim()) throw new Error(`${slug}: conversia a produs un corp gol`);

await mkdir(join(root, 'src/content/articole'), { recursive: true });
await writeFile(join(root, 'src/content/articole', `${slug}.mdx`), `${front}${body}\n`, 'utf8');

if (cover) {
  const manifestPath = join(root, 'scripts/media-manifest.json');
  const manifest = JSON.parse(await (await import('node:fs/promises')).readFile(manifestPath, 'utf8'));
  manifest.articole ??= {};
  manifest.articole[slug] = cover;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

console.log(`✓ ${slug} (${body.split('\n\n').length} blocuri)`);
