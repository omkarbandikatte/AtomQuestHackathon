const fs = require('fs');
const https = require('https');

const env = fs.readFileSync('.env.local', 'utf8');
for (const l of env.split('\n')) {
  const t = l.trim();
  if (!t || t.startsWith('#')) continue;
  const e = t.indexOf('=');
  if (e < 0) continue;
  const k = t.slice(0, e).trim();
  if (!process.env[k]) process.env[k] = t.slice(e + 1).trim();
}

const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PROJECT_REF = new URL(SURL).hostname.split('.')[0];

// Check current state of policies on users table and the get_my_role function
const sql = `
SELECT polname, polrelid::regclass::text AS table_name, pg_get_expr(polqual, polrelid) AS using_expr
FROM pg_policy
WHERE polrelid = 'public.users'::regclass
ORDER BY polname;
`;

const body = JSON.stringify({ query: sql });
const options = {
  hostname: 'api.supabase.com',
  path: `/v1/projects/${PROJECT_REF}/database/query`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
    'Content-Length': Buffer.byteLength(body),
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log(JSON.stringify(JSON.parse(data), null, 2));
  });
});
req.on('error', (e) => console.error('Error:', e.message));
req.write(body);
req.end();
