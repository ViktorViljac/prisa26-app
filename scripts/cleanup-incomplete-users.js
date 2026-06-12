import fs from 'fs';

// Parse .env manually
const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, val] = line.split('=');
  if (key && val) env[key.trim()] = val.trim();
});

const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const EMAILS_TO_CLEAN = [
  'anastazija.p24@gmail.com', 'Zelicmia1@gmail.com', 'jelenabuljan24@gmail.com',
  'toni.balint@neutroni.hr', 'anterak8@gmail.com', 'iva.maric2022@gmail.com',
  'tonkaakeran@gmail.com', 'sara.petrovic012345@gmail.com', 'brekalo.nikola12@gmail.com',
  'tinalalic07@gmail.com', 'maritabatallar-sipic@gmail.com', 'akelam@ffst.hr',
  'petra.bilela@gmail.com', 'mateobrajkovic14@gmail.com', 'petar.maric5555@gmail.com',
  'antonio.milanoviclitre7@gmail.com', 'vjekozuzul40@gmail.com', 'vanda.plazibat@gmail.com',
  'lovre.ercegov@gmail.com', 'vlatkalujic@gmail.com', 'nikahab5@gmail.com',
  'korinaoreski123@gmail.com', 'ivona.leacurin7@gmail.com', 'noa.nakir@skole.hr',
  'Marinvuletin3@gmail.com', 'mcarijaagoli@yahoo.com', 'ivkazuzul@gmail.com',
  'lovro.jaman2011@gmail.com', 'lukaajducic13@gmail.com', 'marina.jonjic@skole.hr',
  'jakov.dzaja1@skole.hr', 'andelaikarlo17@gmail.com', 'dijana.sucic007@gmail.com',
  'slavicakarin1@gmail.com', 'enakekez95@gmail.com', 'roganovicivor@gmail.com',
  'ippro10101@gmail.com', 'nivea.bulic@gmail.com', 'Elena.dabro51@gmail.com',
  'teablajic@gmail.com', 'MagdalenaZebic1011@gmail.com', 'lu.barbaric@skole.hr',
  'lovre.buljubasic@skole.hr'
];

async function cleanup() {
  if (!SERVICE_ROLE_KEY) {
    console.error('Missing service role key.');
    process.exit(1);
  }

  console.log('Fetching users to clean via GoTrue REST API...');
  
  let allUsers = [];
  let page = 1;
  while (true) {
    const url = `${env.VITE_SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=1000`;
    const res = await fetch(url, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      }
    });

    if (!res.ok) {
      console.error(`Error listing users: HTTP ${res.status}: ${await res.text()}`);
      break;
    }

    const data = await res.json();
    const users = data.users || [];
    if (users.length === 0) break;
    allUsers = allUsers.concat(users);
    page++;
  }

  console.log(`Total users in auth: ${allUsers.length}`);

  const toDelete = allUsers.filter(u => EMAILS_TO_CLEAN.includes(u.email));
  console.log(`Found ${toDelete.length} users to delete.`);

  for (const u of toDelete) {
    console.log(`Deleting ${u.email} (${u.id})...`);
    const deleteUrl = `${env.VITE_SUPABASE_URL}/auth/v1/admin/users/${u.id}`;
    const deleteRes = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      }
    });

    if (deleteRes.ok) {
      console.log(`Deleted ${u.email} successfully.`);
    } else {
      console.error(`Failed to delete ${u.email}: HTTP ${deleteRes.status}: ${await deleteRes.text()}`);
    }
  }

  console.log('Cleanup finished!');
}

cleanup().catch(console.error);
