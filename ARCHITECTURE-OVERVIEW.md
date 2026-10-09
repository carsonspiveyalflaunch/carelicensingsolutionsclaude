# 📊 Complete Bundle Upload Architecture - Visual Guide

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      BUNDLE UPLOAD SYSTEM                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│   YOUR COMPUTER                SUPABASE (Cloud)                      │
│   ─────────────────           ────────────────                       │
│                                                                       │
│   Local Files                 Storage                Database         │
│   ──────────                  ─────────          ────────────         │
│   /bundle-files/              bucket-files       products table       │
│   ├── alaska-*                ├── bundles/       ├── id               │
│   ├── florida-*               │   ├── uuid-1/    ├── name             │
│   ├── georgia-*               │   │  ├── file1   ├── metadata         │
│   └── ... 497 more            │   │  ├── file2   │  └── files[]       │
│                               │   │  ├── file3   │      ├── url       │
│   500 folders                 │   │  └── file4   │      ├── path      │
│   2,000 files total           │   ├── uuid-2/    │      └── size      │
│                               │   │  └── files   │                    │
│                               │   └── ...        └── ... 500 rows     │
│                               └────────────────                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Flow

### **PHASE 1: Database Setup (3 minutes)**

```
┌────────────────────────────────────────────────────────────────────┐
│  Command: node seed-all-bundles.js                                  │
└────────────────────────────────────────────────────────────────────┘
                                ↓
┌────────────────────────────────────────────────────────────────────┐
│  Generates 500 bundle objects:                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Alabama Assisted Living Facilities Complete Bundle           │  │
│  │ Alaska Assisted Living Facilities Complete Bundle            │  │
│  │ Arizona Assisted Living Facilities Complete Bundle           │  │
│  │ ... (497 more bundles)                                       │  │
│  │ Wyoming Residential Treatment Complete Bundle                │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
                                ↓
┌────────────────────────────────────────────────────────────────────┐
│  Insert into Supabase: products table                               │
│  500 new rows with:                                                 │
│  • id: {uuid}                                                       │
│  • name: {state} {program} Complete Bundle                         │
│  • type: 'bundle'                                                   │
│  • metadata.files: [] (EMPTY - ready for files)                    │
│  • state, code, program                                             │
└────────────────────────────────────────────────────────────────────┘
                                ↓
                   ✓ 500 Bundles Created in DB
```

---

### **PHASE 2: File Upload (10 minutes)**

```
┌────────────────────────────────────────────────────────────────────┐
│  Command: node seed-bundle-files.js ./bundle-files                  │
└────────────────────────────────────────────────────────────────────┘
                                ↓
┌────────────────────────────────────────────────────────────────────┐
│  STEP 1: Scan Local Folders                                        │
│  ────────────────────────────                                      │
│  Found 500 directories:                                             │
│  • alaska-assisted-living-facilities-complete-bundle               │
│  • florida-assisted-living-facilities-complete-bundle              │
│  • florida-group-homes-for-children-complete-bundle                │
│  ... (497 more folders)                                             │
└────────────────────────────────────────────────────────────────────┘
                                ↓
┌────────────────────────────────────────────────────────────────────┐
│  STEP 2: Parse Folder Names & Find Matching Bundles               │
│  ───────────────────────────────────────────────────────            │
│  For each folder:                                                   │
│                                                                     │
│  Folder: "florida-nursing-facilities-snf-complete-bundle"         │
│    → Extract State: "florida" → "FL"                               │
│    → Extract Program: "nursing-facilities" → "Nursing Facilities"  │
│    → Query DB: WHERE code='FL' AND program='Nursing Facilities'   │
│    → Found: {id: "550e8400-...", name: "Florida Nursing..."}      │
│                                                                     │
│  Folder: "alaska-assisted-living-facilities-complete-bundle"      │
│    → Extract State: "alaska" → "AL"                               │
│    → Extract Program: "assisted-living" → "Assisted Living"        │
│    → Query DB: WHERE code='AL' AND program='Assisted Living'      │
│    → Found: {id: "550e8401-...", name: "Alaska Assisted..."}      │
│                                                                     │
│  ... (498 more folders)                                             │
│                                                                     │
│  Result: Matched 500 folders to 500 database bundles               │
└────────────────────────────────────────────────────────────────────┘
                                ↓
┌────────────────────────────────────────────────────────────────────┐
│  STEP 3: Read 4 Files from Each Folder                             │
│  ───────────────────────────────────────                           │
│  For each bundle folder, read:                                     │
│  • licensing-checklist-*.pdf (→ "Licensing Checklist")             │
│  • market-research-report-*.pdf (→ "Market Research Report")       │
│  • policy-procedure-manual-*.pdf (→ "Policy & Procedure Manual")   │
│  • pro-forma-p-l-template-*.xlsx (→ "Pro Forma P&L Template")      │
│                                                                     │
│  File label detection by filename:                                 │
│  • Contains "market" + "research" → Market Research Report         │
│  • Contains "pro" + "forma" or "p&l" → Pro Forma P&L Template      │
│  • Contains "policy" + "procedure" → Policy & Procedure Manual     │
│  • Contains "licensing" + "checklist" → Licensing Checklist        │
└────────────────────────────────────────────────────────────────────┘
                                ↓
┌────────────────────────────────────────────────────────────────────┐
│  STEP 4: Upload Files to Supabase Storage (Batch Process)          │
│  ──────────────────────────────────────────────────────             │
│  For each file:                                                     │
│                                                                     │
│  1. Read file from disk (e.g., "market-research-report.pdf")       │
│  2. Create storage path: bundles/{bundleId}/market-research-*.pdf  │
│  3. Upload to Supabase:                                             │
│     POST /storage/v1/object/bundle-files/bundles/{uuid}/file.pdf   │
│  4. Get public URL: https://cdn.../bundles/{uuid}/market-research..│
│  5. Store metadata object:                                          │
│     {                                                               │
│       label: "Market Research Report",                              │
│       name: "market-research-report-AK-ALF-001.pdf",               │
│       type: "PDF",                                                  │
│       size: 2451234,                                                │
│       url: "https://cdn.../bundles/{uuid}/market-research-report..",│
│       path: "bundles/{uuid}/market-research-report.pdf"             │
│     }                                                               │
│                                                                     │
│  Repeat for all 4 files × 500 bundles = 2,000 uploads              │
│  ────────────────────────────────────────                           │
│  Process in 10 batches of 50 bundles each                           │
│  (This gives a progress report every 10-15 seconds)                 │
└────────────────────────────────────────────────────────────────────┘
                                ↓
┌────────────────────────────────────────────────────────────────────┐
│  STEP 5: Update Bundle Metadata in Database                        │
│  ───────────────────────────────────────────                       │
│  For each bundle with uploaded files:                               │
│                                                                     │
│  UPDATE products                                                    │
│  SET metadata = {                                                   │
│    ...existing_metadata...,                                         │
│    files: [                                                         │
│      {label, name, type, size, url, path},  ← File 1               │
│      {label, name, type, size, url, path},  ← File 2               │
│      {label, name, type, size, url, path},  ← File 3               │
│      {label, name, type, size, url, path}   ← File 4               │
│    ]                                                                │
│  }                                                                  │
│  WHERE id = {bundleId}                                              │
│                                                                     │
│  Result: Each bundle now links to its 4 files                      │
└────────────────────────────────────────────────────────────────────┘
                                ↓
                   ✓ 2,000 Files Uploaded & Linked
```

---

## Data Structure Before & After

### Before: Empty Bundles (After Step 1)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Alabama Assisted Living Facilities Complete Bundle",
  "type": "bundle",
  "code": "AL",
  "program": "Assisted Living Facilities",
  "metadata": {
    "files": []  ← EMPTY
  }
}
```

### After: Bundles with Files (After Step 2)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Alabama Assisted Living Facilities Complete Bundle",
  "type": "bundle",
  "code": "AL",
  "program": "Assisted Living Facilities",
  "metadata": {
    "files": [
      {
        "label": "Market Research Report",
        "name": "market-research-report-AL-ALF-001.pdf",
        "type": "PDF",
        "size": 2451234,
        "url": "https://xyz.supabase.co/storage/v1/object/public/bundle-files/bundles/550e8400-e29b-41d4-a716-446655440000/market-research-report.pdf",
        "path": "bundles/550e8400-e29b-41d4-a716-446655440000/market-research-report.pdf"
      },
      {
        "label": "Pro Forma P&L Template",
        "name": "pro-forma-p-l-template-AL-ALF-001.xlsx",
        "type": "XLSX",
        "size": 912345,
        "url": "https://xyz.supabase.co/storage/v1/object/public/bundle-files/bundles/550e8400-e29b-41d4-a716-446655440000/pro-forma-p-l-template.xlsx",
        "path": "bundles/550e8400-e29b-41d4-a716-446655440000/pro-forma-p-l-template.xlsx"
      },
      {
        "label": "Policy & Procedure Manual",
        "name": "policy-procedure-manual-AL-ALF-001.pdf",
        "type": "PDF",
        "size": 3100234,
        "url": "https://xyz.supabase.co/storage/v1/object/public/bundle-files/bundles/550e8400-e29b-41d4-a716-446655440000/policy-procedure-manual.pdf",
        "path": "bundles/550e8400-e29b-41d4-a716-446655440000/policy-procedure-manual.pdf"
      },
      {
        "label": "Licensing Checklist",
        "name": "licensing-checklist-AL-ALF-001.pdf",
        "type": "PDF",
        "size": 451234,
        "url": "https://xyz.supabase.co/storage/v1/object/public/bundle-files/bundles/550e8400-e29b-41d4-a716-446655440000/licensing-checklist.pdf",
        "path": "bundles/550e8400-e29b-41d4-a716-446655440000/licensing-checklist.pdf"
      }
    ]
  }
}
```

---

## Final Storage Structure

### Supabase Storage (`bundle-files` bucket)
```
supabase/storage/bundle-files/
└── bundles/
    ├── 550e8400-e29b-41d4-a716-446655440000/      ← Bundle 1 (AL-ALF)
    │   ├── market-research-report.pdf
    │   ├── pro-forma-p-l-template.xlsx
    │   ├── policy-procedure-manual.pdf
    │   └── licensing-checklist.pdf
    ├── 550e8401-a40c-42e5-b825-557766551111/      ← Bundle 2 (AL-NFH)
    │   ├── market-research-report.pdf
    │   ├── pro-forma-p-l-template.xlsx
    │   ├── policy-procedure-manual.pdf
    │   └── licensing-checklist.pdf
    ├── 550e8402-b51d-53f6-c936-668877662222/      ← Bundle 3 (AL-HHA)
    │   └── (4 files...)
    │
    ├── ... (497 more bundle folders) ...
    │
    └── 550e98ef-ffff-ffff-ffff-zzzzzzzzzzz0/      ← Bundle 500 (WY-RTC)
        ├── market-research-report.pdf
        ├── pro-forma-p-l-template.xlsx
        ├── policy-procedure-manual.pdf
        └── licensing-checklist.pdf

Total: 500 folders × 4 files = 2,000 files
```

### Supabase Database (`products` table)
```
SELECT id, name, code, program, 
       jsonb_array_length(metadata->'files') as file_count
FROM products 
WHERE type = 'bundle';

Results:
┌─────────────────────────────────────────┬───────────────────────────────────┬─────┬──────────────────────────────┬────────────┐
│ id                                      │ name                              │ code│ program                      │ file_count │
├─────────────────────────────────────────┼───────────────────────────────────┼─────┼──────────────────────────────┼────────────┤
│ 550e8400-e29b-41d4-a716-446655440000  │ Alabama Assisted Living...        │ AL  │ Assisted Living Facilities   │ 4          │
│ 550e8401-a40c-42e5-b825-557766551111  │ Alabama Nursing Facilities...     │ AL  │ Nursing Facilities (SNF)     │ 4          │
│ 550e8402-b51d-53f6-c936-668877662222  │ Alabama Home Health Agencies...   │ AL  │ Home Health Agencies         │ 4          │
│ ... (497 more rows) ...                │ ...                               │ ... │ ...                          │ 4          │
│ 550e98ef-ffff-ffff-ffff-zzzzzzzzzzz0  │ Wyoming Residential Treatment... │ WY  │ Residential Treatment...     │ 4          │
└─────────────────────────────────────────┴───────────────────────────────────┴─────┴──────────────────────────────┴────────────┘

Total: 500 rows (all with 4 files each)
```

---

## How Customers Access Files

```
Customer purchases bundle
        ↓
App fetches bundle from database
        ↓
Renders 4 download buttons with metadata.files[].url
        ↓
Customer clicks "Download Market Research Report"
        ↓
Browser navigates to:
https://xyz.supabase.co/storage/v1/object/public/bundle-files/bundles/550e8400.../market-research-report.pdf
        ↓
Supabase CDN serves file (cached for 1 hour)
        ↓
File downloads to customer's device
        ↓
✓ Download complete!
```

---

## Execution Timeline

```
Time    Action                              Duration    Command
────────────────────────────────────────────────────────────────────────
T+0:00  Start                               -           -
T+0:00  Create 500 bundles in database      3 min       node seed-all-bundles.js
T+3:00  All bundles created                 -           ✓
T+3:00  Scan 500 local folders              1 min       node seed-bundle-files.js ...
T+4:00  Parse folder names & find bundles   1 min       (automatic)
T+5:00  Upload 2,000 files to storage       ~5 min      (5 files/sec avg)
T+10:00 Update 500 bundle records in DB     1 min       (batch update)
T+11:00 Generate report                     1 min       (display summary)
────────────────────────────────────────────────────────────────────────
T+13:00 ✓ COMPLETE: 500 bundles × 4 files ready to sell
```

---

## Verification Checklist

After both scripts complete:

- [ ] Database has 500 bundle records
- [ ] Each bundle has 4 file objects in metadata.files[]
- [ ] Supabase Storage has 500 folders (one per bundle)
- [ ] Each storage folder has exactly 4 files
- [ ] Each file has a valid public URL
- [ ] Download links work from customer perspective
- [ ] File sizes are correct in metadata
- [ ] File types are correctly identified (PDF/XLSX)

---

## Key Metrics

| Metric | Value |
|--------|-------|
| Total Bundles | 500 |
| Total Files | 2,000 |
| States | 50 |
| Programs per State | 10 |
| Files per Bundle | 4 |
| Average File Size | ~2.5 MB |
| Total Storage Size | ~10 GB |
| Upload Time | ~10 minutes |
| Setup Time | ~13 minutes |
| Success Rate Target | 100% |

---

## Next Steps

1. Run `node seed-all-bundles.js`
2. Verify 500 bundles created in database
3. Run `node seed-bundle-files.js ./bundle-files`
4. Verify 2,000 files uploaded to storage
5. Bundles are now ready to sell!
