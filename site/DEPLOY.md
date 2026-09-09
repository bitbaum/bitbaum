# bitbaum Parent Site Deployment

## What's Built

- **Static site:** `site/index.html` — full viewport, near-black, huge type, hover-revealed details
- **Companies registry:** `site/companies.json` — single source of truth
- **Build script:** `site/generate.mjs` — reads registry, writes HTML with ventures baked in
- **Logo assets:** `assets/avatar.{svg,png}` — square mark for GitHub org

## Design

Full viewport, near-black field, huge type. No centered column, no brochure. The venture list IS the page.

- Small wordmark
- One line of huge type as the statement
- Each venture is display-size name
- Description and URL appear on hover/focus only
- No "loading" state — first paint is complete
- No kind labels repeating down the page
- Pure CSS interaction, minimal JavaScript

## Build Process

**The HTML is generated from companies.json, not fetched at runtime.**

After editing `companies.json`:

```bash
cd site
node generate.mjs
```

This writes `index.html` with all ventures baked in. The first paint shows everything.

## Registry

**26 ventures from projects/*.md plus client work:**

**Live projects:** OrangeCat, FleetCrown, kivvi, vitareba, datacat, printcraft, petvity, surf-your-life, reparaturbonus-zh, aoz-housing, evig

**Client work:** S.Ink, Annushka

**Early:** Solon, hamstercheek, truthseeker, biaslens

**Upcoming:** hirn.li, botsmann, sbb-lost-found, diplodoctor, Causius

**Internal:** ai-forms, ivy-portal, prime-tower, revamp-info

Changing a venture's data is a registry edit + regenerate.

## Test Locally

```bash
cd site
python3 -m http.server 8000
# Open http://localhost:8000 in browser
```

Or with Node:

```bash
cd site
npx serve
```

## Deploy to bitbaum.orangecat.ch

### Prerequisites

The site should be served alongside other orangecat.ch subdomains using Caddy (matching the pattern used by fleetcrown.orangecat.ch, solon.orangecat.ch, etc.).

### Caddy Configuration

Add to your Caddyfile:

```caddy
bitbaum.orangecat.ch {
    root * /path/to/bitbaum/site
    file_server
    encode gzip
}
```

### Deploy Steps

1. Copy the `site/` directory to the server
2. Update the Caddyfile with the correct path
3. Reload Caddy: `sudo systemctl reload caddy`
4. Verify: `curl -I https://bitbaum.orangecat.ch`

## Updating the Site

### Add a New Company

Edit `site/companies.json`:

```json
{
  "id": "newcompany",
  "name": "NewCompany",
  "tagline": "What it does in one line",
  "kind": "company",
  "listed": true,
  "url": "https://newcompany.ch",
  "door": "own-domain"
}
```

### Change a Company's Status

To hide a company temporarily:

```json
"listed": false
```

To mark a company as early-stage (not shown publicly):

```json
"kind": "early"
```

### Update a Company's URL

When a company moves from subdomain to own domain:

```json
"url": "https://newcompany.ch",
"door": "own-domain"
```

No HTML changes needed — the site reads the data and updates automatically.

## Files

```
site/
├── index.html          # Parent site layout
├── companies.json      # Companies registry (SSOT)
├── logo-mark.svg       # bitbaum mark
└── DEPLOY.md           # This file

assets/
├── avatar.svg          # Square avatar for GitHub org (SVG)
├── avatar.png          # Square avatar for GitHub org (PNG, 512x512)
├── logo.svg            # Full logo with wordmark
├── logo-mark.svg       # Mark only
└── logo-white.svg      # White version for dark backgrounds
```

## Notes

- Static HTML, no build step, no framework
- Works without JavaScript (progressive enhancement)
- Semantic HTML, accessible
- Dark mode via `prefers-color-scheme`
- The registry tracks all ventures (companies, early-stage, upcoming) but only displays `kind=company` and `listed=true`
