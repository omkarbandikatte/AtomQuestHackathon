const fs = require("fs"), path = require("path");
const env = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
for (const l of env.split("\n")) {
  const t = l.trim();
  if (!t || t.startsWith("#")) continue;
  const e = t.indexOf("=");
  if (e < 0) continue;
  const k = t.slice(0, e).trim(), v = t.slice(e + 1).trim();
  if (!process.env[k]) process.env[k] = v;
}

const PROJECT_REF = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

const sql = [
  "INSERT INTO public.users (id, email, full_name, role, is_active) VALUES",
  "  ('85798119-833d-44c9-ac5a-163794ce2b9a', 'omkarbandikatte2602@gmail.com', 'Omkar Bandikatte', 'admin', true),",
  "  ('da49e08d-9eb0-48d6-b972-cd1531edcc68', 'omkarbandikatte123456789@gmail.com', 'Omkar Test', 'employee', true)",
  "ON CONFLICT (id) DO NOTHING;",
].join("\n");

fetch(
  "https://api.supabase.com/v1/projects/" + PROJECT_REF + "/database/query",
  {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + TOKEN },
    body: JSON.stringify({ query: sql }),
  }
)
  .then((r) =>
    r.text().then((t) => {
      if (!r.ok) { console.error("FAILED:", t); process.exit(1); }
      console.log("Profiles created successfully!");
      console.log("  admin:    omkarbandikatte2602@gmail.com");
      console.log("  employee: omkarbandikatte123456789@gmail.com");
    })
  )
  .catch((e) => { console.error(e); process.exit(1); });
