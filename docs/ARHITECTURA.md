# Arhitectura site-ului Policlinica Bastion

Document de referință: ce am ales, **de ce**, și cum se lucrează mai departe.

---

## 1. Stack-ul și rolul fiecărei piese

| Piesă | Rol | De ce |
| --- | --- | --- |
| **Astro 7** | Generează HTML static la build | Site de prezentare = conținut care se schimbă rar, dar trebuie să se încarce instant și să fie indexat perfect. Astro trimite ~0 KB de JavaScript pe pagină. |
| **TinaCMS** | Interfața de editare pentru client | Git-backed: conținutul rămâne în repo, nu într-o bază de date externă. |
| **Tailwind CSS v4** | Stiluri | Tokenii din Figma (culori, spații, fonturi) sunt aproape identici cu scara default Tailwind, deci maparea e 1:1. |
| **Vercel** | Hosting + build automat | Deploy la fiecare commit, preview per branch, optimizare de imagini inclusă. |

---

## 2. Ce este TinaCMS (explicație de la zero)

Un CMS clasic (WordPress, Strapi) ține conținutul într-o **bază de date**.
Site-ul întreabă baza de date la fiecare vizită. Asta înseamnă server, backup-uri,
actualizări de securitate, plugin-uri care se strică.

TinaCMS funcționează altfel. Conținutul este format din **fișiere text în repo**:

```
src/content/articole/biopsia-de-prostata.mdx
---
title: "Biopsia de prostată: același scop, tehnici diferite"
date: 2026-02-18
excerpt: Transrectal sau transperineal?
category: urologie
---

Dacă medicul tău a recomandat o biopsie de prostată...
```

Tina are trei componente:

1. **Schema** (`tina/collections/*.ts`) — descrie ce câmpuri are fiecare tip de
   conținut. Din ea Tina generează automat formularele din panoul de admin.
2. **Panoul de admin** (`/admin`) — o aplicație React statică, generată de
   `tinacms build` în `public/admin`. Nu rulează pe server, e doar HTML+JS.
3. **TinaCloud** — serviciul care leagă panoul de GitHub: autentifică editorii
   și face commit-uri în numele lor.

Fluxul complet când clientul apasă „Save”:

```
1. Editorul modifică un articol în /admin
2. Panoul trimite modificarea la TinaCloud
3. TinaCloud face un commit în branch-ul `main`
4. GitHub notifică Vercel
5. Vercel rulează `tinacms build && astro build`
6. Site-ul nou e live în ~1 minut
```

**Consecințe practice, bune:**

- Fiecare modificare de conținut are autor, dată și diff în istoricul git.
- Se poate reveni la orice versiune anterioară.
- Nu există bază de date de întreținut, de securizat sau care poate pica.
- Site-ul livrat e HTML static — nu poate fi „spart” prin CMS.

**Consecințe practice, de știut:**

- Publicarea nu e instantanee: durează cât un build (aproximativ un minut).
- Nu e potrivit pentru conținut generat de utilizatori (comentarii, conturi).
- Planul gratuit TinaCloud e limitat la 2 editori. Peste, e plan plătit.

---

## 3. Decizia centrală: Astro citește fișierele, nu API-ul Tinei

Tina expune și un API GraphQL. Se putea ca Astro să interogheze acel API la
build. **Nu am făcut asta.** Astro citește direct fișierele din `src/content`,
prin *content collections*.

| | Fișiere direct (ales) | GraphQL Tina |
| --- | --- | --- |
| Viteză build | Foarte rapid, totul e local | Request-uri de rețea la fiecare build |
| Tipuri TypeScript | Din schema Zod, native Astro | Generate de Tina |
| Dependență de TinaCloud la build | Nu — build-ul merge și dacă Tina e picată | Da |
| Visual editing (preview live) | Nu | Da, dar necesită React în Astro |
| Schema | În două locuri, ținute manual în sincron | Într-un singur loc |

Pentru un site de prezentare, robustețea build-ului și simplitatea contează mai
mult decât preview-ul live. De aceea `client: { skip: true }` în `tina/config.ts`.

**Costul acestei alegeri:** schema există în două locuri.

- `src/content.config.ts` — validarea Zod + tipurile pentru cod
- `tina/collections/*.ts` — formularele din panoul de admin

Când adaugi un câmp, **adaugă-l în ambele** — și regenerează `tina-lock.json`
(`npm run tina:lock`), pentru că TinaCloud citește schema din acel fișier, nu
din `tina/collections/`. Astea sunt singurele două reguli de disciplină ale
proiectului.

---

## 4. Modelul de conținut

Derivat direct din paginile din Figma.

### Colecții (mai multe documente, fiecare cu pagină proprie)

| Colecție | Folder | Format | Pagină generată |
| --- | --- | --- | --- |
| `specializari` | `src/content/specializari` | `.mdx` | `/specializari/[slug]` |
| `medici` | `src/content/medici` | `.mdx` | `/medici/[slug]` |
| `articole` | `src/content/articole` | `.mdx` | `/noutati/[slug]` |
| `categorii` | `src/content/categorii` | `.json` | `/noutati/categorie/[slug]` |
| `proiecte` | `src/content/proiecte-europene` | `.mdx` | `/proiecte-europene/[slug]` |
| `testimoniale` | `src/content/testimoniale` | `.json` | — (doar pe prima pagină) |
| `pagini` | `src/content/pagini` | `.mdx` | `/[slug]` |

### Singletonuri (un singur fișier, fără buton de „adaugă”)

| Fișier | Ce conține |
| --- | --- |
| `settings/site.json` | Nume, telefoane, email, adresă, program, WhatsApp, social, SEO implicit |
| `settings/navigation.json` | Meniul principal și linkurile din subsol |
| `settings/home.json` | Toate textele de pe prima pagină (hero, titluri de secțiuni, benzi CTA) |

Singletonurile **nu** sunt content collections Astro — sunt importate direct ca
JSON în `src/lib/site.ts`. Nu au nevoie de slug sau de listare, deci importul
direct e mai simplu și mai rapid. Rămân perfect editabile din Tina.

### Relații între colecții

- Un **medic** are una sau mai multe **specializări**.
  Pagina `/specializari/nefrologie` listează automat medicii care o au bifată.
- Un **articol** are o **categorie** și, opțional, un **autor** (medic).

⚠️ **Detaliu tehnic important.** Tina salvează referințele ca *path complet*
(`src/content/specializari/nefrologie.mdx`), iar Astro așteaptă *id-ul*
(`nefrologie`). Normalizarea se face în `src/content.config.ts`, în helperele
`refTo()` și `refListTo()` — acceptă ambele forme, deci merg și fișierele
scrise manual, și cele scrise de Tina.

De asemenea, câmpurile `reference` nu suportă `list: true` în interfața Tina.
Pentru specializările unui medic folosim o listă de obiecte cu câte o referință
(`{ ref: '...' }`), iar `refListTo()` o aplatizează la citire.

---

## 5. Imagini

Fișierele urcate din CMS ajung în **`src/assets/uploads/`**, nu în `public/`.

Motivul: Astro poate optimiza (redimensiona, converti în WebP/AVIF, genera
`srcset`) doar imaginile din `src/`. Cele din `public/` sunt servite ca atare.

Configurarea din `tina/config.ts`:

```ts
media: {
  tina: {
    publicFolder: '',
    mediaRoot: 'src/assets/uploads',
  },
},
```

Tina scrie în câmp valoarea `/src/assets/uploads/poza.jpg`, iar helperul
`image()` din schema Astro o rezolvă și o trece prin pipeline-ul de optimizare.
În producție, imaginile sunt servite prin Vercel Image Optimization
(`/_vercel/image?...`).

---

## 6. Static vs. server

Tot site-ul este `output: 'static'`. Singura excepție este `/api/contact`, care
are `export const prerender = false` și devine o funcție serverless pe Vercel.

Formularul de contact funcționează prin POST clasic + redirect (fără JavaScript),
are honeypot anti-spam și trimite emailul prin Resend dacă este configurat.

---

## 6bis. Build-ul nu depinde de TinaCloud

`scripts/build.mjs` (folosit de `npm run build`) rulează `tinacms build
--skip-cloud-checks` și **tolerează orice eșec** al acestui pas, apoi rulează
mereu `astro build`.

Această decizie a apărut direct dintr-un incident: primul deploy de producție
a picat cu `project not found` (404) — TinaCloud nu terminase încă de procesat
conectarea proiectului la repo. Eroarea nu avea nicio legătură cu site-ul, dar
oprea complet deploy-ul unei clinici reale.

Varianta inițială trata diferit producția (strict) față de preview (tolerant).
S-a dovedit greșită: o clinică cu programări reale nu ar trebui să depindă de
disponibilitatea unui serviciu extern de CMS, în niciun mediu. Astro citește
conținutul direct din fișiere (§3), deci `astro build` nu are nevoie de
TinaCloud sub nicio formă — motiv suficient ca eșecul lui `tinacms build` să
nu fie niciodată blocant.

Consecința: `/admin` poate lipsi sau poate fi temporar nefuncțional (branch
neindexat, credențiale greșite, proiect TinaCloud neconectat încă), dar site-ul
public se construiește oricum. Pentru o verificare strictă, manuală, a
configurării TinaCloud există `npm run build:full` (fără toleranță).

---

## 7. Design tokens

Definite o singură dată în `src/styles/global.css`, în blocul `@theme` al
Tailwind v4, preluate din variabilele Figma:

| Token | Valoare | Figma |
| --- | --- | --- |
| `--color-brand` | `#2563eb` | `brand-primary` |
| `--color-brand-dark` | `#1e40af` | `brand-secondary` |
| `--color-ink` | `#1f2937` | `text-primary` |
| `--color-ink-muted` | `#4b5563` | `text-secondary` |
| `--color-stroke` | `#e5e7eb` | `stroke` |
| `--color-surface-alt` | `#f9fafb` | `gray/50` |
| `--color-chip` / `--color-chip-ink` | `#e0f2fe` / `#0284c7` | `sky/100`, `sky/600` |
| `--container-page` | `1280px` | `container/7xl` |

Fonturile (Inter pentru text, Public Sans pentru titluri) sunt descărcate la
build prin Astro Fonts API și servite de pe domeniul propriu — fără request
către Google la runtime (GDPR) și fără layout shift.

---

## 8. Migrarea conținutului de pe policlinicabastion.ro (WordPress)

Site-ul vechi rulează pe WordPress, la `policlinicabastion.ro`. Conținutul din acest
repo a fost completat cu date reale de pe acel site — dar cu o limitare de mediu
importantă, explicată mai jos.

### Limitare: WebFetch e blocat în acest sandbox

Mediul în care rulează Claude Code aici **nu are voie să descarce pagini web**
(egress blocat prin proxy, confirmat inclusiv pe domenii banale ca wikipedia.org).
Singurul instrument disponibil a fost `WebSearch`, care întoarce titluri, URL-uri
și **rezumate scurte** generate de un model, nu HTML-ul brut al paginilor.

Consecința practică: am putut reconstrui cu încredere ridicată **structura**
site-ului vechi (slug-uri URL, titluri, date, roluri, categorii), dar **nu**
și textul exact, cuvânt cu cuvânt, al fiecărei pagini. Unde nu am avut acces la
textul original, l-am înlocuit cu un paragraf scurt, generic, medical corect,
urmat de o notă explicită `*(...)* ` care spune clar că textul integral trebuie
adus din site-ul vechi.

**Nu presupune că orice text din acest repo e citat identic din site-ul vechi.**
Doar câmpurile marcate ca atare (fără nota de mai sus) au fost verificate prin
căutare directă.

### Ce a fost verificat prin căutare (are încredere ridicată)

- Contact: telefon `0738.826.587`, email `receptie@policlinicabastion.ro`,
  adresă `Str. Mircea cel Bătrân nr. 122C, Timișoara` — din pagina de contact
  și din politica de confidențialitate a site-ului vechi.
- Program: Luni/Miercuri/Vineri 08:00–22:00, Marți/Joi 08:00–23:30,
  Sâmbătă–Duminică închis.
- Pagina de Facebook: `facebook.com/policlinicabastion`.
- 4 medici reali, cu pagină proprie pe site-ul vechi: Asist. Univ. Dr. Lațcu
  Silviu-Constantin (urologie), Dr. Chiriac Ionel (urologie), Dr. Găină
  Adriana-Margareta (neurologie), Dr. Voichescu Otilia (medicină de familie).
- Prof. Univ. Dr. Ligia Petrica (nefrologie) — cabinetul ei, fost Centru Medical
  Nefrotim, a fost preluat de Policlinica Bastion în 2020.
- ~28 de articole reale de blog (titluri + URL-uri confirmate; vezi tabelul de
  mai jos). 8 dintre ele au dată de publicare confirmată și sunt marcate
  `draft: false`; restul sunt `draft: true` până la completare.
- Proiectul european real: „Creșterea eficienței prin tehnologii avansate la
  Policlinica Bastion", prin Programul Regional Vest 2021–2027 (sterilizator
  cu plasmă LowTem + laser Holmium MultiPulse HoPLUS) — nu „eficiență
  energetică", cum inventasem inițial din eroare.

### Ce am eliminat pentru că nu era real

- „Oncologie Urologică" ca pagină/specializare separată — nu există pe site-ul
  vechi; e tratată ca temă în cadrul urologiei, așa cum e acum și aici.
- Recenziile inițiale erau text identic, inventat, la toate 6 — risc real de
  „recenzii false" pentru o clinică medicală. Înlocuite cu 4 recenzii generice,
  distincte, care trebuie oricum completate cu recenzii reale copiate din
  Google Business Profile înainte de lansare.

### Mapare slug vechi → slug nou (pentru redirect-uri 301)

Site-ul vechi (WordPress) folosește slug-uri plate la rădăcină
(`/urologie/`, `/nefrologie/`, `/medici/dr-x/`, articolele direct în `/`).
Noul site grupează logic sub `/specializari/`, `/medici/`, `/noutati/`. La
migrare, aceste redirect-uri 301 sunt **obligatorii** ca să nu se piardă
poziționarea în Google:

| Vechi (WordPress) | Nou (acest site) |
| --- | --- |
| `/nefrologie/` | `/specializari/nefrologie` |
| `/urologie/` | `/specializari/urologie` |
| `/neurologie/` | `/specializari/neurologie` |
| `/psihiatrie/` | `/specializari/psihiatrie` |
| `/mf/` | `/specializari/medicina-de-familie` |
| `/diabet/` | `/specializari/diabet-si-nutritie` |
| `/chirurgie-generala/` | `/specializari/chirurgie-generala` |
| `/servicii-casa/` | `/servicii-decontate-cnas` |
| `/medici/asist-univ-dr-latcu-silviu-constantin/` | `/medici/asist-univ-dr-latcu-silviu-constantin` (identic) |
| `/medici/dr-chiriac-ionel/` | `/medici/dr-chiriac-ionel` (identic) |
| `/medici/dr-gaina-adriana-margareta/` | `/medici/dr-gaina-adriana-margareta` (identic) |
| `/drepturile-si-obligatiile-pacientilor/` | `/drepturile-pacientilor` |
| `/politica-de-confidentialitate/` | `/politica-de-confidentialitate` (identic) |
| orice `/<slug-articol>/` de la rădăcină | `/noutati/<slug-articol>` (slug păstrat identic) |

Toate slug-urile articolelor din `src/content/articole/` au fost păstrate
identice cu cele găsite pe site-ul vechi — deci maparea pentru fiecare articol
e mereu `/<slug>/` → `/noutati/<slug>`.

---

## 9. Ce urmează

Lucruri conștient lăsate pentru pașii următori:

- [ ] Preluarea textului integral, verbatim, pentru cele ~20 de articole marcate
      `draft: true` și pentru biografiile scurte ale medicilor (Chiriac, Găină,
      Voichescu, Petrica) — necesită acces direct la site-ul vechi (WebFetch a
      fost blocat în acest mediu; vezi §8).
- [ ] Recenzii reale, copiate din Google Business Profile (rating actual: ~4,2/5,
      ~70 de recenzii), în locul celor 4 generice din `src/content/testimoniale/`.
- [ ] Fotografiile medicilor și imaginile pentru articole.
- [ ] Datele financiare ale proiectului european (cod, valoare, perioadă exactă).
- [ ] Paginare pe `/noutati` (acum se afișează toate articolele nepublicate ca draft).
- [ ] Redirect-uri 301 din URL-urile vechi de WordPress (`vercel.json`) — vezi
      tabelul din §8.
- [ ] Verificarea fidelității față de Figma, secțiune cu secțiune, pe
      breakpoint-uri (structura și tokenii sunt puși, rafinarea vizuală urmează).
- [ ] Google Tag Manager (câmpul există deja în `settings/site.json`).
