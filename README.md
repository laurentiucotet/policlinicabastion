# Policlinica Bastion: website

Site-ul Policlinicii Bastion, construit cu **Astro** (frontend static), **TinaCMS**
(editare de conținut, git-backed) și găzduit pe **Vercel**.

- Design: [Figma, Website Bastion](https://www.figma.com/design/k8nfWDReHtpyKXzoO7Nxev/Website-Bastion)
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
cp.env.example.env      # completează valorile din app.tina.io
npm run dev               # site pe:4321, CMS pe:4321/admin/index.html
```

| Comandă | Ce face |
| --- | --- |
| `npm run dev` | Pornește serverul GraphQL local al Tinei **și** `astro dev` |
| `npm run dev:astro` | Doar Astro (fără CMS), mai rapid când lucrezi la UI |
| `npm run build` | Ce rulează Vercel: încearcă panoul Tina, tolerant la orice eșec, apoi site-ul |
| `npm run build:full` | Build Tina strict, fără toleranță, pentru verificare manuală a configurării |
| `npm run preview` | Servește build-ul de producție local |
| `npm run tina:lock` | Regenerează `tina/tina-lock.json` după ce modifici schema |
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
   | `TINA_BRANCH` | `main` (opțional, altfel se ia branch-ul curent) | toate mediile |

4. În TinaCloud → *Site URLs*, pune adresele reale ale site-ului. Portul de
   development al Astro este **4321**, nu 3000: `http://localhost:4321`.
5. Comite `tina/tina-lock.json` (vezi secțiunea de mai jos), fără el TinaCloud
   nu poate indexa conținutul.
6. Invită editorii din TinaCloud → *Collaborators*. Ei nu au nevoie de cont GitHub.

Fără aceste variabile, sau dacă TinaCloud nu răspunde încă, site-ul se
construiește normal, `npm run build` afișează un avertisment și continuă doar
cu site-ul; vezi secțiunea următoare. Poți deci să faci primul deploy imediat
și să configurezi TinaCloud după.

---

## `tina-lock.json`: schema pe care o vede TinaCloud

TinaCloud **nu** citește `tina/collections/*.ts`. Citește `tina/tina-lock.json`,
direct din repo. Fișierul e o compilare a schemei și trebuie comis în git.

Consecința practică: dacă modifici un câmp în `tina/collections/` și nu
regenerezi fișierul, panoul `/admin` va arăta în continuare câmpurile vechi,
chiar dacă site-ul s-a rebuild-uit corect. Nu primești nicio eroare.

Fișierul se regenerează în două feluri:

- automat, de fiecare dată când rulezi `npm run dev`;
- manual, cu `npm run tina:lock` (nu pornește serverul, nu cere credențiale).

**După orice modificare de schemă: regenerează și comite `tina/tina-lock.json`.**

> `tina/__generated__/` este ignorat în git, se reconstruiește la fiecare build
> și nu e nevoie de el în repo.

## Site-ul nu depinde niciodată de TinaCloud

`npm run build` rulează mereu `tinacms build --skip-cloud-checks` și **tolerează
orice eșec** al acestui pas, indiferent de mediu (producție sau preview),
indiferent de motiv. Abia după aceea rulează `astro build`, care chiar trebuie
să reușească.

Motivul: site-ul propriu-zis (`astro build`) nu citește nimic din TinaCloud,
citește direct fișierele din `src/content` (vezi `docs/ARHITECTURA.md`).
Singurul lucru care depinde de TinaCloud e panoul `/admin`. O problemă acolo
nu trebuie să oprească niciodată deploy-ul unei clinici reale.

Eșecuri frecvente ale `tinacms build`, toate tolerate:

- **Credențiale lipsă**: `/admin` nu se construiește deloc.
- **`Branch '...' is not on TinaCloud`**: TinaCloud indexează doar
  branch-urile adăugate explicit în proiect; normal pe orice deploy de preview.
- **`project not found` (404), pe orice branch, inclusiv cel implicit**,
  de obicei proiectul TinaCloud nu a terminat încă de procesat conectarea la
  repo (webhook-ul de la primul push), sau `TINA_PUBLIC_CLIENT_ID` /
  `TINA_TOKEN` au un spațiu sau o ghilimea în plus, lipite din greșeală la
  copiere în Vercel. Așteaptă câteva minute și redeployează; dacă persistă,
  verifică valorile variabilelor caracter cu caracter.

În toate cazurile, `/admin` poate lipsi sau poate să nu funcționeze temporar,
site-ul public rămâne neafectat. Pentru o verificare strictă și manuală a
configurării TinaCloud (fără toleranță la erori), rulează `npm run build:full`.

Ca să editezi efectiv de pe un branch anume (nu doar ca site-ul să se
construiască), branch-ul trebuie adăugat explicit în TinaCloud. Altfel, calea
normală e să faci merge în branch-ul de producție și să editezi de acolo.

## Deploy pe Vercel

Setări de proiect:

| Setare | Valoare |
| --- | --- |
| Framework preset | Astro |
| Build command | `npm run build` |
| Output directory | (lăsat gol, adapterul Vercel îl gestionează) |
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

Fără ele, mesajele apar doar în logurile Vercel, formularul nu dă eroare.

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

- `src/content.config.ts`: ce citește Astro (validare Zod, tipuri TypeScript)
- `tina/collections/*.ts`: ce vede editorul în `/admin`

Când adaugi un câmp, adaugă-l în ambele. Detalii și motivația acestei alegeri
în [`docs/ARHITECTURA.md`](docs/ARHITECTURA.md).
