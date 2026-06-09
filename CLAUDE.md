# Dreamy Shots — Claude Code Guide

## Project overview

Static site for **Dreamy Shots**, an event photography business run by Wency. She photographs community-focused events: meetups, user groups, panels, install fests, workshops, corporate gatherings. NOT weddings, galas, or conferences.

Built from the spaceclub-template (Eleventy), but completely redesigned. Cinematic, warm, atmospheric, human tone. No em dashes anywhere in user-visible content.

---

## Stack

| Layer | Tool |
|---|---|
| SSG | Eleventy (11ty) v3.1.x, Nunjucks templating |
| CSS framework | Bootstrap 5.3.3 (dark/light via `data-bs-theme`) |
| Icons | Bootstrap Icons 1.11.3 (CDN) |
| Search | Pagefind v1.5.2 (indexed at build time) |
| Forms | Netlify Forms with honeypot |
| Deployment | Netlify (publish dir: `_site`) |
| Font | Ubuntu Sans Variable (local, `src/assets/fonts/`) |

---

## Commands

```bash
# Dev server (no search, live reload)
npm start
# → http://localhost:8080

# Production build (includes Pagefind index)
npm run build
```

`npm run build` runs: `npx @11ty/eleventy && npx pagefind --site _site`

Search only works after a full build — it won't work in `npm start` dev mode.

---

## File structure

```
src/
  _data/
    site.json          # Global: name, url, bookingUrl, description, favicon
    navbar.json        # Nav links (title, href, footer, bookingCta flags)
    global.js          # (legacy spaceclub data, mostly unused)
  _includes/
    layouts/
      base.njk          # HTML shell for inner pages (book, contact, 404, etc.)
      index.njk         # Standalone home page (hero + portfolio grid + about)
      gallery-list.njk  # /gallery/ listing: 12 preview images per event
      gallery-event.njk # Individual event shoot page with lightbox
      post.njk          # (legacy, unused)
      event.njk         # (legacy, unused)
    partials/
      navbar.njk        # Nav + search modal
      footer.njk        # Footer links + booking CTA
      gallery.njk       # Lightbox grid partial (used in gallery-event.njk)
      gallery-all.njk   # (legacy)
      form.njk          # (legacy)
      btn.njk           # (legacy)
  assets/
    css/styles.css      # All custom styles (CSS custom properties, no Sass)
    js/app.js           # Theme toggle + mobile nav
    js/search.js        # Pagefind search modal logic
    images/
      ds-logo.svg       # Navbar camera2 icon — gold on black circle (favicon too)
      wency.webp        # About section portrait (960x1280)
      dreamyshotspreview.webp  # OG/Twitter card image
  gallery/
    gallery.json        # Sets layout: gallery-event.njk for all gallery pages
    <event-slug>.md     # One file per shoot event
  index.md              # Home page (layout: index.njk)
  gallery.md            # Portfolio listing (layout: gallery-list.njk, permalink: /gallery/)
  book.md               # Book page (layout: base.njk)
  contact.md            # Contact page with Netlify form (layout: base.njk)
  404.md                # 404 page (layout: base.njk)
```

---

## Site data files

**`src/_data/site.json`** — edit this to update global site info:
```json
{
  "name": "Dreamy Shots",
  "url": "https://shots.dreamy.org",
  "bookingUrl": "https://bookdreamyshots.talkingsites.org",
  "description": "Event photography that captures the feeling of being there.",
  "favicon": "/assets/images/ds-logo.svg"
}
```

**`src/_data/navbar.json`** — controls nav and footer links:
- `footer: true` — appears in footer
- `bookingCta: true` — renders as the glowing animated booking button (links externally to `site.bookingUrl`)

---

## Adding a new gallery event

1. Create `src/gallery/<event-slug>.md`:

```markdown
---
title: "Linux Users Group — March 2026"
description: "Monthly meetup at the city library."
date: 2026-03-15
gallery: lug-march-2026
eventUrl: https://example.org/lug
---
```

2. Create image folder: `src/assets/images/gallery/lug-march-2026/`
3. Add images (`.webp` preferred). One file must contain `thumbnail` in its filename — that becomes the portfolio card preview.

The `gallery` frontmatter key matches the folder name under `assets/images/gallery/`. Eleventy scans it automatically via the `galleries.scan()` global data function in `.eleventy.js`.

---

## Design tokens (CSS custom properties)

Defined in `src/assets/css/styles.css` on `:root` (dark, default) and overridden on `html[data-bs-theme="light"]`:

| Token | Dark value | Purpose |
|---|---|---|
| `--ds-bg` | `#0f0d0a` | Page background |
| `--ds-surface` | `#1c1814` | Card/nav surfaces |
| `--ds-text` | `#ede8e0` | Body text |
| `--ds-text-muted` | `#7a6e62` | Secondary/meta text |
| `--ds-accent` | `#c8935a` | Gold accent (CTAs, highlights) |
| `--ds-accent-dark` | `#a87040` | Hover state for accent |

---

## Theme (dark/light)

- Default: dark
- Persisted to `localStorage` under key `ds-theme`
- Applied via `data-bs-theme` on `<html>`
- Anti-FOUC: every layout has an inline `<script>` in `<head>` that reads localStorage and sets `data-bs-theme` before CSS loads
- Toggle logic lives in `src/assets/js/app.js`

---

## Search

Pagefind indexes at build time. Pages opt in via `data-pagefind-body` on their `<main>` element.

**Where search metadata comes from:** Pagefind auto-detects the page title from the `<title>` tag and description from `<meta name="description">` — both of which are populated from the page's own `.md` frontmatter (`title` and `description` fields). So to control what a page shows in search results, edit those frontmatter fields.

Page weight for search ranking is set with `data-pagefind-weight="10"` on key headings (currently on the `<h1>` in `book.md`).

Search modal is in `navbar.njk` and driven by `search.js`.

---

## Netlify forms

`contact.md` has a Netlify form. Required attributes: `data-netlify="true"`, `netlify-honeypot="bot-field"`. The honeypot field is:

```html
<p hidden aria-hidden="true">
  <label>Do not fill this in: <input name="bot-field" tabindex="-1" autocomplete="off"/></label>
</p>
```

---

## Conventions

- No em dashes (`—`) anywhere in user-visible content. Use commas, colons, or rephrase.
- No wedding/gala/conference copy. Event focus: meetups, panels, user groups, community gatherings, corporate events.
- Images: convert to `.webp` before adding to `src/assets/images/`. Use ImageMagick: `convert input.jpg -quality 82 output.webp`
- CSS class prefix: `ds-` for all custom classes (never modify Bootstrap's own classes)
- Layouts that are full-page (index, gallery-list, gallery-event) are standalone — they do NOT extend base.njk, they include navbar/footer partials directly
- Legacy spaceclub partials (event.njk, post.njk, form.njk, etc.) are unused — don't touch them
