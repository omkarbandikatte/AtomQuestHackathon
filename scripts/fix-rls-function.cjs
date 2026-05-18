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

// Fix: Recreate get_my_role() using plpgsql (not sql) to prevent planner inlining
// SQL functions can be inlined, which lets the planner see the reference to public.users
// and triggers the infinite recursion detection. PL/pgSQL functions are opaque to the planner.
const sql = `
DROP FUNCTION IF EXISTS public.get_my_role();

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = auth.uid();
  RETURN user_role;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO anon;
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
    try { console.log(JSON.stringify(JSON.parse(data), null, 2)); }
    catch(e) { console.log(data); }
  });
});
req.on('error', (e) => console.error('Error:', e.message));
req.write(body);
req.end();
