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
-- Fix all remaining policies on OTHER tables that still use EXISTS (SELECT FROM users)
-- Replace with get_my_role() to avoid any indirect recursion

-- goals table
DROP POLICY IF EXISTS "goals_admin_all" ON public.goals;
CREATE POLICY "goals_admin_all" ON public.goals
  FOR ALL USING (get_my_role() = 'admin');

-- shared_goal_links table
DROP POLICY IF EXISTS "sgl_insert_managers_admins" ON public.shared_goal_links;
CREATE POLICY "sgl_insert_managers_admins" ON public.shared_goal_links
  FOR INSERT WITH CHECK (get_my_role() IN ('manager', 'admin'));

DROP POLICY IF EXISTS "sgl_delete_creator_admin" ON public.shared_goal_links;
CREATE POLICY "sgl_delete_creator_admin" ON public.shared_goal_links
  FOR DELETE USING (
    created_by = auth.uid()
    OR get_my_role() = 'admin'
  );

-- checkins: manager/admin inserts
DROP POLICY IF EXISTS "checkins_admin_all" ON public.checkins;
CREATE POLICY "checkins_admin_all" ON public.checkins
  FOR ALL USING (get_my_role() = 'admin');

-- notifications: users see own, admins see all
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_admin" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;

CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (user_id = auth.uid() OR get_my_role() = 'admin');

CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
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
    console.log('Response:', data);
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(body);
req.end();
