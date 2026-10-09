-- SQL INSERT statements for products table
-- Generated from seed-products.js
-- Run this in your Supabase SQL Editor

-- First, let's check if the products table exists and has the right structure
-- If not, run the supabase-schema.sql first

-- Insert general products first
INSERT INTO products (
  name,
  description,
  price,
  type,
  product_slug,
  state,
  code,
  program,
  product_label,
  tags,
  stripe_product_id,
  stripe_price_id,
  skool_group_id,
  skool_course_id,
  ghl_tag,
  features,
  metadata,
  is_active
) VALUES
(
  'Market Research Report',
  'Comprehensive market analysis and competitive research templates.',
  197.0,
  'bundle',
  'market-research-report',
  'General',
  'MR',
  'Research',
  'Market Research Report',
  '["Market Research"]',
  NULL,
  NULL,
  NULL,
  NULL,
  'market-research-report',
  '["Editable market analysis templates", "Competitive research frameworks", "Demographic data guides", "Market opportunity assessments"]',
  '{
    "state": "General",
    "code": "MR",
    "program": "Research",
    "productLabel": "Market Research Report",
    "bestValue": false,
    "tags": ["Market Research"],
    "format": "PDF Format",
    "download": true,
    "flag": "https://upload.wikimedia.org/wikipedia/commons/5/5c/Flag_of_Alabama.svg",
    "logo": "/assets/images/logo-dark-bg.png",
    "year": 2025
  }',
  true
),
(
  'Policy & Procedure Manual',
  'Complete policy templates and procedures for compliance.',
  497.0,
  'bundle',
  'policy-procedure-manual',
  'General',
  'PM',
  'Policies',
  'Policy & Procedure Manual',
  '["Policy & Procedure"]',
  NULL,
  NULL,
  NULL,
  NULL,
  'policy-procedure-manual',
  '["Editable compliance templates", "Procedure workflow guides", "Regulatory policy language", "Documentation for inspections"]',
  '{
    "state": "General",
    "code": "PM",
    "program": "Policies",
    "productLabel": "Policy & Procedure Manual",
    "bestValue": false,
    "tags": ["Policy & Procedure"],
    "format": "PDF Format",
    "download": true,
    "flag": "https://upload.wikimedia.org/wikipedia/commons/5/5c/Flag_of_Alabama.svg",
    "logo": "/assets/images/logo-dark-bg.png",
    "year": 2025
  }',
  true
),
(
  'Pro Forma P&L Template',
  'Professional financial projections and profit & loss templates.',
  297.0,
  'bundle',
  'pro-forma-pl-template',
  'General',
  'PL',
  'Financial',
  'Pro Forma P&L Template',
  '["Financial Template"]',
  NULL,
  NULL,
  NULL,
  NULL,
  'pro-forma-pl-template',
  '["Financial projection templates", "Profit & loss worksheets", "Cash flow forecasting", "Break-even analysis tools"]',
  '{
    "state": "General",
    "code": "PL",
    "program": "Financial",
    "productLabel": "Pro Forma P&L Template",
    "bestValue": false,
    "tags": ["Financial Template"],
    "format": "PDF Format",
    "download": true,
    "flag": "https://upload.wikimedia.org/wikipedia/commons/5/5c/Flag_of_Alabama.svg",
    "logo": "/assets/images/logo-dark-bg.png",
    "year": 2025
  }',
  true
),
(
  'Licensing Checklist',
  'Step-by-step licensing application and renewal checklists.',
  97.0,
  'bundle',
  'licensing-checklist',
  'General',
  'LC',
  'Licensing',
  'Licensing Checklist',
  '["Licensing Checklist"]',
  NULL,
  NULL,
  NULL,
  NULL,
  'licensing-checklist',
  '["Application checklists", "Document requirement lists", "Timeline tracking sheets", "Renewal reminder templates"]',
  '{
    "state": "General",
    "code": "LC",
    "program": "Licensing",
    "productLabel": "Licensing Checklist",
    "bestValue": false,
    "tags": ["Licensing Checklist"],
    "format": "PDF Format",
    "download": true,
    "flag": "https://upload.wikimedia.org/wikipedia/commons/5/5c/Flag_of_Alabama.svg",
    "logo": "/assets/images/logo-dark-bg.png",
    "year": 2025
  }',
  true
)
ON CONFLICT (product_slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  metadata = EXCLUDED.metadata,
  features = EXCLUDED.features,
  updated_at = NOW();

-- Note: State-specific bundles would need to be added separately
-- The JavaScript seed file generates these dynamically
-- For now, you can add specific state bundles manually or run the JS seed script