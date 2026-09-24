# Life Design for Abhi

A private, password-protected single-page site built from *Designing the Happiest Life, Roadmap v3*.

## How the protection works

`index.html` holds only a small unlock screen and a blob of **AES-256-GCM ciphertext**. The key is derived from the password with PBKDF2-SHA256 (600,000 iterations), and decryption happens in the browser. Without the password, the page source reveals nothing: no names, dates or plan content. That's why this repo can be public and still work with GitHub Pages.

- The plain-text source (`src/`) is **git-ignored** and never committed.
- The password is **never** stored in the repo. It's passed in as an environment variable at build time.
- "Remember on this device" stores the derived key in `localStorage`. The lock icon in the top bar forgets it.
- The roadmap sections are read-only. Every input lives in the **Life Happiness Test** (9 areas). Answers are saved in that browser's `localStorage` only; use **Export answers** on the test's final screen to back them up.

## Editing

```bash
npm install
SITE_PASSWORD='…' npm run decrypt   # recovers src/site.template.html from index.html
# edit src/site.template.html
SITE_PASSWORD='…' npm run build     # re-encrypts into index.html
```

Commit only `index.html` (plus any tooling changes).

## Hosting (GitHub Pages)

Settings → Pages → *Deploy from a branch* → pick the branch and `/ (root)`.
The site will be at `https://abhisheknid.github.io/lifedesign_abhi/`.
Section deep links such as `#sprint`, `#people` or `#dashboard` still work after unlocking. The weekly reminder emails use them.

## Life Happiness Test → PDF by email

When you submit the test, the browser builds a PDF analysis (jsPDF) and downloads it. If a mail endpoint is configured, it also POSTs the PDF to a small Google Apps Script web app, which emails it to you from your own Google account.

1. Open script.google.com and create a new project. Paste `tools/apps-script/Code.gs`, then set `RECIPIENT` and `TOKEN` (the token must match the one inside the site source).
2. Deploy → New deployment → Web app → Execute as **Me** → Who has access **Anyone** → copy the `/exec` URL.
3. Rebuild with the URL: `MAIL_ENDPOINT='https://script.google.com/macros/s/…/exec' SITE_PASSWORD='…' npm run build`

The endpoint URL and token are stored only inside the encrypted page.
Deep links: `#test` opens the test; `#test-people`, `#test-dashboard` and so on open a specific area.
