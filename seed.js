import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const names = [
  "Arshad", "Kau", "Mohit", "Manoj", "Harshall", "Anshul", "Shrey", "Naved", "Anil", "Zariyab", "Adnan", "Vedang", "Vicky", "Mrudang",
  "Golu", "Subhav", "Shashank", "Karan P", "Arnav", "Krish", "Sudhanshu"
];

const allPlayers = names.map((name, index) => ({
  id: String(Date.now() + index),
  name: name,
  joinedAt: Date.now() + (index * 1000)
}));

async function seed() {
  const { data, error } = await supabase.from('game_state').update({
    all_players: allPlayers,
    matchup: null,
    teams_finalized: false
  }).eq('id', 1);

  if (error) {
    console.error("Error seeding data:", error);
  } else {
    console.log(`Successfully seeded ${names.length} players to Supabase!`);
  }
}

seed();
