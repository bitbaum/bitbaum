# bitbaum Parent Site Deployment

## What's Built

- **Static site:** `site/index.html` — near-black field, huge type, minimal chrome
- **Companies registry:** `site/companies.json` — single source of truth for all ventures
- **Logo assets:** `assets/avatar.svg` — square mark for GitHub org avatar
- **Logo mark:** `site/logo-mark.svg` — mark displayed on the site

## Design

Inspired by x.ai's restraint: near-black background, one type family, display-size type, almost no chrome. The venture list IS the page. No hero images, no feature columns, no badges.

Every documented venture appears on the page with its kind shown as quiet type (company, early, upcoming, client, internal). Hover reveals the URL with slow, subtle motion. No JavaScript framework — vanilla JS reads the JSON, CSS handles all interaction.

## How It Works

The site reads `companies.json` and displays **all** entries. The `kind` field determines how each venture is labeled, but nothing is filtered or hidden. The `listed` field is preserved in the registry but currently unused by the page — the full catalog is shown.

Changing a venture's status, URL, kind, or tagline is a data edit in `companies.json`, not a layout change.

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
