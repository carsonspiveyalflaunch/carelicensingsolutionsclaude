require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/\-+/g, '-')
    .replace(/^\-|\-$/g, '');
}

async function clearProducts() {
  const { error } = await supabase.from('products').delete().not('id', 'is', null);
  if (error) {
    throw new Error(`Failed to clear products: ${error.message}`);
  }
}

async function insertBundle(bundle) {
  const { data, error } = await supabase.from('products').insert([bundle]).select('*');
  if (error) {
    throw new Error(`Failed to insert Alabama bundle: ${error.message}`);
  }
  return data?.[0];
}

async function run() {
  console.log('Clearing existing product rows from products table...');
  await clearProducts();

  const alabamaBundle = {
    name: 'Alabama Nursing Facilities (SNF) Complete Bundle',
    description: 'Everything your Alabama Nursing Facilities (SNF) team needs for licensing, compliance, and operational readiness.',
    price: 1297.0,
    type: 'bundle',
    product_slug: slugify('Alabama Nursing Facilities (SNF) Complete Bundle'),
    state: 'Alabama',
    code: 'AL',
    program: 'Nursing Facilities (SNF)',
    product_label: 'Complete Bundle',
    tags: ['Alabama', 'Nursing Facilities (SNF)'],
    ghl_tag: 'bundle-alabama-nursing-facilities-snf',
    features: [
      'Alabama-specific licensing and compliance guidance',
      'Editable SNF policies, procedures, and forms',
      'State regulation checklist and inspection prep',
      'Application and renewal readiness resources',
    ],
    is_active: true,
  };

  const bundle = await insertBundle(alabamaBundle);
  console.log('Inserted Alabama bundle:', bundle);
}

run()
  .then(() => {
    console.log('Database seeding complete.');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
