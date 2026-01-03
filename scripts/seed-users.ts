import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const required = [
  'SEED_ADMIN_USERNAME',
  'SEED_ADMIN_PASSWORD',
  'SEED_ADMIN_DISPLAY',
  'SEED_TRAINEE1_USERNAME',
  'SEED_TRAINEE1_PASSWORD',
  'SEED_TRAINEE1_DISPLAY',
  'SEED_TRAINEE2_USERNAME',
  'SEED_TRAINEE2_PASSWORD',
  'SEED_TRAINEE2_DISPLAY',
  'SEED_TRAINEE3_USERNAME',
  'SEED_TRAINEE3_PASSWORD',
  'SEED_TRAINEE3_DISPLAY'
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing ${key}`);
  }
}

const users = [
  {
    username: process.env.SEED_ADMIN_USERNAME as string,
    password: process.env.SEED_ADMIN_PASSWORD as string,
    display_name: process.env.SEED_ADMIN_DISPLAY as string,
    role: 'admin' as const
  },
  {
    username: process.env.SEED_TRAINEE1_USERNAME as string,
    password: process.env.SEED_TRAINEE1_PASSWORD as string,
    display_name: process.env.SEED_TRAINEE1_DISPLAY as string,
    role: 'user' as const
  },
  {
    username: process.env.SEED_TRAINEE2_USERNAME as string,
    password: process.env.SEED_TRAINEE2_PASSWORD as string,
    display_name: process.env.SEED_TRAINEE2_DISPLAY as string,
    role: 'user' as const
  },
  {
    username: process.env.SEED_TRAINEE3_USERNAME as string,
    password: process.env.SEED_TRAINEE3_PASSWORD as string,
    display_name: process.env.SEED_TRAINEE3_DISPLAY as string,
    role: 'user' as const
  }
];

async function seed() {
  for (const user of users) {
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', user.username)
      .maybeSingle();

    if (existing) {
      console.log(`User exists: ${user.username}`);
      continue;
    }

    const password_hash = await bcrypt.hash(user.password, 10);
    const { error } = await supabaseAdmin.from('users').insert({
      username: user.username,
      password_hash,
      display_name: user.display_name,
      role: user.role
    });

    if (error) {
      throw error;
    }

    console.log(`Created user: ${user.username}`);
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
