import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Must use SERVICE_ROLE_KEY to bypass RLS for inserts if RLS is tight,
// or ANON_KEY if RLS allows anon inserts (usually it doesn't).
// We'll use anon_key but assume RLS is disabled for this script, OR user can use SQL editor.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Replace with service role key if needed

const supabase = createClient(supabaseUrl, supabaseKey);

function generateRandomCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function generateCodes(achievementId, count = 10) {
  console.log(`Generating ${count} codes for achievement ${achievementId}...`);
  
  const codes = Array.from({ length: count }).map(() => ({
    achievement_id: achievementId,
    code: generateRandomCode(6),
    is_used: false
  }));

  const { data, error } = await supabase
    .from('achievement_codes')
    .insert(codes)
    .select();

  if (error) {
    console.error("Error inserting codes:", error);
    return;
  }

  console.log("Successfully generated codes:");
  data.forEach(row => {
    console.log(`- ${row.code}`);
  });
}

// Example usage:
// Replace with a real achievement_id from your database
const ACHIEVEMENT_ID = process.argv[2]; 
const COUNT = parseInt(process.argv[3]) || 10;

if (!ACHIEVEMENT_ID) {
  console.error("Usage: node generate_codes.js <achievement_id> [count]");
  process.exit(1);
}

generateCodes(ACHIEVEMENT_ID, COUNT);
