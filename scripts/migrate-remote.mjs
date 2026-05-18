/**
 * AtomQuest — Remote Migration Runner
 *
 * Applies all SQL migrations to the remote Supabase project via the
 * Supabase Management API (no CLI or pg driver required).
 *
 * Usage:
 *   1. Get a personal access token from:
 *      https://supabase.com/dashboard/account/tokens
 *   2. Add it to .env.local:
 *      SUPABASE_ACCESS_TOKEN=your_token_here
 *   3. node scripts/migrate-remote.mjs
 *
 *   To also apply seed data, pass --seed:
 *   node scripts/migrate-remote.mjs --seed
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── Load .env.local ────────────────────────────────────────────────────────

function loadEnvLocal() {
  const envPath = join(ROOT, ".env.local");
  if (!existsSync(envPath)) {
    console.error("ERROR: .env.local not found at", envPath);
    process.exit(1);
  }
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

// ── Config ─────────────────────────────────────────────────────────────────

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!ACCESS_TOKEN) {
  console.error(
    "\n❌  SUPABASE_ACCESS_TOKEN not found in .env.local\n\n" +
      "    Get one from: https://supabase.com/dashboard/account/tokens\n" +
      "    Then add to .env.local:\n" +
      "        SUPABASE_ACCESS_TOKEN=your_token_here\n"
  );
  process.exit(1);
}

if (!SUPABASE_URL) {
  console.error("❌  NEXT_PUBLIC_SUPABASE_URL not found in .env.local");
  process.exit(1);
}

// Extract project ref from the Supabase URL
// e.g. https://jreqkthaummceqyuuqsh.supabase.co  →  jreqkthaummceqyuuqsh
const PROJECT_REF = new URL(SUPABASE_URL).hostname.split(".")[0];

const includeSeed = process.argv.includes("--seed");

const MIGRATIONS_DIR = join(ROOT, "supabase", "migrations");

const MIGRATION_FILES = [
  "001_initial_schema.sql",
  "002_indexes.sql",
  "003_functions_triggers.sql",
  "004_rls_policies.sql",
  ...(includeSeed ? ["005_seed_data.sql"] : []),
];

// ── API helper ─────────────────────────────────────────────────────────────

async function runQuery(sql) {
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  const text = await res.text();

  if (!res.ok) {
    let detail = text;
    try {
      const json = JSON.parse(text);
      detail = json.message ?? json.error ?? text;
    } catch {}
    throw new Error(`HTTP ${res.status}: ${detail}`);
  }

  return text;
}

// ── Main ───────────────────────────────────────────────────────────────────

console.log(`\n🚀  AtomQuest Migration Runner`);
console.log(`    Project: ${PROJECT_REF}`);
console.log(`    Files:   ${MIGRATION_FILES.join(", ")}\n`);

for (const file of MIGRATION_FILES) {
  const filePath = join(MIGRATIONS_DIR, file);

  if (!existsSync(filePath)) {
    console.error(`❌  Migration file not found: ${filePath}`);
    process.exit(1);
  }

  const sql = readFileSync(filePath, "utf8");
  process.stdout.write(`  ⏳  Running ${file} … `);

  try {
    await runQuery(sql);
    console.log("✅  done");
  } catch (err) {
    console.log("❌  FAILED");
    console.error(`\n    Error: ${err.message}\n`);
    process.exit(1);
  }
}

console.log("\n✅  All migrations applied successfully!\n");
