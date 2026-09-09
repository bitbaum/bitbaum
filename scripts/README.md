# Scripts

Maintenance and validation scripts for the repository.

## check-stale-claims.js

Validates documentation files for forbidden stale claims that contradict the organizational register.

**Usage:**

```bash
node scripts/check-stale-claims.js
```

**What it checks:**

- ❌ "product studio" as the organizational definition
- ❌ "incorporation pending" or "bitbaum AG"
- ❌ GitHub Pages (bitbaum.github.io) mentioned as a host
- ❌ Founder's legal name

**Exit codes:**

- `0` - No violations found
- `1` - Violations found (with detailed report)

**Run before committing** to ensure documentation stays consistent with `state/org.json`.

**Dependencies:**

```bash
npm install glob
```

Or if no package.json exists yet:

```bash
node -e "require('fs').writeFileSync('package.json', JSON.stringify({dependencies: {glob: '^10.0.0'}}, null, 2))"
npm install
```
