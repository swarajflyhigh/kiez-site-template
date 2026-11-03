import { defineConfig } from 'vite';
import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

/* Multi-page build: the main site plus every page under demos/<slug>/ (if the folder exists). */
const root = fileURLToPath(new URL('.', import.meta.url));
const input = { main: join(root, 'index.html') };
const demos = join(root, 'demos');
if (existsSync(demos)) {
  for (const d of readdirSync(demos, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    for (const f of readdirSync(join(demos, d.name))) {
      if (f.endsWith('.html')) input[`${d.name}/${f.slice(0, -5)}`] = join(demos, d.name, f);
    }
  }
}

export default defineConfig({ build: { rollupOptions: { input } } });
