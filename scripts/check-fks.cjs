const fs = require('fs');
const https = require('https');

const env = fs.readFileSync('.env.local', 'utf8');
for (const l of env.split('\n')) {
  const t = l.trim(); if (!t || t.startsWith('#')) continue;
  const e = t.indexOf('='); if (e < 0) continue;
  const k = t.slice(0, e).trim();
  if (!process.env[k]) process.env[k] = t.slice(e + 1).trim();
}

const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PROJECT_REF = new URL(SURL).hostname.split('.')[0];

// Check FK names for goal_sheets and goals tables
const sql = `
SELECT conname, conrelid::regclass::text as table_name, 
       confrelid::regclass::text as ref_table
FROM pg_constraint 
WHERE conrelid IN ('public.goal_sheets'::regclass, 'public.goals'::regclass)
  AND contype = 'f'
ORDER BY conrelid::regclass::text, conname;
`;

const body = JSON.stringify({ query: sql });
const opts = {
  hostname: 'api.supabase.com',
  path: `/v1/projects/${PROJECT_REF}/database/query`,
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ${process.env.SUPABASE_ACCESS_TOKEN}' },
};
https.request(opts, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => console.log(JSON.stringify(JSON.parse(d), null, 2))); }).end(body);
