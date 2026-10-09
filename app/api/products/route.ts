import { NextResponse } from 'next/server';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/utils/supabase-server';
import { states } from '@/app/data/shopData';
import { normalizeBundleFileLabel } from '@/lib/bundles';

const DEFAULT_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'bundle-files';

function deriveMetadataFromName(product: any) {
  const defaultFlag = states.find((s) => s.code === 'AL')?.flag || '';
  const defaultLogo = '/assets/images/logo-dark-bg.png';
  const defaultYear = 2025;

  const genericMetadata = {
    state: 'General',
    code: '',
    program: 'General',
    productLabel: product.name || '',
    bestValue: false,
    tags: [],
    format: 'PDF Format',
    download: true,
    flag: defaultFlag,
    logo: defaultLogo,
    year: defaultYear,
  };

  if (!product.name) {
    return genericMetadata;
  }

  const generalProducts: Record<string, any> = {
    'Market Research Report': {
      code: 'MR',
      program: 'Market Research',
      productLabel: 'Market Research Report',
      tags: ['Market Research'],
    },
    'Policy & Procedure Manual': {
      code: 'PM',
      program: 'Policies',
      productLabel: 'Policy & Procedure Manual',
      tags: ['Policy & Procedure'],
    },
    'Pro Forma P&L Template': {
      code: 'PL',
      program: 'Financial',
      productLabel: 'Pro Forma P&L Template',
      tags: ['Financial Template'],
      format: 'Excel Format',
    },
    'Licensing Checklist': {
      code: 'LC',
      program: 'Checklist',
      productLabel: 'Licensing Checklist',
      tags: ['Licensing Checklist'],
    },
  };

  if (generalProducts[product.name]) {
    return {
      ...genericMetadata,
      ...generalProducts[product.name],
      state: 'General',
      flag: defaultFlag,
      logo: defaultLogo,
    };
  }

  const bundleMatch = product.name.match(/^(.*?) (.+?) Complete Bundle$/);
  if (bundleMatch) {
    const stateName = bundleMatch[1];
    const program = bundleMatch[2];
    const state = states.find((s) => s.name === stateName);
    return {
      ...genericMetadata,
      state: stateName,
      code: state?.code || '',
      program,
      productLabel: 'Complete Bundle',
      tags: [stateName, program],
      flag: state?.flag || defaultFlag,
      logo: defaultLogo,
    };
  }

  return genericMetadata;
}

function parseJsonField(value: any) {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  }
  return value;
}

async function listStorageFilesForBundle(supabase: any, bundleSlug: string) {
  try {
    const { data, error } = await supabase.storage
      .from(DEFAULT_STORAGE_BUCKET)
      .list(bundleSlug, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (error || !data || data.length === 0) {
      return [];
    }

    return data
      .filter((file: any) => file.name)
      .map((file: any) => {
        const path = `${bundleSlug}/${file.name}`;
        const filename = file.name;
        const label = filename
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]+/g, ' ')
          .replace(/\d+/g, '')
          .trim();
        const { data: publicUrlData } = supabase.storage
          .from(DEFAULT_STORAGE_BUCKET)
          .getPublicUrl(path);

        return {
          label: label || filename,
          name: filename,
          type: file.metadata?.contentType || 'application/octet-stream',
          size: file.size || 0,
          path,
          url: publicUrlData?.publicUrl,
        };
      });
  } catch {
    return [];
  }
}

async function fetchProductsWithMetadata(supabase: any, includeFiles = false) {
  const selectFields = '*';

  const { data, error } = await supabase
    .from('products')
    .select(selectFields)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error };
  }

  const products = await Promise.all((data || []).map(async (product: any) => {
    const metadata = parseJsonField(product.metadata);
    const features = parseJsonField(product.features);
    const normalizedMetadata = metadata && typeof metadata === 'object' ? metadata : undefined;
    const explicitTags = parseJsonField(product.tags);
    const explicitMetadata: any = {
      state: product.state || normalizedMetadata?.state,
      code: product.code || normalizedMetadata?.code,
      program: product.program || normalizedMetadata?.program,
      productLabel: product.product_label || normalizedMetadata?.productLabel,
      tags: Array.isArray(explicitTags)
        ? explicitTags
        : normalizedMetadata?.tags || [],
    };
    const normalizedFeatures = Array.isArray(features) ? features : [];
    const derivedMetadata = deriveMetadataFromName(product);
    const mergedMetadata = normalizedMetadata
      ? { ...derivedMetadata, ...normalizedMetadata, ...explicitMetadata }
      : { ...derivedMetadata, ...explicitMetadata };

    // Hydrate files for complete bundles too
    if (includeFiles && mergedMetadata.productLabel === 'Complete Bundle' && product.product_slug) {
      const storageFiles = await listStorageFilesForBundle(supabase, product.product_slug);
      if (storageFiles.length > 0) {
        mergedMetadata.files = storageFiles;
      }
    }

    return {
      ...product,
      metadata: mergedMetadata,
      features: normalizedFeatures,
    };
  }));

  return { data: products, error: null };
}

async function fetchIndividualBundlesForState(
  supabase: any,
  state: string,
  program?: string,
  includeFiles = true,
) {
  const normalizedState = state.trim();
  const matchedState = states.find(
    (s) => s.name.toLowerCase() === normalizedState.toLowerCase(),
  );
  const stateCode =
    matchedState?.code ||
    (normalizedState.length === 2 ? normalizedState.toUpperCase() : undefined);
  const exactState = matchedState?.name || normalizedState;
  const stateSlug = exactState
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  const normalizedProgram = program?.trim();

  const hydrateProductWithStorageFiles = async (product: any) => {
    const metadata = parseJsonField(product.metadata);
    if (Array.isArray(metadata?.files) && metadata.files.length > 0) {
      return product;
    }
    if (!product.product_slug) {
      return null;
    }

    const storageFiles = await listStorageFilesForBundle(supabase, product.product_slug);
    if (storageFiles.length === 0) {
      return null;
    }

    return {
      ...product,
      metadata: {
        ...metadata,
        files: storageFiles,
      },
    };
  };

  const queryBuilders = [
    () => {
      let query = supabase.from('products').select('*').eq('is_active', true).eq('state', exactState);
      return normalizedProgram ? query.eq('program', normalizedProgram) : query;
    },
    () => {
      let query = supabase.from('products').select('*').eq('is_active', true).ilike('state', exactState);
      return normalizedProgram ? query.eq('program', normalizedProgram) : query;
    },
    ...(stateCode
      ? [
          () => {
            let query = supabase.from('products').select('*').eq('is_active', true).eq('code', stateCode);
            return normalizedProgram ? query.eq('program', normalizedProgram) : query;
          },
        ]
      : []),
    () => {
      let query = supabase.from('products').select('*').eq('is_active', true).ilike('name', `%${exactState}%Individual Bundle`);
      return normalizedProgram ? query.eq('program', normalizedProgram) : query;
    },
    () => {
      let query = supabase.from('products').select('*').eq('is_active', true).ilike('name', `%${exactState}%Complete Bundle`);
      return normalizedProgram ? query.eq('program', normalizedProgram) : query;
    },
    ...(stateSlug
      ? [
          () => {
            let query = supabase.from('products').select('*').eq('is_active', true).ilike('product_slug', `%${stateSlug}%individual-bundle%`);
            return normalizedProgram ? query.eq('program', normalizedProgram) : query;
          },
          () => {
            let query = supabase.from('products').select('*').eq('is_active', true).ilike('product_slug', `%${stateSlug}%complete-bundle%`);
            return normalizedProgram ? query.eq('program', normalizedProgram) : query;
          },
        ]
      : []),
  ];

  const combinedResults: Record<string, any> = {};

  const queryResults = await Promise.all(queryBuilders.map((builder) => builder()));

  for (const { data, error } of queryResults) {
    if (error) {
      return { data: null, error };
    }
    if (data && data.length > 0) {
      for (const product of data) {
        const metadata = parseJsonField(product.metadata);
        const isMatchingCompleteBundle =
          (product.product_label || metadata?.productLabel) === 'Complete Bundle' &&
          (!normalizedProgram || (product.program || metadata?.program) === normalizedProgram);

        if (includeFiles && isMatchingCompleteBundle) {
          const hydrated = await hydrateProductWithStorageFiles(product);
          if (hydrated) {
            combinedResults[hydrated.id] = hydrated;
          }
        } else {
          combinedResults[product.id] = product;
        }
      }
    }
  }

  if (Object.keys(combinedResults).length === 0) {
    const fallbackConditions = [
      `state.ilike.%${exactState}%`,
      `name.ilike.%${exactState}%`,
      `product_slug.ilike.%${stateSlug}%`,
      ...(stateCode ? [`code.eq.${stateCode}`] : []),
    ];
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .or(fallbackConditions.join(','));

    if (error) {
      return { data: null, error };
    }
    if (data && data.length > 0) {
      data.forEach((product: any) => {
        const metadata = parseJsonField(product.metadata);
        if (Array.isArray(metadata?.files) && metadata.files.length > 0) {
          combinedResults[product.id] = product;
        }
      });
    }
  }

  const products = await Promise.all(
    Object.values(combinedResults).map(async (product: any) => {
      const metadata = parseJsonField(product.metadata);
      const features = parseJsonField(product.features);
      const normalizedMetadata = metadata && typeof metadata === 'object' ? metadata : undefined;
      const explicitTags = parseJsonField(product.tags);
      const explicitMetadata: any = {
        state: product.state || normalizedMetadata?.state,
        code: product.code || normalizedMetadata?.code,
        program: product.program || normalizedMetadata?.program,
        productLabel: product.product_label || normalizedMetadata?.productLabel,
        tags: Array.isArray(explicitTags)
          ? explicitTags
          : normalizedMetadata?.tags || [],
      };
      const normalizedFeatures = Array.isArray(features) ? features : [];
      const derivedMetadata = deriveMetadataFromName(product);
      const mergedMetadata = normalizedMetadata
        ? { ...derivedMetadata, ...normalizedMetadata, ...explicitMetadata }
        : { ...derivedMetadata, ...explicitMetadata };

      return {
        ...product,
        metadata: mergedMetadata,
        features: normalizedFeatures,
      };
    }),
  );

  return { data: products, error: null };
}


export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const supabase = createServerSupabaseClient();
  const url = new URL(request.url);
  const includeIndividual = url.searchParams.get('includeIndividual') === 'true';
  const state = url.searchParams.get('state');

  let result;
  if (includeIndividual && state) {
    // Fetch individual bundles for a specific state
    result = await fetchIndividualBundlesForState(
      supabase,
      state,
      url.searchParams.get('program') || undefined,
      url.searchParams.get('includeFiles') !== 'false',
    );
  } else if (!includeIndividual && state) {
    // Fetch complete bundles for a specific state
    result = await fetchIndividualBundlesForState(
      supabase,
      state,
      url.searchParams.get('program') || undefined,
      url.searchParams.get('includeFiles') !== 'false',
    );
  } else {
    // Fetch regular products (excluding individual bundles)
    result = await fetchProductsWithMetadata(supabase, false);
  }

  if (result.error) {
    return NextResponse.json(
      { error: result.error.message || 'Unable to load products from database' },
      { status: 500 },
    );
  }

  return NextResponse.json({ products: result.data || [] });
}
