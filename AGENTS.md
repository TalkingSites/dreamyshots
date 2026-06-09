# AGENTS.md — Dreamy Shots

Guidelines for AI agents working in this repo. Read CLAUDE.md first for project overview and stack.

---

## How layouts work

There are two layout patterns — do not confuse them:

**Standalone layouts** (own full HTML document, include partials themselves):
- `index.njk` — home page
- `gallery-list.njk` — portfolio listing at `/gallery/`
- `gallery-event.njk` — individual shoot event page

**Shell layout** (`base.njk` wraps page content via `{{ content | safe }}`):
- Used by `book.md`, `contact.md`, `404.md`, and any new inner pages

When creating a new page, use `layout: base.njk` in frontmatter unless it's a special full-bleed page that needs its own layout.

---

## Nunjucks gotchas

- Filters chain left-to-right: `galleries.scan(dirPath) | limit(12)` — `limit` is a custom filter defined in `.eleventy.js`
- `galleries` is a global data object with a `.scan(dirPath)` method, not a plain array
- `collections.gallery` is sorted newest-first (by `item.date`)
- Active nav link detection: `page.url == item.href or (item.href != "/" and page.url and page.url.startsWith(item.href))`
- `site.bookingUrl` is an external URL — always add `target="_blank" rel="noopener noreferrer"` when linking to it

---

## Gallery wiring

```
src/gallery/<slug>.md          frontmatter: gallery: <folder-name>
  ↓
.eleventy.js gallery collection  scans src/assets/images/gallery/<folder-name>/
  ↓
item.data.thumbnailImage         set to path of first file with "thumbnail" in name
item.data.gallery                used by gallery-event.njk to pass to galleries.scan()
```

`galleries.scan(dirPath)` expects a path relative to `src/` e.g. `assets/images/gallery/my-event`. It returns a sorted array of filenames (not full paths).

In `gallery-event.njk`, images are rendered with paths like `/{{ dirPath }}/{{ filename }}`.

---

## CSS architecture

Single file: `src/assets/css/styles.css`. No Sass, no build step for CSS.

Structure (in order):
1. CSS custom properties (`:root` dark defaults, `html[data-bs-theme="light"]` overrides)
2. Global resets / base styles
3. Film grain overlay (SVG feTurbulence filter on `body::before`)
4. Navbar (`.ds-nav`, `.ds-nav-book` with glow animation)
5. Hero section (`.ds-hero`, `.ds-wordmark`, `.ds-hero-line`, `.ds-cta`)
6. Portfolio grid (`.ds-portfolio`, `.ds-portfolio-card`)
7. About section (`.ds-about-section` — Bootstrap card + CSS grid split)
8. Inner pages (`.ds-book-page`, `.ds-contact-page`, `.ds-404`)
9. Forms (`.ds-form-group`, `.ds-form-input`, `.ds-form-textarea`)
10. Footer (`.ds-footer`)
11. Search modal overrides
12. Utilities / responsive breakpoints

All custom classes use `ds-` prefix. Never override Bootstrap internals directly.

---

## Adding/editing styles

- Dark-mode values go on `:root`
- Light-mode overrides go on `html[data-bs-theme="light"] { ... }`
- Mobile breakpoints are `@media (max-width: 760px)` for the about split, `@media (max-width: 768px)` for nav
- The accent colour is `var(--ds-accent)` (`#c8935a` gold) — use it for interactive elements, never hardcode the hex

---

## JavaScript

`src/assets/js/app.js` — two responsibilities only:
1. Theme toggle: reads/writes `localStorage('ds-theme')`, sets `data-bs-theme` on `<html>`, swaps sun/moon icon
2. Mobile nav toggle: toggles `.open` class on `#ds-nav-links`

`src/assets/js/search.js` — Pagefind integration. `openSearch()` opens the Bootstrap modal, `performSearch()` queries the Pagefind index. Both are called from inline `onclick` attributes in `navbar.njk`.

Do not add new JS files without updating the `<script>` tags in every layout that needs them (there are currently 3 standalone layouts + base.njk).

---

## Pagefind / search

- Pagefind runs as a second pass after Eleventy: `npx pagefind --site _site`
- It only indexes elements with `data-pagefind-body`
- Each layout's `<main>` has `data-pagefind-body` — do not remove it
- Search does NOT work in dev (`npm start`) — only after `npm run build`

**How search metadata is resolved:** Pagefind auto-detects title and description from the rendered HTML — specifically the `<title>` element and `<meta name="description">` tag. Each layout populates those from the page's `.md` frontmatter via `{{ title }}` and `{{ description }}`. This means:
- To change what a page is called in search results: edit `title:` in its `.md` file
- To change the search result blurb: edit `description:` in its `.md` file
- Do NOT add explicit `data-pagefind-meta` attributes to override this — it breaks the frontmatter-driven flow

To boost a page's search ranking: add `data-pagefind-weight="10"` to its primary heading (set in the `.md` body, not in a layout).

---

## Images

- Format: `.webp` strongly preferred. Convert with: `convert input.jpg -quality 82 output.webp`
- Gallery thumbnails: filename must contain the word `thumbnail` (case-insensitive). The collection scanner in `.eleventy.js` picks the first matching file.
- Portrait photo: `src/assets/images/wency.webp` (960x1280). Used in the about section on the home page.
- Logo/favicon: `src/assets/images/ds-logo.svg` — Bootstrap Icons `bi-camera2` path in gold (`#c8935a`) on a black circle. Referenced in `site.json` as `favicon` and used inline in `navbar.njk`.

---

## Brand / tone rules

These apply to ALL copy changes — enforce them:

- **No em dashes** (`—`) in any user-visible text. Use commas, colons, or rephrase the sentence.
- **No wedding/gala/conference references.** Event types are: meetups, panels, user groups, community gatherings, workshops, install fests, corporate events.
- **Tone:** cinematic, warm, atmospheric, human. Not corporate, not stiff. First-person from Wency is fine.
- **Site name:** always "Dreamy Shots" (two words, title case, no hyphen)

---

## Netlify deployment

`netlify.toml` config:
- Build command: `npx @11ty/eleventy && npx pagefind --site _site`
- Publish directory: `_site`
- Node version: 20
- Dev proxy: Netlify dev listens on 8888, forwards to Eleventy on 8080

Forms use Netlify's built-in form handling. The form `name` attribute must match what's configured in Netlify. Current form name: `contact`.

---

## What NOT to do

- Do not add `layout: base.njk` to `index.md` — the home page uses `index.njk` which is standalone
- Do not modify legacy spaceclub partials (event-details.njk, postsList.njk, eventsList.njk, homeCards.njk, featured.njk, galleryAll.njk, btn.njk, form.njk) — they are unused dead code from the original template
- Do not run `npm install <package>` without checking if Bootstrap or Eleventy already provides it
- Do not inline large styles on elements — add a `ds-` class to `styles.css` instead
- Do not commit `node_modules/` or `_site/` — both are gitignored
