import fs from 'fs';

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  });

  const supabaseUrl = env['VITE_SUPABASE_URL'];
  const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

  const url = `${supabaseUrl}/rest/v1/challenges?select=*`;
  const res = await fetch(url, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });

  const data = await res.json();
  console.log('Challenges count:', data.length);
  if (data.length > 0) {
    console.log('Sample challenge keys:', Object.keys(data[0]));
    console.log('Sample target_count:', data[0].target_count);
  } else {
    console.log('No challenges found.');
  }
}
run();
