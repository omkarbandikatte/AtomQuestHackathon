const fs = require('fs'), path = require('path');
const https = require('https');

const env = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
for (const l of env.split('\n')) {
  const t = l.trim(); if (!t || t.startsWith('#')) continue;
  const e = t.indexOf('='); if (e < 0) continue;
  const k = t.slice(0, e).trim(), v = t.slice(e + 1).trim();
  if (!process.env[k]) process.env[k] = v;
}

const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = new URL(SURL).hostname.split('.')[0];

const sql = `
DROP TABLE IF EXISTS public.notifications CASCADE;

CREATE TABLE public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  type text DEFAULT 'info' CHECK (type IN ('info', 'approval', 'rejection', 'reminder', 'unlock')),
  is_read boolean DEFAULT false,
  link text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update notifications" ON public.notifications FOR UPDATE USING (true);
`;

const body = JSON.stringify({ query: sql });
const opts = {
  hostname: 'api.supabase.com',
  path: '/v1/projects/' + PROJECT_REF + '/database/query',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + TOKEN
  }
};

const req = https.request(opts, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    if (res.statusCode === 201 || res.statusCode === 200) {
      console.log('Notifications table created successfully!');
    } else {
      console.log('Status:', res.statusCode, d);
    }
  });
});
req.write(body);
req.end();
