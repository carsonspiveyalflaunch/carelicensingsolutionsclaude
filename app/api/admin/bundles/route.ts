import { NextResponse } from 'next/server';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/utils/supabase-server';

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
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

function normalizeMetadata(value: any) {
  const parsed = parseJsonField(value);
  const metadata =
    parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : value && typeof value === 'object' && !Array.isArray(value)
      ? value
      : {};

  const tags = Array.isArray(metadata.tags)
    ? metadata.tags.filter(Boolean).map(String)
    : typeof metadata.tags === 'string'
    ? metadata.tags
        .split(',')
        .map((item: string) => item.trim())
        .filter(Boolean)
    : [];

  return {
    ...metadata,
    state: metadata.state ?? undefined,
    code: metadata.code ?? undefined,
    program: metadata.program ?? undefined,
    productLabel: metadata.productLabel ?? undefined,
    bestValue: metadata.bestValue === true || metadata.bestValue === 'true',
    tags,
    format: metadata.format ?? undefined,
    download: metadata.download !== false && metadata.download !== 'false',
    flag: metadata.flag ?? undefined,
    logo: metadata.logo ?? undefined,
    year: metadata.year != null ? Number(metadata.year) || 2025 : undefined,
    status: metadata.status ?? undefined,
    quantity:
      metadata.quantity != null
        ? Number(metadata.quantity) || 0
        : undefined,
    files: Array.isArray(metadata.files) ? metadata.files : undefined,
    is_individual:
      metadata.is_individual === true || metadata.is_individual === 'true'
        ? true
        : undefined,
  };
}

function normalizeFeatures(value: any) {
  const parsed = parseJsonField(value);
  if (Array.isArray(parsed)) {
    return parsed.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item: string) => item.trim())
      .filter(Boolean);
  }
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
}

function normalizeBundleRow(row: any) {
  if (!row) {
    return row;
  }

  const metadata = normalizeMetadata(row.metadata) || {};
  const explicitTags = parseJsonField(row.tags);
  const explicitMetadata = {
    state: row.state ?? metadata.state,
    code: row.code ?? metadata.code,
    program: row.program ?? metadata.program,
    productLabel: row.product_label ?? metadata.productLabel,
    tags: Array.isArray(explicitTags) ? explicitTags : metadata.tags || [],
  };
  const features = normalizeFeatures(row.features) || [];

  return {
    ...row,
    metadata: {
      ...metadata,
      ...explicitMetadata,
    },
    features,
  };
}

async function fetchBundles(supabase: any) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('type', 'bundle')
    .order('created_at', { ascending: false });

  return { data: (data || []).map(normalizeBundleRow), error };
}

async function fetchBundleById(supabase: any, id: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  return { data: normalizeBundleRow(data), error };
}

function stripMetadataColumn(data: any) {
  const copy = { ...data };
  delete copy.metadata;
  return copy;
}

function stripMetadataAndExplicitColumns(data: any) {
  const copy = { ...data };
  delete copy.metadata;
  delete copy.state;
  delete copy.code;
  delete copy.program;
  delete copy.product_label;
  delete copy.tags;
  return copy;
}

function isMissingColumnError(error: any) {
  return (
    error?.message?.includes("Could not find the '") ||
    (error?.message?.includes("column") && error?.message?.includes("does not exist"))
  );
}

async function tryUpdateBundle(supabase: any, id: string, updateData: any) {
  let result = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select('*');

  if (result.error && isMissingColumnError(result.error)) {
    const metadataRemoved = stripMetadataColumn(updateData);
    result = await supabase
      .from('products')
      .update(metadataRemoved)
      .eq('id', id)
      .select('*');

    if (result.error && isMissingColumnError(result.error)) {
      result = await supabase
        .from('products')
        .update(stripMetadataAndExplicitColumns(updateData))
        .eq('id', id)
        .select('*');
    }
  }

  return result;
}

async function tryInsertBundle(supabase: any, bundle: any) {
  let result = await supabase
    .from('products')
    .insert([bundle])
    .select('*');

  if (result.error && isMissingColumnError(result.error)) {
    const metadataRemoved = stripMetadataColumn(bundle);
    result = await supabase
      .from('products')
      .insert([metadataRemoved])
      .select('*');

    if (result.error && isMissingColumnError(result.error)) {
      result = await supabase
        .from('products')
        .insert([stripMetadataAndExplicitColumns(bundle)])
        .select('*');
    }
  }

  return result;
}

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const supabase = createServerSupabaseClient();

  if (id) {
    const { data, error } = await fetchBundleById(supabase, id);
    if (error) {
      return NextResponse.json({ error: error.message || 'Unable to load bundle' }, { status: 500 });
    }
    return NextResponse.json({ bundle: data || null });
  }

  const { data, error } = await fetchBundles(supabase);

  if (error) {
    return NextResponse.json({ error: error.message || 'Unable to load bundles' }, { status: 500 });
  }

  return NextResponse.json({ bundles: data || [] });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const payload = await request.json().catch(() => null);
  if (!payload || !payload.name || payload.price == null) {
    return NextResponse.json({ error: 'Missing required bundle fields' }, { status: 400 });
  }

  const price = Number(payload.price);
  if (Number.isNaN(price)) {
    return NextResponse.json({ error: 'Invalid bundle price' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const metadata = normalizeMetadata(payload.metadata) ?? {
    productLabel: 'Complete Bundle',
    status: 'Active',
    quantity: 0,
  };
  const state = payload.state ?? metadata.state;
  const code = payload.code ?? metadata.code;
  const program = payload.program ?? metadata.program;
  const productLabel =
    payload.product_label ?? payload.productLabel ?? metadata.productLabel;
  const tags = payload.tags ?? metadata.tags;

  const bundle = {
    name: payload.name.trim(),
    description: payload.description || '',
    price,
    type: 'bundle',
    product_slug: payload.product_slug || slugify(payload.name),
    metadata,
    state,
    code,
    program,
    product_label: productLabel,
    tags,
    features: normalizeFeatures(payload.features),
    is_active: payload.is_active !== false,
  };

  const { data, error } = await tryInsertBundle(supabase, bundle);
  if (error) {
    console.error('Admin bundle create error', { payload, bundle, error });
    return NextResponse.json({ error: error.message || 'Unable to create bundle' }, { status: 500 });
  }

  return NextResponse.json({ bundle: data?.[0] || null }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const payload = await request.json().catch(() => null);

  if (!id || !payload) {
    return NextResponse.json({ error: 'Missing bundle id or payload' }, { status: 400 });
  }

  const updateData: any = {};
  if (payload.name) {
    updateData.name = payload.name.trim();
  }
  if (payload.product_slug !== undefined) {
    updateData.product_slug = payload.product_slug || slugify(payload.name || payload.product_slug || '');
  } else if (payload.name) {
    updateData.product_slug = slugify(payload.name);
  }
  if (payload.description !== undefined) {
    updateData.description = payload.description;
  }
  if (payload.price !== undefined) {
    const price = Number(payload.price);
    if (Number.isNaN(price)) {
      return NextResponse.json({ error: 'Invalid bundle price' }, { status: 400 });
    }
    updateData.price = price;
  }
  if (payload.metadata !== undefined) {
    const metadata = normalizeMetadata(payload.metadata);
    updateData.metadata = metadata;
    updateData.state = metadata.state;
    updateData.code = metadata.code;
    updateData.program = metadata.program;
    updateData.product_label = metadata.productLabel;
    updateData.tags = metadata.tags;
  }
  if (payload.state !== undefined) {
    updateData.state = payload.state;
  }
  if (payload.code !== undefined) {
    updateData.code = payload.code;
  }
  if (payload.program !== undefined) {
    updateData.program = payload.program;
  }
  if (payload.product_label !== undefined || payload.productLabel !== undefined) {
    updateData.product_label = payload.product_label ?? payload.productLabel;
  }
  if (payload.tags !== undefined) {
    updateData.tags = payload.tags;
  }
  if (payload.features !== undefined) {
    updateData.features = normalizeFeatures(payload.features);
  }
  if (payload.is_active !== undefined) {
    updateData.is_active = payload.is_active;
  }
  updateData.type = 'bundle';

  const supabase = createServerSupabaseClient();
  const { data, error } = await tryUpdateBundle(supabase, id, updateData);

  if (error) {
    console.error('Admin bundle update error', { id, payload, updateData, error });
    return NextResponse.json({ error: error.message || 'Unable to update bundle' }, { status: 500 });
  }

  return NextResponse.json({ bundle: data?.[0] || null });
}

export async function DELETE(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing bundle id' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('products').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message || 'Unable to delete bundle' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
