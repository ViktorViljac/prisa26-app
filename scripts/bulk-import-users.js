// ============================================================
// PRIŠA 2026 — Bulk User Import Script
// ============================================================
// 1. Get your SERVICE ROLE key from:
//    Supabase Dashboard → Settings → API → service_role (secret)
// 2. Paste it in SERVICE_ROLE_KEY below
// 3. Edit the USERS array with your participants
// 4. Run: node scripts/bulk-import-users.js
// ============================================================

import { createClient } from '@supabase/supabase-js';

// ─── CONFIG ──────────────────────────────────────────────────
const SUPABASE_URL = 'https://xtpiykbtaqlemrjnvebq.supabase.co';
const SERVICE_ROLE_KEY = 'PASTE_YOUR_SERVICE_ROLE_KEY_HERE'; // ← get from Supabase Dashboard

// ─── USERS TO IMPORT ─────────────────────────────────────────
// Add all your participants here.
// password: leave blank to auto-generate (e.g. "Prisa1234")
// team: optional, must match team name in database exactly
const USERS = [
  { email: 'ivan.horvat@example.com',   name: 'Ivan Horvat',    team: 'Tim A' },
  { email: 'ana.anic@example.com',       name: 'Ana Anić',       team: 'Tim A' },
  { email: 'marko.marić@example.com',   name: 'Marko Marić',    team: 'Tim B' },
  { email: 'petra.perić@example.com',   name: 'Petra Perić',    team: 'Tim B' },
  // ... add more here
];

// ─── PASSWORD GENERATOR ──────────────────────────────────────
function generatePassword() {
  const num = Math.floor(1000 + Math.random() * 9000); // 4-digit number
  return `Prisa${num}`;
}

// ─── MAIN ─────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  if (SERVICE_ROLE_KEY === 'PASTE_YOUR_SERVICE_ROLE_KEY_HERE') {
    console.error('\n❌ ERROR: Set your SERVICE_ROLE_KEY in the script first!\n');
    console.error('   Get it from: Supabase Dashboard → Settings → API → service_role\n');
    process.exit(1);
  }

  console.log(`\n🚀 Importing ${USERS.length} users...\n`);

  // Fetch teams map: name → id
  const { data: teams } = await supabase.from('teams').select('id, name');
  const teamMap = {};
  if (teams) teams.forEach(t => { teamMap[t.name] = t.id; });

  const results = [];

  for (const user of USERS) {
    const password = generatePassword();
    let status = '✅';
    let error = '';

    try {
      // 1. Create auth user
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: user.email,
        password,
        email_confirm: true, // skip email verification
        user_metadata: { name: user.name },
      });

      if (authErr) {
        // User may already exist — try to get them
        if (authErr.message?.includes('already been registered') || authErr.code === 'email_exists') {
          status = '⚠️ exists';
        } else {
          throw authErr;
        }
      }

      const userId = authData?.user?.id;

      // 2. Upsert profile
      if (userId) {
        const teamId = user.team ? (teamMap[user.team] || null) : null;

        await supabase.from('profiles').upsert({
          id: userId,
          name: user.name,
          email: user.email,
          team_id: teamId,
          xp: 0,
          streak: 0,
          role: 'user',
        }, { onConflict: 'id' });
      }

    } catch (err) {
      status = '❌ ERROR';
      error = err.message;
    }

    results.push({ status, email: user.email, name: user.name, password, team: user.team || '', error });
  }

  // ─── PRINT RESULTS ───────────────────────────────────────────
  console.log('\n' + '─'.repeat(80));
  console.log('📋 CREDENTIALS — share these with participants:');
  console.log('─'.repeat(80));
  console.log(padR('Status', 12) + padR('Name', 20) + padR('Email', 30) + padR('Password', 14) + 'Team');
  console.log('─'.repeat(80));

  for (const r of results) {
    console.log(
      padR(r.status, 12) +
      padR(r.name, 20) +
      padR(r.email, 30) +
      padR(r.password, 14) +
      r.team +
      (r.error ? `  ← ${r.error}` : '')
    );
  }

  console.log('─'.repeat(80));

  // ─── SAVE TO CSV ─────────────────────────────────────────────
  const { writeFileSync } = await import('fs');
  const csv = [
    'status,name,email,password,team',
    ...results.map(r =>
      `${r.status},${r.name},${r.email},${r.password},${r.team}`
    )
  ].join('\n');

  const outPath = './scripts/credentials_output.csv';
  writeFileSync(outPath, csv, 'utf8');
  console.log(`\n💾 Saved to: ${outPath}`);

  const ok = results.filter(r => r.status.includes('✅')).length;
  const skipped = results.filter(r => r.status.includes('⚠️')).length;
  const failed = results.filter(r => r.status.includes('❌')).length;
  console.log(`\n✅ Created: ${ok}  ⚠️  Already existed: ${skipped}  ❌ Failed: ${failed}\n`);
}

function padR(str, len) {
  return String(str).padEnd(len, ' ');
}

main().catch(console.error);
