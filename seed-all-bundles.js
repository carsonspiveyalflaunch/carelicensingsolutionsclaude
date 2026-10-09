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

const states = [
  { code: 'AL', name: 'Alabama', flag: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Flag_of_Alabama.svg' },
  { code: 'AK', name: 'Alaska', flag: 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Flag_of_Alaska.svg' },
  { code: 'AZ', name: 'Arizona', flag: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Flag_of_Arizona.svg' },
  { code: 'AR', name: 'Arkansas', flag: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Flag_of_Arkansas.svg' },
  { code: 'CA', name: 'California', flag: 'https://upload.wikimedia.org/wikipedia/commons/0/01/Flag_of_California.svg' },
  { code: 'CO', name: 'Colorado', flag: 'https://upload.wikimedia.org/wikipedia/commons/4/46/Flag_of_Colorado.svg' },
  { code: 'CT', name: 'Connecticut', flag: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Flag_of_Connecticut.svg' },
  { code: 'DE', name: 'Delaware', flag: 'https://upload.wikimedia.org/wikipedia/commons/c/c6/Flag_of_Delaware.svg' },
  { code: 'FL', name: 'Florida', flag: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Flag_of_Florida.svg' },
  { code: 'GA', name: 'Georgia', flag: 'https://upload.wikimedia.org/wikipedia/commons/5/54/Flag_of_Georgia_%28U.S._state%29.svg' },
  { code: 'HI', name: 'Hawaii', flag: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Flag_of_Hawaii.svg' },
  { code: 'ID', name: 'Idaho', flag: 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Flag_of_Idaho.svg' },
  { code: 'IL', name: 'Illinois', flag: 'https://upload.wikimedia.org/wikipedia/commons/0/01/Flag_of_Illinois.svg' },
  { code: 'IN', name: 'Indiana', flag: 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Flag_of_Indiana.svg' },
  { code: 'IA', name: 'Iowa', flag: 'https://upload.wikimedia.org/wikipedia/commons/a/aa/Flag_of_Iowa.svg' },
  { code: 'KS', name: 'Kansas', flag: 'https://upload.wikimedia.org/wikipedia/commons/d/da/Flag_of_Kansas.svg' },
  { code: 'KY', name: 'Kentucky', flag: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Flag_of_Kentucky.svg' },
  { code: 'LA', name: 'Louisiana', flag: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Flag_of_Louisiana.svg' },
  { code: 'ME', name: 'Maine', flag: 'https://upload.wikimedia.org/wikipedia/commons/3/35/Flag_of_Maine.svg' },
  { code: 'MD', name: 'Maryland', flag: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Flag_of_Maryland.svg' },
  { code: 'MA', name: 'Massachusetts', flag: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Flag_of_Massachusetts.svg' },
  { code: 'MI', name: 'Michigan', flag: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Flag_of_Michigan.svg' },
  { code: 'MN', name: 'Minnesota', flag: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Flag_of_Minnesota.svg' },
  { code: 'MS', name: 'Mississippi', flag: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Flag_of_Mississippi.svg' },
  { code: 'MO', name: 'Missouri', flag: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Flag_of_Missouri.svg' },
  { code: 'MT', name: 'Montana', flag: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Flag_of_Montana.svg' },
  { code: 'NE', name: 'Nebraska', flag: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Flag_of_Nebraska.svg' },
  { code: 'NV', name: 'Nevada', flag: 'https://upload.wikimedia.org/wikipedia/commons/f/f8/Flag_of_Nevada.svg' },
  { code: 'NH', name: 'New Hampshire', flag: 'https://upload.wikimedia.org/wikipedia/commons/2/28/Flag_of_New_Hampshire.svg' },
  { code: 'NJ', name: 'New Jersey', flag: 'https://upload.wikimedia.org/wikipedia/commons/9/92/Flag_of_New_Jersey.svg' },
  { code: 'NM', name: 'New Mexico', flag: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Flag_of_New_Mexico.svg' },
  { code: 'NY', name: 'New York', flag: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Flag_of_New_York.svg' },
  { code: 'NC', name: 'North Carolina', flag: 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Flag_of_North_Carolina.svg' },
  { code: 'ND', name: 'North Dakota', flag: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Flag_of_North_Dakota.svg' },
  { code: 'OH', name: 'Ohio', flag: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Flag_of_Ohio.svg' },
  { code: 'OK', name: 'Oklahoma', flag: 'https://upload.wikimedia.org/wikipedia/commons/6/6e/Flag_of_Oklahoma.svg' },
  { code: 'OR', name: 'Oregon', flag: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Flag_of_Oregon.svg' },
  { code: 'PA', name: 'Pennsylvania', flag: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Flag_of_Pennsylvania.svg' },
  { code: 'RI', name: 'Rhode Island', flag: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Flag_of_Rhode_Island.svg' },
  { code: 'SC', name: 'South Carolina', flag: 'https://upload.wikimedia.org/wikipedia/commons/6/69/Flag_of_South_Carolina.svg' },
  { code: 'SD', name: 'South Dakota', flag: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Flag_of_South_Dakota.svg' },
  { code: 'TN', name: 'Tennessee', flag: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Flag_of_Tennessee.svg' },
  { code: 'TX', name: 'Texas', flag: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Flag_of_Texas.svg' },
  { code: 'UT', name: 'Utah', flag: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Flag_of_Utah.svg' },
  { code: 'VT', name: 'Vermont', flag: 'https://upload.wikimedia.org/wikipedia/commons/4/49/Flag_of_Vermont.svg' },
  { code: 'VA', name: 'Virginia', flag: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Flag_of_Virginia.svg' },
  { code: 'WA', name: 'Washington', flag: 'https://upload.wikimedia.org/wikipedia/commons/5/54/Flag_of_Washington.svg' },
  { code: 'WV', name: 'West Virginia', flag: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Flag_of_West_Virginia.svg' },
  { code: 'WI', name: 'Wisconsin', flag: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Flag_of_Wisconsin.svg' },
  { code: 'WY', name: 'Wyoming', flag: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Flag_of_Wyoming.svg' },
];

const programCategories = [
  'Assisted Living Facilities',
  'Nursing Facilities (SNF)',
  'Home Health Agencies',
  'Adult Day Care Programs',
  'Hospice Programs',
  'Child Care Facilities',
  'Group Homes for Children',
  'Personal Home Care',
  'Residential Care (DD)',
  'Residential Treatment (Children)',
];

// Base pricing for bundles
const basePrice = 1297.0;

// Standard 4 files for each bundle
const bundleFiles = [
  { label: 'Market Research Report', type: 'PDF' },
  { label: 'Pro Forma P&L Template', type: 'Excel' },
  { label: 'Policy & Procedure Manual', type: 'PDF' },
  { label: 'Licensing Checklist', type: 'PDF' },
];

async function clearExistingBundles() {
  console.log('Clearing existing bundles...');
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('type', 'bundle');
  
  if (error) {
    console.error(`Error clearing bundles: ${error.message}`);
    throw error;
  }
  console.log('✓ Cleared existing bundles');
}

async function generateBundles() {
  const bundles = [];
  
  states.forEach((state) => {
    programCategories.forEach((program) => {
      const bundleName = `${state.name} ${program} Complete Bundle`;
      const productSlug = slugify(bundleName);
      
      // Create file metadata for this bundle
      const files = bundleFiles.map((file, index) => ({
        label: file.label,
        name: `${productSlug}-file-${index + 1}.${file.type === 'Excel' ? 'xlsx' : 'pdf'}`,
        type: file.type,
        size: 0, // Will be updated when files are actually uploaded
        url: undefined,
        path: undefined,
      }));

      const bundle = {
        name: bundleName,
        description: `Complete ${program} compliance and operational bundle for ${state.name}. Includes market research, financial templates, policies, and licensing checklists.`,
        price: basePrice,
        type: 'bundle',
        product_slug: productSlug,
        state: state.name,
        code: state.code,
        program: program,
        product_label: 'Complete Bundle',
        tags: [state.name, program, 'Bundle', 'Complete'],
        ghl_tag: `bundle-${slugify(state.name)}-${slugify(program)}`,
        features: [
          `${state.name}-specific licensing and compliance guidance`,
          `Editable ${program} policies, procedures, and forms`,
          `State regulation checklist and inspection prep`,
          'Application and renewal readiness resources',
        ],
        metadata: {
          state: state.name,
          code: state.code,
          program: program,
          productLabel: 'Complete Bundle',
          bestValue: false,
          tags: [state.name, program, 'Bundle', 'Complete'],
          format: 'Bundle',
          download: true,
          flag: state.flag,
          year: new Date().getFullYear(),
          files: files,
          status: 'ready',
          quantity: 1,
        },
        is_active: true,
      };

      bundles.push(bundle);
    });
  });

  return bundles;
}

async function batchInsertBundles(bundles, batchSize = 100) {
  console.log(`\nInserting ${bundles.length} bundles in batches of ${batchSize}...`);
  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < bundles.length; i += batchSize) {
    const batch = bundles.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('products')
      .insert(batch)
      .select('id');

    if (error) {
      console.error(`✗ Batch ${Math.floor(i / batchSize) + 1} failed: ${error.message}`);
      failed += batch.length;
    } else {
      inserted += batch.length;
      console.log(`✓ Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} bundles inserted`);
    }
  }

  return { inserted, failed };
}

async function run() {
  try {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  BULK BUNDLE SEEDING - All States & Program Categories    ║');
    console.log('║  50 States × 10 Programs = 500 Bundles with 4 Files Each  ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Step 1: Clear existing bundles
    await clearExistingBundles();

    // Step 2: Generate all bundles
    console.log('\nGenerating bundle data...');
    const bundles = await generateBundles();
    console.log(`✓ Generated ${bundles.length} bundles`);

    // Step 3: Insert in batches
    const { inserted, failed } = await batchInsertBundles(bundles);

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    SEEDING COMPLETE                         ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║ Total Bundles Created: ${inserted.toString().padEnd(42)} ║`);
    console.log(`║ Failed: ${failed.toString().padEnd(49)} ║`);
    console.log(`║ Files Included: ${(inserted * 4).toString().padEnd(44)} ║`);
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║ Next Steps:                                                ║');
    console.log('║ 1. Go to Admin Panel > Upload Bundle                       ║');
    console.log('║ 2. Select state & program to upload files                  ║');
    console.log('║ 3. Upload the 4 files for each bundle                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    process.exit(inserted === bundles.length ? 0 : 1);
  } catch (error) {
    console.error('\n✗ ERROR:', error.message);
    process.exit(1);
  }
}

run();
