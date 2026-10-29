# Aan te leveren door Cyril

Alles hieronder staat op de site als gele **TODO**-markering. Praktijkgegevens vul je in
`content/praktijk.json` in, daarna `node build.mjs`.

## Praktijkgegevens (`content/praktijk.json`)
- [ ] `plaats`: plaatsnaam van de praktijk
- [ ] `adres` + `postcode`
- [ ] `telefoon` (formaat `+31...`) en `telefoonWeergave` (bijv. `06 12 34 56 78`)
- [ ] `whatsapp`: nummer voor de afspraakflow (formaat `31612345678`)
- [ ] `email`
- [ ] `kvk`
- [ ] `routeUrl`: Google Maps-link naar de praktijk
- [ ] `openingstijden`: lijst, bijv. `[{"label": "Maandag", "schemaDag": "Monday", "open": "09:00", "dicht": "17:00"}]`
- [ ] `consultDuurMinuten` en `vervolgDuurMinuten`
- [ ] `gemiddeldAantalBehandelingen` (alleen als Cyril dit zelf zo wil noemen)
- [ ] `tarieven.eersteConsult` en `tarieven.vervolgconsult` (bijv. `€ 85`)
- [ ] `aangeslotenBij`: beroepsvereniging(en) en registraties (bijv. NRO, RBCZ)
- [ ] `annuleren`: annuleringsregeling
- [ ] `domein`: het echte domein (nu aangenomen: `https://www.osteopathie-entjes.nl`), ook in `robots.txt` en `partials/head.html` via `{{domein}}`

## Teksten
- [ ] Over Cyril: opleiding, ervaring, registraties (`partials/todo-cyril.html`)
- [ ] Over Cyril: persoonlijke intro van 3 tot 5 zinnen (`src/over-cyril.html`)
- [ ] Tarieven: betaalwijze en nota bevestigen (`src/tarieven.html`)
- [ ] Behandelingen: biedt Cyril iets voor specifieke doelgroepen (kinderen/baby's, sporters, zwangeren)? Dan komt er een filter (`src/behandelingen.html`)
- [ ] FAQ: duur van consulten en beroepsvereniging (`content/faq.json`, velden `todo`)
- [ ] Privacyverklaring laten controleren; bewaartermijn en dossiersoftware invullen (`src/privacy.html`)
- [ ] Alle klachtenteksten (`content/zones.json`) laten nalezen door Cyril

## Reviews (`content/reviews.json`)
- [ ] Echte reviews toevoegen (met toestemming). Tot dan staan er VOORBEELD-kaarten.
- [ ] Zet `toonVoorbeeld` op `false` voor livegang als er nog geen echte reviews zijn: dan verdwijnt de sectie.

## Beeld
- [ ] Foto behandeling, 4:5 (`assets/img/hero-behandeling-foto-volgt.svg` vervangen)
- [ ] Portret Cyril, 4:5 (`assets/img/portret-cyril-foto-volgt.svg` vervangen)
- [ ] Definitief logo (`assets/logo.svg` vervangen)
