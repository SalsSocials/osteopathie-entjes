# Osteopathie Entjes

Statische site (HTML/CSS/JS, geen framework, geen CMS) voor de osteopathiepraktijk van Cyril Entjes.

## Werken aan de site

```bash
node build.mjs          # bouwt alle pagina's, sitemap.xml en llms.txt
node serve.mjs          # lokaal bekijken op http://localhost:4321 (schone URL's, net als Vercel)
node scripts/check.mjs  # screenshots 1440/390 px, overloop, consolefouten, interne links
```

Bewerk nooit de HTML in de root: die wordt overschreven. Bewerk `src/`, `partials/` of `content/`
en draai `node build.mjs`. De gebouwde HTML wordt wel gecommit (Vercel serveert die direct).

## Mappen

| Map / bestand | Wat |
|---|---|
| `src/*.html` | Inhoud per pagina, met bovenaan een `<!--meta {...} -->`-blok (titel, beschrijving, scripts, schema) |
| `partials/` | Gedeelde stukken: head, header, footer, afspraakflow, CTA-band |
| `content/praktijk.json` | Alle praktijkgegevens. `null` = nog niet bekend, de site toont dan een TODO |
| `content/zones.json` | Klachtgebieden: voeden de klachtenwijzer, de behandelingenpagina en het menu |
| `content/faq.json` | Veelgestelde vragen: voeden de accordeon en het FAQPage-schema |
| `content/reviews.json` | Echte reviews, of VOORBEELD-kaarten zolang die er niet zijn |
| `assets/css/site.css` | Alle stijl. Kleuren en type staan bovenaan in `:root` |
| `assets/js/` | `site.js` (menu, tracking), `home.js` (animaties, klachtenwijzer), `afspraak.js` (flow), `vendor/` (GSAP, Lenis) |
| `assets/logo.svg` | Tijdelijk woordmerk |
| `assets/img/` | Beelden (nu placeholders) |

## Vervangen

- **Logo:** vervang `assets/logo.svg` en draai `node build.mjs`. Het logo wordt inline in elke pagina gezet,
  zodat de kleuren uit `--logo-mark` en `--logo-ink` komen. Werk ook `assets/favicon.svg` en `assets/og.png` bij.
- **Foto's:** zet een WebP (of AVIF) in `assets/img/` met een beschrijvende naam, bijv.
  `behandeling-praktijk.webp`, en pas `src` (en zo nodig `width`/`height`) aan in `src/index.html`
  of `src/over-cyril.html`. Verhouding 4:5. Houd de foto onder ~150 kB.
- **Teksten:** paginatekst staat in `src/`, klachtteksten in `content/zones.json`, vragen in `content/faq.json`.
- **Kleuren:** pas de variabelen bovenaan `assets/css/site.css` aan. Controleer contrast (minimaal 4,5:1 voor tekst).
- **Afspraakflow vervangen door boekingssysteem:** vervang het `<form>` in `partials/afspraak.html`
  door een knop naar de boekingslink en haal `"afspraak"` uit de `scripts` van `src/index.html` en `src/contact.html`.

## Keuzes

- **Lettertypen:** *Bodoni Moda* voor koppen: elegant en klassiek zoals de serif uit de sfeerreferentie, met
  optische maten zodat hij groot verfijnd en klein leesbaar blijft. *Hanken Grotesk* voor tekst: schoon, warm en
  goed leesbaar op telefoons. Beide self-hosted als woff2 met `font-display: swap`.
- **Kleur:** olijf `#5E6B3A` (5,0:1 op crème), donker olijf `#3E4724` voor knoppen en koppen (8,9:1), crème
  `#F6F1E7`, salie en taupe voor vlakken. Eén donkere sectie (Je eerste bezoek) als kleurblok.
- **Idee:** "de lijn die losser wordt". In de hero tekent een ruggengraat zich stijf en ontspant dan tot een
  natuurlijke S; tijdens het scrollen beweegt hij mee. Dezelfde lijn zit in het logo en de klachtenwijzer.
- **Beweging:** GSAP + ScrollTrigger + Lenis alleen op de homepage. Elders CSS scroll-driven animaties
  (`animation-timeline: view()`), die buiten de hoofdthread draaien. Bij `prefers-reduced-motion` staat alles stil.
- **Geen Three.js:** voegde niets toe aan deze site en maakt hem zwaarder.
- **Schone URL's:** `vercel.json` met `cleanUrls`; alle links, canonicals en de sitemap gebruiken `/contact` en niet `/contact.html`.
- **Tracking:** alleen `dataLayer`-events, geen scripts van derden: `afspraak_klik`, `bel_klik`, `whatsapp_klik`,
  `klachtenwijzer_zone`, `faq_open`.

## Beelden

| Bestand | Soort |
|---|---|
| `assets/img/hero-behandeling-foto-volgt.svg` | Placeholder (zelf getekend), te vervangen door praktijkfoto |
| `assets/img/portret-cyril-foto-volgt.svg` | Placeholder (zelf getekend), te vervangen door portret |
| `assets/og.png` | Deelafbeelding, gemaakt uit de eigen huisstijl (geen fotomateriaal) |

Er zijn **geen gegenereerde (AI-)beelden** gebruikt.

## Nog aan te leveren

Zie [TODO.md](TODO.md) voor de volledige lijst.

## Deploy

Niet automatisch. Deployen naar Vercel gebeurt alleen op verzoek.
