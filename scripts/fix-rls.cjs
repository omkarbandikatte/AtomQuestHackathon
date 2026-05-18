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
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_REF = new URL(SURL).hostname.split('.')[0];

// Use Supabase Management API to run SQL
const sql = `
-- Step 1: Drop all recursive policies that query public.users from within users policies
DROP POLICY IF EXISTS "users_select_managers_admins" ON public.users;
DROP POLICY IF EXISTS "users_admin_insert" ON public.users;
DROP POLICY IF EXISTS "users_admin_update" ON public.users;
DROP POLICY IF EXISTS "cycles_admin_insert" ON public.cycles;
DROP POLICY IF EXISTS "cycles_admin_update" ON public.cycles;
DROP POLICY IF EXISTS "goal_sheets_select_admin" ON public.goal_sheets;
DROP POLICY IF EXISTS "goal_sheets_update_admin" ON public.goal_sheets;
DROP POLICY IF EXISTS "goals_select_admin" ON public.goals;
DROP POLICY IF EXISTS "goals_update_admin" ON public.goals;
DROP POLICY IF EXISTS "checkins_select_admin" ON public.checkins;
DROP POLICY IF EXISTS "audit_log_select_admin" ON public.audit_log;
DROP POLICY IF EXISTS "shared_goal_links_select_admin" ON public.shared_goal_links;
DROP POLICY IF EXISTS "notifications_admin" ON public.notifications;

-- Step 2: Create a SECURITY DEFINER function to safely get current user's role
-- This bypasses RLS when called, breaking the recursion
DROP FUNCTION IF EXISTS public.get_my_role();
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role::TEXT FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- Step 3: Recreate policies using the function (no more recursion)
CREATE POLICY "users_select_managers_admins" ON public.users
  FOR SELECT USING (get_my_role() IN ('manager', 'admin'));

CREATE POLICY "users_admin_insert" ON public.users
  FOR INSERT WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "users_admin_update" ON public.users
  FOR UPDATE USING (get_my_role() = 'admin');

CREATE POLICY "cycles_admin_insert" ON public.cycles
  FOR INSERT WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "cycles_admin_update" ON public.cycles
  FOR UPDATE USING (get_my_role() = 'admin');

CREATE POLICY "goal_sheets_select_admin" ON public.goal_sheets
  FOR SELECT USING (get_my_role() = 'admin');

CREATE POLICY "goal_sheets_update_admin" ON public.goal_sheets
  FOR UPDATE USING (get_my_role() = 'admin');

CREATE POLICY "goals_select_admin" ON public.goals
  FOR SELECT USING (get_my_role() = 'admin');

CREATE POLICY "goals_update_admin" ON public.goals
  FOR UPDATE USING (get_my_role() = 'admin');

CREATE POLICY "checkins_select_admin" ON public.checkins
  FOR SELECT USING (get_my_role() = 'admin');

CREATE POLICY "audit_log_select_admin" ON public.audit_log
  FOR SELECT USING (get_my_role() = 'admin');
`;

const body = JSON.stringify({ query: sql });
const options = {
  hostname: 'api.supabase.com',
  path: `/v1/projects/${PROJECT_REF}/database/query`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.SUPABASE_ACCESS_TOKEN || '${process.env.SUPABASE_ACCESS_TOKEN}'}`,
    'Content-Length': Buffer.byteLength(body),
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(body);
req.end();
