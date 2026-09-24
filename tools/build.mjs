// Build the password-protected site.
//
//   SITE_PASSWORD='…' node tools/build.mjs            src/site.template.html -> index.html (encrypted)
//   SITE_PASSWORD='…' node tools/build.mjs --decrypt  index.html -> src/site.template.html (recover source)
//
// The plain-text source (src/) is git-ignored so the repo can be public: only the
// AES-256-GCM encrypted page is committed. The password never touches the repo.
import fs from 'fs';
import path from 'path';
import { webcrypto as crypto } from 'crypto';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const pw = process.env.SITE_PASSWORD;
if (!pw) { console.error('Set SITE_PASSWORD'); process.exit(1); }

const ITER = 600000;
const b64 = u => Buffer.from(u).toString('base64');

async function keyFor(salt, iter) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

if (process.argv.includes('--decrypt')) {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const p = JSON.parse(html.match(/const PAYLOAD = (\{.*?\});/s)[1]);
  const key = await keyFor(Buffer.from(p.salt, 'base64'), p.iter);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: Buffer.from(p.iv, 'base64') }, key, Buffer.from(p.ct, 'base64'));
  let src = new TextDecoder().decode(pt);
  src = src.replace(/const MAP = \{.*?\};\n/s, 'const MAP = /*MAPDATA*/null;\n');
  fs.mkdirSync(path.join(root, 'src'), { recursive: true });
  fs.writeFileSync(path.join(root, 'src/site.template.html'), src);
  console.log('Recovered src/site.template.html');
  process.exit(0);
}

const map = fs.readFileSync(path.join(root, 'tools/mapdata.json'), 'utf8');
const site = fs.readFileSync(path.join(root, 'src/site.template.html'), 'utf8').replace('/*MAPDATA*/null', () => map);
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const key = await keyFor(salt, ITER);
const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(site));
const payload = JSON.stringify({ v: 1, iter: ITER, salt: b64(salt), iv: b64(iv), ct: b64(ct) });
const gate = fs.readFileSync(path.join(root, 'tools/gate.html'), 'utf8').replace('/*PAYLOAD*/null', () => payload);
fs.writeFileSync(path.join(root, 'index.html'), gate);
if (process.argv.includes('--preview')) fs.writeFileSync(path.join(root, 'src/preview.html'), site);
console.log(`index.html written (${(gate.length / 1024).toFixed(0)} KB, encrypted)`);
