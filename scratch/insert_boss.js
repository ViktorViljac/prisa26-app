import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// You need a service role key if RLS blocks anon inserts. But we can just use SQL directly if this fails.
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; 

const supabase = createClient(supabaseUrl, supabaseKey);

async function spawnBoss() {
  // First, find ANY active challenge to tie the boss to
  const { data: challenges } = await supabase
    .from('challenges')
    .select('id')
    .limit(1);
    
  if (!challenges || challenges.length === 0) {
    console.log("Nemate nijedan izazov u bazi. Boss mora biti vezan za neki izazov.");
    return;
  }

  const challengeId = challenges[0].id;

  const bossData = {
    name: 'Gospodar Lijenosti',
    description: 'Strašni gospodar koji želi usporiti tvoj napredak. Riješi vezanu naviku da mu naneseš štetu!',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Boss', // Random avatar
    max_hp: 5000,
    current_hp: 5000,
    challenge_id: challengeId,
    is_active: true
  };

  console.log("Spawning Boss...");
  const { data, error } = await supabase
    .from('arena_bosses')
    .insert([bossData])
    .select();

  if (error) {
    console.error("Neuspješno! RLS politike vjerojatno blokiraju anon_key za insert. Molimo pokrenite SQL skriptu izravno.");
    console.log(`
      -- KOPIRAJ OVO I POKRENI U SUPABASE SQL EDITORU:
      INSERT INTO arena_bosses (name, description, avatar_url, max_hp, current_hp, challenge_id, is_active)
      VALUES (
        'Gospodar Lijenosti', 
        'Strašni gospodar koji želi usporiti tvoj napredak. Riješi vezanu naviku da mu naneseš štetu!', 
        'https://api.dicebear.com/7.x/bottts/svg?seed=Boss', 
        5000, 
        5000, 
        (SELECT id FROM challenges LIMIT 1), 
        true
      );
    `);
    return;
  }

  console.log("Uspješno dodan Boss u bazu!");
  console.log(data);
}

spawnBoss();
