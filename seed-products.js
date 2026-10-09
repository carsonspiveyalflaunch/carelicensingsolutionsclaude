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
    .replace(/[^a-z0-9\-]/g, '');
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

const statePrograms = states.reduce((acc, state) => {
  acc[state.code] = [...programCategories];
  return acc;
}, {});

const specialPrograms = {
  AL: { program: 'Nursing Facility', bestValue: true },
  CA: { program: 'Group Home for Adults with Developmental Disabilities', bestValue: true },
  DE: { program: 'Adult Day Care Program', bestValue: true },
  IL: { program: 'Nursing Facility', bestValue: true },
  MN: { program: 'Nursing Facility', bestValue: true },
  NV: { program: 'Ambulatory Surgical Center', bestValue: true },
  NY: { program: 'Child Care Program', bestValue: true },
  TN: { program: 'Home Care Organization', bestValue: true },
  TX: { program: 'Adult Day Care Program', bestValue: true },
};

const generatedStateProducts = [];

states.forEach((state) => {
  const availablePrograms = statePrograms[state.code] || [];

  if (availablePrograms.length === 0) {
    const sp = specialPrograms[state.code];
    const program = sp?.program || 'Nursing Facility';
    availablePrograms.push(program);
  }

  availablePrograms.forEach((program) => {
    const special = specialPrograms[state.code];
    const isSpecial = special && special.program === program;

    generatedStateProducts.push({
      name: `${state.name} ${program} Complete Bundle`,
      product_slug: slugify(`${state.name} ${program} Complete Bundle`),
      description: `Everything you need for ${program} licensing and compliance in ${state.name}.`,
      price: 1297.0,
      type: 'bundle',
      state: state.name,
      code: state.code,
      program,
      product_label: 'Complete Bundle',
      tags: [state.name, program],
      stripe_product_id: null,
      stripe_price_id: null,
      skool_group_id: null,
      skool_course_id: null,
      ghl_tag: `bundle-${slugify(state.code + '-' + program)}`,
      features: [
        `${state.name}-specific licensing and compliance guidance`,
        'Editable policies, procedures, and forms',
        'State regulation checklist',
        'Application and inspection support',
        'Renewal readiness resources',
      ],
      metadata: {
        state: state.name,
        code: state.code,
        program,
        productLabel: 'Complete Bundle',
        bestValue: isSpecial ? true : false,
        tags: [state.name, program],
        format: 'PDF Format',
        download: true,
        flag: state.flag,
        logo: '/assets/images/logo-dark-bg.png',
        year: 2025,
      },
      is_active: true,
    });
  });
});

const generalProducts = [
  {
    name: 'Market Research Report',
    product_slug: 'market-research-report',
    description: 'Industry insights and market analysis for care businesses.',
    price: 397.0,
    type: 'bundle',
    state: 'General',
    code: 'MR',
    program: 'Market Research',
    product_label: 'Market Research Report',
    tags: ['Market Research'],
    stripe_product_id: null,
    stripe_price_id: null,
    skool_group_id: null,
    skool_course_id: null,
    ghl_tag: 'market-research-report',
    features: [
      'Market size and opportunity analysis',
      'Competitor benchmarking',
      'Growth trend insights',
      'Investor-ready summary',
    ],
    metadata: {
      state: 'General',
      code: 'MR',
      program: 'Market Research',
      productLabel: 'Market Research Report',
      bestValue: false,
      tags: ['Market Research'],
      format: 'PDF Format',
      download: true,
      flag: states.find((s) => s.code === 'AL').flag,
      logo: '/assets/images/logo-dark-bg.png',
      year: 2025,
    },
    is_active: true,
  },
  {
    name: 'Policy & Procedure Manual',
    product_slug: 'policy-procedure-manual',
    description: 'Complete policy templates and procedures for compliance.',
    price: 497.0,
    type: 'bundle',
    state: 'General',
    code: 'PM',
    program: 'Policies',
    product_label: 'Policy & Procedure Manual',
    tags: ['Policy & Procedure'],
    stripe_product_id: null,
    stripe_price_id: null,
    skool_group_id: null,
    skool_course_id: null,
    ghl_tag: 'policy-procedure-manual',
    features: [
      'Editable compliance templates',
      'Procedure workflow guides',
      'Regulatory policy language',
      'Documentation for inspections',
    ],
    metadata: {
      state: 'General',
      code: 'PM',
      program: 'Policies',
      productLabel: 'Policy & Procedure Manual',
      bestValue: false,
      tags: ['Policy & Procedure'],
      format: 'PDF Format',
      download: true,
      flag: states.find((s) => s.code === 'AL').flag,
      logo: '/assets/images/logo-dark-bg.png',
      year: 2025,
    },
    is_active: true,
  },
  {
    name: 'Pro Forma P&L Template',
    product_slug: 'pro-forma-pl-template',
    description: 'Professional financial projections and profit & loss templates.',
    price: 297.0,
    type: 'bundle',
    state: 'General',
    code: 'PL',
    program: 'Financial',
    product_label: 'Pro Forma P&L Template',
    tags: ['Financial Template'],
    stripe_product_id: null,
    stripe_price_id: null,
    skool_group_id: null,
    skool_course_id: null,
    ghl_tag: 'pro-forma-pl-template',
    features: [
      'Revenue and expense forecasting',
      'Cash flow planning',
      'Profit and loss reporting',
      'Editable Excel templates',
    ],
    metadata: {
      state: 'General',
      code: 'PL',
      program: 'Financial',
      productLabel: 'Pro Forma P&L Template',
      bestValue: false,
      tags: ['Financial Template'],
      format: 'Excel Format',
      download: true,
      flag: states.find((s) => s.code === 'AL').flag,
      logo: '/assets/images/logo-dark-bg.png',
      year: 2025,
    },
    is_active: true,
  },
  {
    name: 'Licensing Checklist',
    product_slug: 'licensing-checklist',
    description: 'Comprehensive licensing requirements and compliance checklist.',
    price: 397.0,
    type: 'bundle',
    state: 'General',
    code: 'LC',
    program: 'Checklist',
    product_label: 'Licensing Checklist',
    tags: ['Licensing Checklist'],
    stripe_product_id: null,
    stripe_price_id: null,
    skool_group_id: null,
    skool_course_id: null,
    ghl_tag: 'licensing-checklist',
    features: [
      'Step-by-step licensing tasks',
      'State and federal requirement overview',
      'Documentation tracking',
      'Inspection readiness guide',
    ],
    metadata: {
      state: 'General',
      code: 'LC',
      program: 'Checklist',
      productLabel: 'Licensing Checklist',
      bestValue: false,
      tags: ['Licensing Checklist'],
      format: 'PDF Format',
      download: true,
      flag: states.find((s) => s.code === 'AL').flag,
      logo: '/assets/images/logo-dark-bg.png',
      year: 2025,
    },
    is_active: true,
  },
];

const products = [...generatedStateProducts, ...generalProducts];

products.push({
  name: 'Care Licensing Solutions Operational Success Academy',
  product_slug: 'course-operational-success-academy',
  description: 'Complete 11-module video training system for care business licensing and operations.',
  price: 0.0,
  type: 'course',
  is_active: true,
  metadata: {
    course_type: 'operational-success-academy',
    enrollment_type: 'course',
  },
});

async function hasMetadataColumn() {
  const { error } = await supabase.from('products').select('metadata').limit(1);
  return !error;
}

async function runSeed() {
  const supportsMetadata = await hasMetadataColumn();
  const rows = supportsMetadata
    ? products
    : products.map(({ metadata, ...rest }) => rest);

  console.log(`Seeding ${rows.length} products into Supabase...`);
  if (!supportsMetadata) {
    console.warn('WARNING: products.metadata column not found. Seeding without metadata.');
  }

  const { data, error } = await supabase.from('products').upsert(rows, {
    onConflict: 'product_slug',
  }).select('id');

  if (error) {
    console.error('Supabase insert failed:', error.message || error);
    process.exit(1);
  }

  console.log(`Seed complete: ${data?.length ?? 0} product rows inserted or updated.`);
  process.exit(0);
}

runSeed().catch((error) => {
  console.error('Seed script failed:', error);
  process.exit(1);
});