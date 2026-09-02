// Extracts the top-level creature keys from data/dinos.js into a JSON file the
// Cloudflare Functions can import for server-side validation.
//
// Run manually or via the Cloudflare Pages build command:
//   node scripts/gen-dino-keys.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const src = readFileSync(new URL("../data/dinos.js", import.meta.url), "utf8");

// Top-level entries are indented with exactly one tab: `\tkey: {`
const keys = [...src.matchAll(/^\t([a-z0-9_]+):\s*\{/gm)].map((m) => m[1]);

if (keys.length < 50) {
  throw new Error(`Only found ${keys.length} dino keys — parser likely broke.`);
}

const outPath = fileURLToPath(new URL("../functions/_data/dino-keys.json", import.meta.url));
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(keys.sort()) + "\n");

console.log(`Wrote ${keys.length} dino keys to functions/_data/dino-keys.json`);
