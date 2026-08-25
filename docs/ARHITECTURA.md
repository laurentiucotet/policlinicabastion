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
| `afectiuni` | `src/content/afectiuni` | `.mdx` | `/afectiuni/[slug]` |
| `servicii` | `src/content/servicii` | `.mdx` | `/servicii/[slug]` |
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

Relațiile sunt coloana vertebrală a site-ului: fiecare pagină de afecțiune,
intervenție sau serviciu duce mai departe, către specializare, medici,
intervenții și noutăți.

```
specializare ─┬─ medici           (medicul își declară specializările)
              ├─ afecțiuni        (afecțiunea își declară specializarea)
              └─ servicii         (serviciul își declară specializarea)

afecțiune ◄──────► serviciu       (relație bidirecțională, vezi mai jos)
serviciu  ───────► medici         (gol = toți medicii specializării)
serviciu  ───────► servicii       (alternative cu aceeași indicație)
articol   ───────► afecțiuni / servicii / proiecte europene
```

- Un **medic** are una sau mai multe **specializări**.
  Pagina `/specializari/nefrologie` listează automat medicii care o au bifată.
- Un **articol** are o **categorie** și, opțional, un **autor** (medic).
- O **afecțiune** aparține unei singure specializări — care devine și categoria
  ei în catalogul `/afecțiuni`.
- Un **serviciu** este ce programează pacientul: o consultație, o investigație
  sau o intervenție. Aparține unei specializări, tratează una sau mai multe
  afecțiuni și poate declara explicit medicii care îl asigură. Dacă nu îi
  declară, pagina afișează toți medicii specializării.

**Regula relațiilor bidirecționale.** O relație se declară o singură dată în
CMS, dar se citește din ambele capete. Dacă serviciul „Biopsia fusion" declară
că tratează „Cancerul de prostată", pagina afecțiunii îl afișează automat, chiar
dacă afecțiunea nu l-a listat ea. Helperele care fac asta sunt în
`src/lib/content.ts` (`getServiciiForAfectiune`, `getAfectiuniForServiciu`,
`getMediciForServiciu`, …). Așa nu există relații „pe jumătate", oricine ar
edita din Tina.

**Legătura cu articolele are și un mecanism automat.** Un articol poate declara
explicit afecțiunile și serviciile de care ține. Dacă nu o face,
`getArticoleForEntity()` caută potriviri după titlu și cuvinte-cheie, reduse la
rădăcini de 6 litere („prostata" → „prostat"), ca să treacă peste flexiunea din
română. Rezultatul: relația funcționează din prima, fără ca editorul să fie
nevoit să eticheteze retroactiv cele ~30 de articole existente.

⚠️ **Detaliu tehnic important.** Tina salvează referințele ca *path complet*
(`src/content/specializari/nefrologie.mdx`), iar Astro așteaptă *id-ul*
(`nefrologie`). Normalizarea se face în `src/content.config.ts`, în helperele
`refTo()` și `refListTo()` — acceptă ambele forme, deci merg și fișierele
scrise manual, și cele scrise de Tina.

De asemenea, câmpurile `reference` nu suportă `list: true` în interfața Tina.
Pentru specializările unui medic folosim o listă de obiecte cu câte o referință
(`{ ref: '...' }`), iar `refListTo()` o aplatizează la citire.

---

## 4bis. Catalogul medical și structura fixă a paginilor

### De ce intervențiile nu sunt o colecție separată

O consultație, o ecografie și o biopsie sunt același lucru din perspectiva
pacientului: **ceva ce programează**. Diferă prin cât de mult protocol au (o
consultație nu are anestezie, pași și recuperare; o biopsie are) și prin
eticheta sub care apar.

Prima variantă a acestui catalog le ținea separat — `interventii` și `servicii`
— și a ieșit prost: biopsia fusion, ESWL și cistoscopia existau de două ori, ca
două documente care trebuiau ținute în sincron manual. Acum există o singură
colecție, `servicii`, cu un câmp `type` (Consultație / Investigație / Analize /
Procedură / **Intervenție**), care este în același timp eticheta din catalog și
filtrul din pagina `/servicii`.

Consecință practică: câmpurile de protocol (`anesthesia`, `timeline`,
`aftercare`, `risks`) rămân goale la o consultație, iar secțiunile lor pur și
simplu nu se randează. Nimic nu trebuie duplicat.

Vechile URL-uri `/interventii` și `/interventii/<slug>` redirecționează 301
către `/servicii`, respectiv `/servicii/<slug>` (`astro.config.mjs`).

### Prețuri

Fiecare serviciu are un câmp `price` cu `from`, `to`, `currency` și `note`:

| Completat în CMS | Afișat |
| --- | --- |
| `from: 350` | `350 lei` |
| `from: 1500`, `to: 2500` | `1.500–2.500 lei` |
| nimic | `La cerere` |

Formatarea e într-un singur loc, `formatPrice()` din `src/lib/utils.ts`. Chip-ul
de preț apare pe carduri **doar dacă prețul e completat** — „La cerere" pe toate
cardurile ar fi doar zgomot. Pe pagina serviciului, prețul este primul câmp din
bara de date esențiale, pentru că e prima întrebare a pacientului.

### Catalogul (`/afecțiuni`, `/servicii`)

Ambele pagini folosesc aceeași componentă, `components/catalog/CatalogBrowser.astro`:
categorii în stânga (expandabile), filtre pe etichetă deasupra grilei (doar la
servicii), căutare după cuvinte-cheie, carduri în dreapta.

- **Categoriile sunt specializările.** Nu am introdus o colecție separată de
  categorii: gruparea după specializare este și taxonomie, și relație.
- **Filtrarea se face în browser**, fără request suplimentar: toate intrările
  sunt deja în HTML, scriptul doar le ascunde.
- **Căutarea acoperă și conținut care nu încape pe card**: `keywords`
  (sinonime populare — „pietre la rinichi", „nu pot dormi"), simptome,
  indicații și întrebările frecvente, puse într-un atribut `data-haystack`.
- **Starea se reflectă în URL** (`/servicii?categorie=urologie&tip=interventie`),
  deci meniul din header poate trimite direct în catalogul filtrat.
- **O căutare nouă anulează categoria selectată.** Altfel, o categorie deschisă
  mai devreme ar ascunde tăcut rezultate din alte specializări.

⚠️ **Capcană rezolvată, de reținut.** Selecția categoriei ascultă `click`-ul pe
`<summary>`, nu evenimentul `toggle` al lui `<details>`. Motivul: `toggle` se
declanșează **asincron**, deci se declanșa și când scriptul deschidea singur
categoriile în timpul unei căutări — iar handlerul interpreta asta drept „a ales
utilizatorul categoria" și filtra rezultatele. Efectul vizibil era o căutare
care „nu funcționează": scriai „prostata" și rămâneau doar rezultatele din
ultima categorie deschisă automat.

### Structura paginilor

Paginile de afecțiune și de serviciu au **aceleași secțiuni, în aceeași
ordine**, oricare ar fi subiectul. Secțiunile fără conținut sunt sărite, iar
fundalul alternează automat între cele rămase (`toneOf()` în fiecare pagină).
Din aceeași listă se generează și sub-navigația lipicioasă din capul paginii,
care marchează secțiunea în care te afli (`aria-current="true"`) pe măsură ce
derulezi. Secțiunea curentă e ultima al cărei început a trecut de linia de sub
bară — calcul din poziții, nu din raportul de intersecție al unui
`IntersectionObserver`: secțiunile au înălțimi foarte diferite, iar una scurtă
(„Beneficii") ar pierde mereu în fața uneia lungi („Cum decurge"). Pe ecrane
înguste, elementul activ e adus în vizor prin defilarea orizontală a barei.

| Afecțiune | Serviciu / intervenție |
| --- | --- |
| Despre | Despre |
| Simptome | Ce include |
| Cauze | Când este recomandat |
| Factori de risc | Afecțiuni tratate |
| Cum se pune diagnosticul | Contraindicații |
| Cum se tratează | Cum te pregătești |
| Intervenții care o tratează | **Cum decurge** (timeline numerotat) |
| Consultații și investigații | După intervenție |
| Când mergi la medic | Beneficii |
| Prevenție | Riscuri |
| Întrebări frecvente | Întrebări frecvente |
| Medici · Specializare · Noutăți · Afecțiuni înrudite | Medici · Specializare · Noutăți · Alternative |

Blocurile sunt componente reutilizabile în `components/entity/`: `PointsSection`,
`NamedListSection`, `Timeline`, `FaqSection`, `KeyFacts`, `AnchorNav`,
`SpecialityCallout`, `RelatedCards`, `RelatedArticles`. Aceleași blocuri
construiesc și paginile de proiect european (§4quater).

Fiecare pagină emite și JSON-LD potrivit tipului (`MedicalCondition`,
`MedicalProcedure` / `MedicalTest`, `FAQPage`, `BreadcrumbList`) — vezi
`src/lib/schema.ts`.

### Carduri clicabile pe toată suprafața

Toate cardurile din site (medici, articole, catalog, proiecte, intervenții
promovate) sunt clicabile integral, nu doar pe titlu. Mecanismul e o pereche de
utilitare din `global.css`:

- `card-surface` pe container — doar `position: relative`;
- `card-link` pe linkul principal — un `::after` întins peste tot containerul.

**Se folosesc împreună, întotdeauna.** Fără `card-surface`, overlay-ul se
raportează la pagină și acoperă tot ecranul: linkul cardului fură clickurile din
header, din firul de navigare și din filtre. Exact asta s-a întâmplat pe
`/noutati`, unde `BlogCard` avea `card-link` fără container poziționat — filtrele
de categorie și breadcrumb-ul păreau „stricate", deși erau linkuri normale.
De aceea perechea are nume proprii, în loc de `relative` + `after:inset-0`
scrise de mână la fiecare card.

Orice alt link din interiorul unui card trebuie să primească `relative z-10`,
altfel rămâne sub overlay. Unde nu e nevoie de un al doilea link (ex. „Detalii
proiect"), textul rămâne `<span>`: cardul e deja linkul.

### Firul de navigare (breadcrumbs)

Toate paginile în afară de prima au fir de navigare, printr-o singură
componentă: `components/ui/Breadcrumbs.astro`.

- **„Acasă" nu se scrie niciodată în pagini** — îl adaugă componenta. Paginile
  transmit doar restul drumului: `[{ label: 'Servicii', href: '/servicii' }, { label: title }]`.
- **Ultimul element se randează fără link**, cu `aria-current="page"`, chiar
  dacă primește un `href`. Așa nu poate apărea un link către pagina curentă.
- **Componenta emite și JSON-LD-ul `BreadcrumbList`**, din aceeași listă din
  care randează marcajul vizibil. Alternativa — schema construită separat, în
  fiecare pagină, și trimisă în `<head>` prin `BaseLayout` — a existat inițial
  și e exact felul în care cele două ajung să spună lucruri diferite după
  câteva editări. JSON-LD-ul stă în `<body>`, ceea ce este valid și acceptat de
  Google.

Firul intră în pagină prin componenta de titlu, nu direct:

| Componentă | Folosită de |
| --- | --- |
| `sections/PageTitleHeader.astro` | listări, pagini statice, contact, articole, categorii |
| `entity/EntityHeader.astro` | afecțiuni, servicii, proiecte europene |
| `sections/DoctorHero.astro` | paginile de medic |

Pe pagina unui articol, firul include și categoria
(`Acasă › Noutăți › Urologie › <titlu>`), pentru că `/noutati/categorie/<slug>`
este o pagină reală, nu o etichetă decorativă.

### Offsetul ancorelor

Header-ul este lipicios, iar paginile de catalog mai adaugă o bară de
sub-navigație tot lipicioasă. Ca ancorele să nu ajungă sub ele, ambele își
publică înălțimea reală în `--header-h` / `--subnav-h` (`ResizeObserver`), iar
`scroll-padding-top` din `global.css` le adună. Fără valori magice care se strică
la prima schimbare de font sau de breakpoint.

---

## 4ter. Căutarea

Căutarea **nu este o pagină**, ci o funcție disponibilă în header, pe orice
pagină (`components/layout/SearchBox.astro`): butonul — doar iconița de lupă,
fără etichetă — deschide un panou cu sugestii live. Enter duce la `/rezultate-cautare`, singurul loc unde căutarea are
pagină proprie — cu filtre pe tip de rezultat.

Ambele consumă `/cautare-index.json`, generat la build din toate colecțiile
(specializări, afecțiuni, servicii, medici, articole, proiecte, pagini), cu
`keywords` incluse. Serviciile intră în index cu tipul lor real — „Intervenție"
sau „Serviciu" — ca filtrul din pagina de rezultate să fie util. Rezultatele sunt ordonate după relevanță:
potrivirile din titlu înaintea celor din descriere sau din cuvinte-cheie.

Vechiul URL `/cautare` redirecționează către `/rezultate-cautare` (`astro.config.mjs`).

---

## 4quater. Proiectele europene

Fiecare proiect are pagină proprie, construită din aceleași blocuri ca restul
catalogului: fir de navigare, etichetă de stadiu, bara de date de identificare,
descriere, obiective, rezultate, galerie și **noutăți**.

- **Stadiul** (`status`) este `in-derulare` sau `incheiat`. Se afișează ca
  etichetă pe card și în capul paginii și, în listă, grupează proiectele în
  „Proiecte în derulare" și „Proiecte încheiate".
- **Datele de identificare** (cod SMIS, număr de contract, perioadă de
  implementare, beneficiar, program, valoare totală și nerambursabilă) au
  câmpuri proprii, nu o listă liberă — sunt obligatorii pentru respectarea
  regulilor de vizibilitate a finanțării. `details` a rămas, pentru orice câmp
  în plus.
- **Noutățile** se leagă din articol (câmpul „Proiecte europene legate") sau de
  pe proiect (`articles`). Ca peste tot, relația se citește din ambele capete.
- Nota obligatorie („Conținutul acestui material nu reprezintă în mod
  obligatoriu poziția oficială a Uniunii Europene…") apare și în listă, și pe
  fiecare pagină de proiect.

---

## 4quinquies. Prima pagină și pagina de noutăți

### Ritmul vizual al paginilor lungi

Prima pagină era un șir de secțiuni albe și gri, fiecare cu o grilă de carduri —
corect, dar monoton. Blocurile de mai jos există ca să rupă acel ritm; fiecare
are altă formă, nu doar alt conținut:

| Bloc | Formă | Suprafață |
| --- | --- | --- |
| `ExploreBand` | trei drumuri către catalog | `brand-50` — a treia suprafață, între alb și gri |
| `HighlightServices` | carduri late, cu datele esențiale în coloană | gri |
| `WhyBand` | iconiță + text, fără carduri | **albastru închis** |
| `StepsBand` | pași numerotați, pe orizontală | alb |
| `FaqSection` | acordeon (refolosit din catalog) | gri |

Toate textele lor stau în `settings/home.json` și sunt editabile din Tina, ca
restul primei pagini. `HighlightServices` primește și lista intervențiilor
promovate — dacă e goală, ia primele din catalog.

### `/noutati`

- **Articolul promovat** (`featured: true`, cel mai recent) deschide pagina ca
  un card lat, cu imagine. Următoarele promovate rămân în „Recomandate".
- **Filtrele sunt linkuri**, nu butoane care ascund carduri: fiecare categorie
  are deja pagină proprie (`/noutati/categorie/<slug>`), deci filtrul rămâne
  partajabil, indexabil și funcționează fără JavaScript. Fiecare filtru arată
  numărul de articole, iar cel activ e marcat cu `aria-current="page"`.
- Aceleași filtre apar și pe pagina de categorie, cu starea mutată corespunzător.

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

### ⚠️ Conținutul medical din catalog trebuie validat înainte de lansare

Cele 16 afecțiuni și 15 servicii (dintre care 7 intervenții) din
`src/content/afectiuni` și `src/content/servicii` au fost **redactate în acest
repo**, nu preluate din site-ul vechi. Sunt scrise pornind de la articolele
existente și de la serviciile declarate pe fiecare specializare, cu formulări
prudente și fără promisiuni de rezultat.

Rămân, însă, texte medicale publicate în numele unei clinici reale. Înainte de
lansare, **fiecare pagină trebuie citită și asumată de medicul specialității
respective**, cu atenție specială la:

- lista de intervenții — trebuie să conțină exact ce se efectuează în clinică,
  nu ce se efectuează în general în specialitate;
- **prețurile**, care momentan nu sunt completate deloc: câmpul `price` există
  pe fiecare serviciu, dar e gol, iar pagina afișează „La cerere". Prețurile nu
  au fost inventate intenționat — o cifră greșită pe site-ul unei clinici e mai
  rea decât lipsa ei;
- datele esențiale (durată, anestezie, regim, recuperare) și pașii din timeline,
  care trebuie să reflecte protocolul real al clinicii;
- decontarea CNAS (`cnas: true/false`) pentru fiecare serviciu;
- medicii asociați fiecărei intervenții (`doctors`) — lăsat gol, câmpul atribuie
  intervenția tuturor medicilor specializării.

Corecturile se pot face integral din `/admin`, fără intervenție în cod.

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
| `/interventii/` (URL intern, versiune anterioară) | `/servicii` |
| `/interventii/<slug>` (URL intern, versiune anterioară) | `/servicii/<slug>` |
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
- [ ] **Validarea medicală a catalogului** (afecțiuni, servicii, intervenții) —
      vezi avertismentul din §8. Blocant pentru lansare.
- [ ] **Prețurile serviciilor** — câmpul `price` există pe fiecare serviciu, dar
      este gol; până la completare, pagina afișează „La cerere". Blocant pentru
      lansare, dacă se dorește afișarea prețurilor.
- [ ] **Al doilea proiect european** — `proiect-nou-sablon` este o intrare-șablon
      marcată ciornă (nu apare pe site-ul public). Se completează cu datele reale
      ale următorului proiect, apoi se debifează „Ciornă". Datele de identificare
      ale proiectului existent (cod SMIS, contract, valoare, perioadă) sunt tot
      `DE COMPLETAT ÎN CMS`.
- [ ] Redirect-uri 301 și pentru paginile de catalog, dacă site-ul vechi are
      URL-uri echivalente pentru servicii.
- [ ] Fotografii pentru paginile de servicii și de proiecte (câmpul `cover`
      există deja pe ambele).
- [ ] Etichetarea articolelor existente cu afecțiunile, serviciile și proiectele
      de care țin — momentan legătura se face automat, după cuvinte-cheie (§4).
