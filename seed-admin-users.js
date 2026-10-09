require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(url, key);

async function findUserIdByEmail(email) {
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (!profileError && profileData?.id) {
    return profileData.id;
  }

  const { data: authData, error: authError } = await supabase
    .from('auth.users')
    .select('id')
    .eq('email', email)
    .single();

  if (!authError && authData?.id) {
    return authData.id;
  }

  return null;
}

async function createUser({ email, password, firstName, lastName, isAdmin }) {
  console.log(`Creating ${isAdmin ? 'admin' : 'customer'} user: ${email}`);

  let userId = null;
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
    },
  });

  if (error) {
    if (error.message?.includes('already been registered') || error.message?.includes('duplicate')) {
      console.warn(`User ${email} already exists. Looking up existing user id...`);
      userId = await findUserIdByEmail(email);
      if (!userId) {
        console.error(`Could not resolve existing user id for ${email}.`);
        return null;
      }
    } else {
      console.error(`Failed to create ${email}:`, error.message || error);
      return null;
    }
  } else {
    userId = data.user?.id;
  }

  if (!userId) {
    console.error(`No user id available for ${email}.`);
    return null;
  }

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    email,
    first_name: firstName,
    last_name: lastName,
    is_admin: isAdmin,
  }, { onConflict: 'id' });

  if (profileError) {
    console.error(`Failed to upsert profile for ${email}:`, profileError.message || profileError);

    if (profileError.message?.includes('is_admin')) {
      console.error('\nYour database schema does not include profiles.is_admin.');
      console.error('Apply the updated schema before running this script.');
      console.error('For example, run this in Supabase SQL editor:');
      console.error('  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;');
    }

    return null;
  }

  console.log(`${error ? 'Updated' : 'Created'} ${isAdmin ? 'admin' : 'customer'} user with id: ${userId}`);
  return userId;
}

async function main() {
  const admin = await createUser({
    email: 'admin@carelicensing.io',
    password: process.env.SEED_ADMIN_PASSWORD,
    firstName: 'Admin',
    lastName: 'User',
    isAdmin: true,
  });

  const customer = await createUser({
    email: 'customer@carelicensing.io',
    password: process.env.SEED_CUSTOMER_PASSWORD,
    firstName: 'Customer',
    lastName: 'User',
    isAdmin: false,
  });

  if (admin && customer) {
    console.log('\nSeed complete. Use these accounts to sign in:');
    console.log(`Admin: ${'admin@carelicensing.io'}`);
    console.log(`Customer: ${'customer@carelicensing.io'}`);
  } else {
    console.log('\nSeed completed with errors. Check logs above.');
  }
}

main().catch((error) => {
  console.error('Seed script failed:', error);
  process.exit(1);
});
