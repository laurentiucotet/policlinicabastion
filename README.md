# Policlinica Bastion — website

Site-ul Policlinicii Bastion, construit cu **Astro** (frontend static), **TinaCMS**
(editare de conținut, git-backed) și găzduit pe **Vercel**.

- Design: [Figma — Website Bastion](https://www.figma.com/design/k8nfWDReHtpyKXzoO7Nxev/Website-Bastion)
- Arhitectura detaliată: [`docs/ARHITECTURA.md`](docs/ARHITECTURA.md)

---

## Cum funcționează, pe scurt

```
Editor (client)                  Git (GitHub)                Vercel
     │                                │                         │
     │  editează la /admin            │                         │
     ├──────────► TinaCloud ──commit──►                         │
     │                                ├────── webhook ──────────►
     │                                │                    build & deploy
     │                                │                         │
     └──────────────────── site actualizat ◄────────────────────┘
```

Nu există bază de date. **Conținutul este format din fișiere `.mdx` și `.json`
din `src/content/`**, versionate în git. Tina este doar interfața de editare;
Astro citește aceleași fișiere la build și generează HTML static.

---

## Instalare locală

```bash
npm install
cp .env.example .env      # completează valorile din app.tina.io
npm run dev               # site pe :4321, CMS pe :4321/admin/index.html
```

| Comandă | Ce face |
| --- | --- |
| `npm run dev` | Pornește serverul GraphQL local al Tinei **și** `astro dev` |
| `npm run dev:astro` | Doar Astro (fără CMS) — mai rapid când lucrezi la UI |
| `npm run build` | Ce rulează Vercel: construiește panoul Tina (dacă există credențiale) + site-ul |
| `npm run build:full` | Forțează build-ul Tina strict — eșuează dacă lipsesc credențialele sau branch-ul |
| `npm run preview` | Servește build-ul de producție local |
| `npm run check` | Verificare TypeScript / Astro |

În dezvoltare, Tina rulează în **local mode**: modificările din `/admin` scriu
direct în fișierele de pe disc, fără să atingă GitHub.

---

## Configurare TinaCloud (o singură dată)

1. Creează cont pe [app.tina.io](https://app.tina.io) și un proiect legat de
   repo-ul `laurentiucotet/policlinicabastion`.
2. Copiază **Client ID** și generează un **Read Only Token**.
3. Adaugă în Vercel → Project → Settings → Environment Variables:

   | Variabilă | Valoare | Vizibilitate |
   | --- | --- | --- |
   | `TINA_PUBLIC_CLIENT_ID` | Client ID din TinaCloud | toate mediile |
   | `TINA_TOKEN` | Read Only Token | toate mediile |
   | `TINA_BRANCH` | `main` (opțional — altfel se ia branch-ul curent) | toate mediile |

4. Invită editorii din TinaCloud → *Collaborators*. Ei nu au nevoie de cont GitHub.

Fără aceste variabile site-ul se construiește normal (`npm run build` sare peste
pasul Tina și afișează un avertisment), dar `/admin` nu va exista. Poți deci să
faci primul deploy imediat și să configurezi TinaCloud după.

---

## Branch-uri și TinaCloud

TinaCloud indexează **doar branch-urile adăugate explicit** în proiect (implicit,
branch-ul default). Vercel însă construiește fiecare branch. Rezultatul, pe un
deploy de preview:

```
ERROR: Branch 'claude/...' is not on TinaCloud.
Error: Branch is not on TinaCloud   errorCode: 'ERR_CLOUD_CHECK_FAILED'
```

`npm run build` tratează asta în funcție de mediu:

| `VERCEL_ENV` | Comportament |
| --- | --- |
| `production` | `tinacms build` strict — orice problemă oprește deploy-ul |
| `preview` sau local | `tinacms build --skip-cloud-checks`, iar dacă tot eșuează se continuă doar cu site-ul |

Deci preview-urile nu mai pică niciodată din cauza asta. Pe un preview, `/admin`
se construiește, dar poate citi conținut doar dacă branch-ul e indexat în
TinaCloud — editarea se face pe producție.

Ca să editezi de pe un branch anume, adaugă-l în TinaCloud, în lista de branch-uri
a proiectului. Altfel, calea normală e să faci merge în branch-ul de producție.

## Deploy pe Vercel

Setări de proiect:

| Setare | Valoare |
| --- | --- |
| Framework preset | Astro |
| Build command | `npm run build` |
| Output directory | (lăsat gol — adapterul Vercel îl gestionează) |
| Install command | `npm install` |
| Node version | 20 sau mai nou |

Site-ul este **static** (`output: 'static'`). Singura funcție serverless este
`/api/contact`, care primește formularul de contact.

Pentru formularul de contact, opțional:

| Variabilă | Rol |
| --- | --- |
| `RESEND_API_KEY` | Cheie [Resend](https://resend.com) pentru trimiterea emailului |
| `CONTACT_TO_EMAIL` | Adresa care primește mesajele |
| `CONTACT_FROM_EMAIL` | Expeditorul (domeniu verificat în Resend) |

Fără ele, mesajele apar doar în logurile Vercel — formularul nu dă eroare.

---

## Structura proiectului

```
src/
├── content/              ← CONȚINUTUL (editabil din /admin)
│   ├── settings/         ← site.json, navigation.json, home.json
│   ├── specializari/     ← *.mdx
│   ├── medici/           ← *.mdx
│   ├── articole/         ← *.mdx (blog / noutăți)
│   ├── categorii/        ← *.json
│   ├── proiecte-europene/← *.mdx
│   ├── testimoniale/     ← *.json
│   └── pagini/           ← *.mdx (GDPR, termeni, drepturile pacienților…)
├── content.config.ts     ← schema Astro (validare + tipuri)
├── assets/uploads/       ← imaginile urcate din CMS
├── components/
│   ├── layout/           ← Header, Footer, TopBar, Logo
│   ├── ui/               ← Button, Badge, Icon, SectionHeading…
│   ├── sections/         ← Hero, TeamGrid, CtaBand, ServicesAccordion…
│   └── cards/            ← BlogCard, DoctorCard, TestimonialCard…
├── layouts/BaseLayout.astro
├── lib/                  ← helpere de citire a conținutului
├── pages/                ← rutele site-ului
└── styles/global.css     ← design tokens (Tailwind v4)

tina/
├── config.ts             ← configurarea TinaCMS
└── collections/          ← schema câmpurilor din CMS
```

---

## Rutele site-ului

| URL | Sursă |
| --- | --- |
| `/` | `src/content/settings/home.json` + colecțiile |
| `/specializari`, `/specializari/[slug]` | `src/content/specializari` |
| `/medici`, `/medici/[slug]` | `src/content/medici` |
| `/noutati`, `/noutati/[slug]` | `src/content/articole` |
| `/noutati/categorie/[slug]` | `src/content/categorii` |
| `/proiecte-europene`, `/proiecte-europene/[slug]` | `src/content/proiecte-europene` |
| `/contact` | pagină dedicată + `/api/contact` |
| `/cautare` | căutare client-side peste `/cautare-index.json` |
| `/[slug]` | `src/content/pagini` |

---

## Important pentru dezvoltatori

Schema există în **două locuri** și trebuie ținută în sincron:

- `src/content.config.ts` — ce citește Astro (validare Zod, tipuri TypeScript)
- `tina/collections/*.ts` — ce vede editorul în `/admin`

Când adaugi un câmp, adaugă-l în ambele. Detalii și motivația acestei alegeri
în [`docs/ARHITECTURA.md`](docs/ARHITECTURA.md).
