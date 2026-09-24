# Life Design for Abhi

A private, password-protected single-page site built from *Designing the Happiest Life, Roadmap v3*.

## How the protection works

`index.html` holds only a small unlock screen and a blob of **AES-256-GCM ciphertext**. The key is derived from the password with PBKDF2-SHA256 (600,000 iterations), and decryption happens in the browser. Without the password, the page source reveals nothing: no names, dates or plan content. That's why this repo can be public and still work with GitHub Pages.

- The plain-text source (`src/`) is **git-ignored** and never committed.
- The password is **never** stored in the repo. It's passed in as an environment variable at build time.
- "Remember on this device" stores the derived key in `localStorage`. The lock icon in the top bar forgets it.
- Notes, checklists and scores you enter on the site are saved in that browser's `localStorage` only. Use **Export my notes** in the footer to back them up.

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
