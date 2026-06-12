import fs from 'fs';

// Parse .env manually
const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, val] = line.split('=');
  if (key && val) env[key.trim()] = val.trim();
});

const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const TEAM_TRANSLATION = {
  'tim 1': 'Plavi',
  'tim 2': 'Zeleni',
  'tim 3': 'Crveni',
  'tim 4': 'Žuti',
};

const USERS = [
  { name: "Anastazija Petričić", email: "anastazija.p24@gmail.com", password: "dmt9tx", phone: "+385915981920", dob: "24.4.2007.", school: "III. gimnazija, Split", team: "Tim 4" },
  { name: "Mia Zelic", email: "Zelicmia1@gmail.com", password: "69d7h7", phone: "+385976833341", dob: "19.03.2007.", school: "Breda University of Applied Science", team: "Tim 2" },
  { name: "Jelena Buljan", email: "jelenabuljan24@gmail.com", password: "wwuq4v", phone: "385 95 877 8901", dob: "24.8", school: "", team: "Tim 3" },
  { name: "Toni Balint", email: "toni.balint@neutroni.hr", password: "u5233s", phone: "097 716 0743", dob: "19.08.2010.", school: "MIOC(III. gimnazija)", team: "Tim 4" },
  { name: "Ante Rak", email: "anterak8@gmail.com", password: "33vrha", phone: "0957321774", dob: "3.11.2007", school: "Turističko-ugostiteljska škola Šibenik", team: "Tim 3" },
  { name: "Iva Marić", email: "iva.maric2022@gmail.com", password: "wcdk5d", phone: "0919392263", dob: "9.1.2011.", school: "Gimnazija A. G. Matoša Đakovo", team: "Tim 1" },
  { name: "Tonka Keran", email: "tonkaakeran@gmail.com", password: "ra57ys", phone: "097 709 8605", dob: "23.1.2013.", school: "OŠ Dobri", team: "Tim 1" },
  { name: "Sara Petrović", email: "sara.petrovic012345@gmail.com", password: "ymgpjn", phone: "095 835 0112", dob: "9.8.2007.", school: "", team: "Tim 4" },
  { name: "Nikola Brekalo Limeta", email: "brekalo.nikola12@gmail.com", password: "8n4p2t", phone: "+385995635104", dob: "30.7.2012", school: "OŠ Jesenice", team: "Tim 2" },
  { name: "Tina Lalić", email: "tinalalic07@gmail.com", password: "xc2mcu", phone: "0981972296", dob: "16.05.2007", school: "", team: "Tim 3" },
  { name: "Marita Alba Batallar-Šipić", email: "maritabatallar-sipic@gmail.com", password: "ukkre7", phone: "0983101186", dob: "8.9.2014.", school: "OŠ Skalice", team: "Tim 4" },
  { name: "Asja Kelam", email: "akelam@ffst.hr", password: "xzzvka", phone: "0992863535", dob: "23.2.2001", school: "Ffst", team: "Tim 1" },
  { name: "Petra Bilela", email: "petra.bilela@gmail.com", password: "6znnrq", phone: "0994535722", dob: "06.02.2001.", school: "Pmfst", team: "Tim 1" },
  { name: "Mateo Brajković", email: "mateobrajkovic14@gmail.com", password: "cp7vus", phone: "+385976085467", dob: "3.8.2014", school: "Osnovna škola don Lovre Katić", team: "Tim 1" },
  { name: "Petar Marić", email: "petar.maric5555@gmail.com", password: "6dqt43", phone: "+385 91 978 6542", dob: "28.3.2016.", school: "P.Š. Tomašanci", team: "Tim 2" },
  { name: "Antonio Milanović-Litre", email: "antonio.milanoviclitre7@gmail.com", password: "6w7sp8", phone: "0989734969", dob: "30.12.2010.", school: "3. Gimnazija Split", team: "Tim 2" },
  { name: "Vjeko Žužul", email: "vjekozuzul40@gmail.com", password: "tj6qv8", phone: "0955624236", dob: "20.10.2011.", school: "OŠ Tin Ujević Krivodol", team: "Tim 3" },
  { name: "Vanda", email: "vanda.plazibat@gmail.com", password: "stt4av", phone: "+385 099 754 4939", dob: "10.6.2013.", school: "Da", team: "Tim 4" },
  { name: "Lovre Ercegović", email: "lovre.ercegov@gmail.com", password: "h3e5b9", phone: "095 864 3989", dob: "26.9.2011.", school: "OŠ Trstenik", team: "Tim 2" },
  { name: "Vlatka Lujić", email: "vlatkalujic@gmail.com", password: "zt7ydz", phone: "095/535 1081", dob: "20.01.2010", school: "Prirodoslovna škola Split", team: "Tim 3" },
  { name: "Nika Habulinec", email: "nikahab5@gmail.com", password: "wqses7", phone: "095 726 2722", dob: "24.03.2008.", school: "Prirodoslovna škola Vladimira Preloga", team: "Tim 1" },
  { name: "Korina Oreški", email: "korinaoreski123@gmail.com", password: "h67dxz", phone: "095 779 9652", dob: "28.05.2009.", school: "Škola za medicinske sestre vinogradtska", team: "Tim 2" },
  { name: "Ivona Lea Ćurin", email: "ivona.leacurin7@gmail.com", password: "rysz89", phone: "0915662642", dob: "14.6.2010", school: "V. Gimnazija Vladimir Nazor Split", team: "Tim 4" },
  { name: "Noa Nakir", email: "noa.nakir@skole.hr", password: "ujupyk", phone: "0924142338", dob: "09.02.2014.", school: "OŠ Mertojak", team: "Tim 2" },
  { name: "Marin vuletin", email: "Marinvuletin3@gmail.com", password: "u4xtzs", phone: "0916188743", dob: "11.5.2011", school: "OŠ Bijaći", team: "Tim 2" },
  { name: "Vito Agoli", email: "mcarijaagoli@yahoo.com", password: "47pqgk", phone: "0976542444", dob: "27. 10. 2012.", school: "OŠ BLATINE ŠKRAPE", team: "Tim 1" },
  { name: "Ivka Žužul", email: "ivkazuzul@gmail.com", password: "5jabex", phone: "0915763111", dob: "2.7.2012", school: "Osnovna škola Tin Ujević Krivodol", team: "Tim 4" },
  { name: "Lovro Jaman", email: "lovro.jaman2011@gmail.com", password: "7w9r4t", phone: "+385957108730", dob: "6. travnja 2011.", school: "OŠ prof. Filipa Lukasa", team: "Tim 2" },
  { name: "Luka Ajdučić", email: "lukaajducic13@gmail.com", password: "8sn8gj", phone: "0924296559", dob: "20.02.2013", school: "OŠ Ivana Mažuranića", team: "Tim 2" },
  { name: "Marina Jonjić", email: "marina.jonjic@skole.hr", password: "zsrt35", phone: "0992116522", dob: "27.09.2012", school: "Oš Tin Ujević Krivodol", team: "Tim 4" },
  { name: "Jakov Džaja", email: "jakov.dzaja1@skole.hr", password: "s4quy8", phone: "+385976025241", dob: "10.12.2014.", school: "OŠ Mejaši", team: "Tim 3" },
  { name: "Karlo kulaš", email: "andelaikarlo17@gmail.com", password: "b5kmr8", phone: "0976670452", dob: "11.3.2017.", school: "Osnovna škola Kman-kocunar", team: "Tim 3" },
  { name: "MIRA SUČIĆ", email: "dijana.sucic007@gmail.com", password: "4drzz4", phone: "97 711 5773", dob: "29.07.2016.", school: "KMAN-KOCUNAR SPLIT", team: "Tim 1" },
  { name: "Megi Megic", email: "slavicakarin1@gmail.com", password: "9tjr89", phone: "0976231971", dob: "9.11.2016.", school: "", team: "Tim 2" },
  { name: "Ena Kekez", email: "enakekez95@gmail.com", password: "f9q52s", phone: "0995099849", dob: "13.07.2009", school: "Druga jezicna gimnazija Split", team: "Tim 4" },
  { name: "Ivor Roganović", email: "roganovicivor@gmail.com", password: "9cxj7s", phone: "0953555628", dob: "12.5.2013.", school: "Oš marjan", team: "Tim 3" },
  { name: "Ivan Petar Katić", email: "ippro10101@gmail.com", password: "ndg26q", phone: "0917951162", dob: "20.1.2012", school: "", team: "Tim 3" },
  { name: "Nina Medić", email: "nivea.bulic@gmail.com", password: "er8aca", phone: "+385976419751", dob: "16.05.2016.", school: "Kman Kocunar", team: "Tim 3" },
  { name: "Elena Dabro", email: "Elena.dabro51@gmail.com", password: "rvu85c", phone: "0992033323", dob: "05.01.2017.", school: "OŠ Kman-Kocunar", team: "Tim 1" },
  { name: "Tea Blajić", email: "teablajic@gmail.com", password: "w4ghdw", phone: "0977496859", dob: "14.12.2011", school: "Osnovna škola Kman-Kocunar", team: "Tim 4" },
  { name: "Magdalena Zebic", email: "MagdalenaZebic1011@gmail.com", password: "b3u9jy", phone: "99 200 9879", dob: "10.11.2016", school: "Oš kman kocunar", team: "Tim 1" },
  { name: "Lu Barbarić", email: "lu.barbaric@skole.hr", password: "3xneam", phone: "091 6194940", dob: "1.11.2013.", school: "OŠ Kman-Kocunar", team: "Tim 1" },
  { name: "Lovre Buljubašić", email: "lovre.buljubasic@skole.hr", password: "yvv389", phone: "0994866699", dob: "24.9.2013.", school: "OŠ Kman-Kocunar", team: "Tim 3" }
];

async function main() {
  if (!SERVICE_ROLE_KEY) {
    console.error('\n❌ GREŠKA: Nedostaje SUPABASE_SERVICE_ROLE_KEY u .env datoteci!\n');
    process.exit(1);
  }

  console.log(`\n🚀 Započinjem uvoz ${USERS.length} korisnika...\n`);

  // Headers helper
  const headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };

  // 1. Fetch current teams
  const teamsRes = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/teams?select=*`, { headers });
  if (!teamsRes.ok) {
    console.error('Greška pri dohvaćanju timova:', await teamsRes.text());
    process.exit(1);
  }
  const dbTeams = await teamsRes.json();
  const teamNameMap = {};
  dbTeams.forEach(t => { teamNameMap[t.name.toLowerCase()] = t.id; });

  const targetTeams = [
    { name: 'Plavi', color: '#3b82f6', icon: '💎' },
    { name: 'Zeleni', color: '#0d9488', icon: '🌿' },
    { name: 'Crveni', color: '#ef4444', icon: '❤️' },
    { name: 'Žuti', color: '#f59e0b', icon: '☀️' }
  ];

  for (const t of targetTeams) {
    if (!teamNameMap[t.name.toLowerCase()]) {
      console.log(`Tim ${t.name} ne postoji, stvaram ga...`);
      const insRes = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/teams`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify(t)
      });
      if (!insRes.ok) {
        console.error(`Greška pri stvaranju tima ${t.name}:`, await insRes.text());
        process.exit(1);
      }
      const inserted = await insRes.json();
      teamNameMap[t.name.toLowerCase()] = inserted[0].id;
    }
  }

  const results = [];

  // Fetch list of existing auth users to prevent unique constraint failures
  const listRes = await fetch(`${env.VITE_SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, { headers });
  let existingAuthUsers = [];
  if (listRes.ok) {
    const listData = await listRes.json();
    existingAuthUsers = listData.users || [];
  }

  for (const user of USERS) {
    let status = '✅';
    let error = '';
    let userId = null;

    // Calculate age from DOB year if possible
    const yearMatch = user.dob.match(/\b(200\d|201\d|202\d|199\d)\b/);
    let age = null;
    if (yearMatch) {
      const birthYear = parseInt(yearMatch[1], 10);
      age = 2026 - birthYear;
    }

    try {
      const matchedUser = existingAuthUsers.find(u => u.email.toLowerCase() === user.email.toLowerCase());
      
      if (matchedUser) {
        status = '⚠️ postoji';
        userId = matchedUser.id;
      } else {
        // Create Auth User
        const createRes = await fetch(`${env.VITE_SUPABASE_URL}/auth/v1/admin/users`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            email: user.email,
            password: user.password,
            email_confirm: true,
            user_metadata: {
              name: user.name,
              phone: user.phone.trim(),
              dob: user.dob.trim()
            }
          })
        });

        if (!createRes.ok) {
          throw new Error(`Auth Error: ${await createRes.text()}`);
        }

        const created = await createRes.json();
        userId = created.id;
      }

      // 2. Upsert profile
      if (userId) {
        const teamKey = (TEAM_TRANSLATION[user.team.toLowerCase()] || '').toLowerCase();
        const teamId = teamNameMap[teamKey] || null;

        const upsertRes = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/profiles`, {
          method: 'POST',
          headers: {
            ...headers,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            id: userId,
            name: user.name,
            email: user.email,
            team_id: teamId,
            xp: 0,
            streak: 0,
            role: 'user',
            age: age,
            school_or_college: user.school || null
          })
        });

        if (!upsertRes.ok) {
          throw new Error(`Profile Upsert Error: ${await upsertRes.text()}`);
        }
      }

    } catch (err) {
      status = '❌ GREŠKA';
      error = err.message;
    }

    results.push({ status, email: user.email, name: user.name, password: user.password, team: user.team, error });
    console.log(`${status} ${user.name} (${user.email})`);
  }

  // Save to CSV
  const csv = [
    'status,name,email,password,team,error',
    ...results.map(r =>
      `"${r.status}","${r.name}","${r.email}","${r.password}","${r.team}","${r.error}"`
    )
  ].join('\n');

  const outPath = './scripts/camp_credentials_output.csv';
  fs.writeFileSync(outPath, csv, 'utf8');
  console.log(`\n💾 Rezultati spremljeni u: ${outPath}\n`);
}

main().catch(console.error);
