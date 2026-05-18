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

const sql = `
-- Drop the function with CASCADE (drops all dependent policies too)
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;

-- Recreate as plpgsql (opaque to planner, prevents recursion detection)
CREATE FUNCTION public.get_my_role()
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

-- Recreate all policies that were dropped by CASCADE

-- USERS table
CREATE POLICY "users_select_managers_admins" ON public.users
  FOR SELECT USING (get_my_role() IN ('manager', 'admin'));

CREATE POLICY "users_admin_insert" ON public.users
  FOR INSERT WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "users_admin_update" ON public.users
  FOR UPDATE USING (get_my_role() = 'admin');

-- CYCLES table
CREATE POLICY "cycles_admin_insert" ON public.cycles
  FOR INSERT WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "cycles_admin_update" ON public.cycles
  FOR UPDATE USING (get_my_role() = 'admin');

-- GOAL_SHEETS table
CREATE POLICY "goal_sheets_select_admin" ON public.goal_sheets
  FOR SELECT USING (get_my_role() = 'admin');

CREATE POLICY "goal_sheets_update_admin" ON public.goal_sheets
  FOR UPDATE USING (get_my_role() = 'admin');

-- GOALS table
CREATE POLICY "goals_select_admin" ON public.goals
  FOR SELECT USING (get_my_role() = 'admin');

CREATE POLICY "goals_update_admin" ON public.goals
  FOR UPDATE USING (get_my_role() = 'admin');

CREATE POLICY "goals_admin_all" ON public.goals
  FOR ALL USING (get_my_role() = 'admin');

-- CHECKINS table
CREATE POLICY "checkins_select_admin" ON public.checkins
  FOR SELECT USING (get_my_role() = 'admin');

CREATE POLICY "checkins_admin_all" ON public.checkins
  FOR ALL USING (get_my_role() = 'admin');

-- AUDIT_LOG table
CREATE POLICY "audit_log_select_admin" ON public.audit_log
  FOR SELECT USING (get_my_role() = 'admin');

-- SHARED_GOAL_LINKS table
CREATE POLICY "sgl_insert_managers_admins" ON public.shared_goal_links
  FOR INSERT WITH CHECK (get_my_role() IN ('manager', 'admin'));

CREATE POLICY "sgl_delete_creator_admin" ON public.shared_goal_links
  FOR DELETE USING (
    created_by = auth.uid() OR get_my_role() = 'admin'
  );

-- NOTIFICATIONS table
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (user_id = auth.uid() OR get_my_role() = 'admin');
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
