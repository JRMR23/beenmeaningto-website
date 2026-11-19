# Been Meaning To website

Plain HTML, CSS and JavaScript. No build step, no server code, no accounts.

## Pages

| Path | Page |
|---|---|
| `index.html` | Home: hero, spin-the-shelf demo, streaks/levels/badges, Wrapped, widgets and extras, confetti button |
| `pro/` | Free vs Pro (no prices), palettes, Style Pack |
| `faq/` | FAQ |
| `support/` | Support |
| `privacy/` | Privacy policy (the app links to `https://beenmeaningto.app/privacy/`) |

Shared styles are in `assets/css/site.css`, home-only styles in `home.css`, sub-page styles in `pages.css`. `assets/js/site.js` has the menu, scroll reveals, count-ups and confetti. `assets/js/home.js` runs the demos on the home page, which all use made-up books.

## Preview locally

```bash
cd ~/Documents/Stacks/website && python3 serve.py
```

Then open http://localhost:4174. `serve.py` tells the browser not to cache, so a normal refresh always shows your latest changes.

The CSS and JS links in each page end in `?v=13`. When you publish changes, bump that number on every page so visitors' browsers fetch the new files.

## Before launch, replace these placeholders

- **App Store link:** every button with `data-store` uses `href="#"` and shows a "Coming soon" toast. Put the App Store URL in the `href` and the toast stops showing. Also change the "Coming soon to the" text.
- **Support email and postal address:** `hello@beenmeaningto.app` and the Collingwood Street address in `support/` and `privacy/`.
- **Privacy policy:** check it against how the app ships, and set the "Last updated" date.

## Deploy

Hosted free on GitHub Pages at https://beenmeaningto.app (the `CNAME` file tells GitHub the domain). It also works from a subfolder, because every link is relative.

## Logo and icons

- The header and footer wordmark use Bagel Fat One (`assets/fonts/BagelFatOne.woff2`, SIL Open Font License).
- `assets/img/icon.png` is the Sky app icon (favicon, header, sharing image). `assets/img/icons/` holds all four app icons shown on the Pro page.
