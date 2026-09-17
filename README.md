# Lev Fedotovskii — personal site

A deliberately minimal personal landing page.

The visual background is generated entirely in the browser: thousands of small monospace glyphs orbit a dark center to create an animated ASCII accretion-disk / gravitational-field effect. No image or video asset is required.

## Files

```text
index.html
style.css
ascii-space.js
site.js
.nojekyll
```

## Current sections

- introduction;
- direct links to current projects;
- GitHub profile;
- RU / EN switch.

## Current projects

- **Setka / Сетка** — university planner;
- **FAILED Calculator** — mathematical experiment with degrading memory.
- **Zeitgeist** — codename for a simulation-sandbox game currently in development; source is not public yet.

The page is intentionally small so it can grow later without redesigning the entire site.

## Contact

- GitHub: `FedotovskiiLev`
- Telegram: `@haltontDev`

## Mobile presentation

The phone layout uses a reduced particle budget and a denser ASCII inner accretion stream, so the black-hole silhouette stays readable on small screens without turning the page into a battery benchmark. Hero actions stay compact and wrap naturally instead of becoming full-width blocks.

### v1.5 mobile visual pass

Desktop rendering is unchanged. On phones the black hole is flatter, moved slightly inward, and gains two broken spiral ASCII lanes so the accretion disk remains legible instead of collapsing into a circular cluster.

### v1.6 mobile depth pass

The phone-only accretion lanes are now split into back and front passes, so one side goes behind the black hole and the other crosses in front of it. Animation speed was also increased to avoid a static-looking ring.
