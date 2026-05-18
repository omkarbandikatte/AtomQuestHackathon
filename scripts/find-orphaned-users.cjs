/**
 * Finds auth users that have no matching public.users profile row.
 * Run: node scripts/find-orphaned-users.cjs
 */
const fs = require("fs");
const path = require("path");

// Parse .env.local
const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
for (const line of envContent.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  const k = t.slice(0, eq).trim();
  const v = t.slice(eq + 1).trim();
  if (!process.env[k]) process.env[k] = v;
}

const PROJECT_REF = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

async function query(sql) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({ query: sql }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? JSON.stringify(data));
  return data;
}

async function main() {
  console.log("\nLooking for auth users without a public.users profile...\n");

  const rows = await query(`
    SELECT au.id, au.email, au.created_at
    FROM auth.users au
    LEFT JOIN public.users pu ON pu.id = au.id
    WHERE pu.id IS NULL
    ORDER BY au.created_at DESC;
  `);

  if (!rows.length) {
    console.log("No orphaned accounts found.");
    return;
  }

  console.log("Orphaned auth accounts (auth exists, profile missing):");
  rows.forEach((u) => console.log(`  - ${u.email}  (id: ${u.id}, created: ${u.created_at})`));
}

main().catch((e) => { console.error("Error:", e.message); process.exit(1); });
