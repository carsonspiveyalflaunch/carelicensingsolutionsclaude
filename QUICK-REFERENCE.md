# 🎯 Quick Reference - 500 Bundles Upload (Copy-Paste Commands)

## Setup (Do This Once)

### Step 1: Create the 500 bundles in database
```bash
node seed-all-bundles.js
```

**What happens:**
- Creates 500 bundle records
- Sets up metadata structure
- Ready to receive files
- Time: ~3 minutes
- Result: 500 empty bundles ✓

---

### Step 2: Upload all 2,000 files to storage
```bash
node seed-bundle-files.js ./bundle-files
```

**What happens:**
- Scans your ./bundle-files folder
- Finds 500 subdirectories (one per bundle)
- Reads all 4 files from each folder
- Uploads to Supabase storage
- Updates database with file URLs
- Time: ~10 minutes
- Result: 500 bundles with files ✓

---

## How It Works (Architecture)

### Your Local Files
```
bundle-files/
  └── alaska-assisted-living-facilities-complete-bundle/
      ├── licensing-checklist-*.pdf
      ├── market-research-report-*.pdf
      ├── policy-procedure-manual-*.pdf
      └── pro-forma-p-l-template-*.xlsx
  └── florida-assisted-living-facilities-complete-bundle/
      └── (4 files...)
  └── ... (500 folders)
```

### Folder Name Format
The script automatically extracts:
- **State**: `alaska`, `florida`, etc. → `AL`, `FL`, etc.
- **Program**: `assisted-living`, `nursing-facilities`, etc.

### File Name Detection
The script automatically detects file type from filename:
- Contains `market` + `research` → **Market Research Report**
- Contains `pro` + `forma` or `p&l` → **Pro Forma P&L Template**
- Contains `policy` + `procedure` → **Policy & Procedure Manual**
- Contains `licensing` + `checklist` → **Licensing Checklist**

---

## What's Stored Where

### Supabase Storage (`bundle-files` bucket)
```
bundles/
  ├── {bundleId-1}/
  │   ├── market-research-report.pdf
  │   ├── pro-forma-p-l-template.xlsx
  │   ├── policy-procedure-manual.pdf
  │   └── licensing-checklist.pdf
  ├── {bundleId-2}/
  │   └── (4 files...)
  └── ... (500 folders)
```

### Supabase Database (`products` table)
```sql
SELECT 
  id,
  name,
  metadata->>'files'  -- Contains array of 4 file objects
FROM products 
WHERE type = 'bundle';
```

Each file object:
```json
{
  "label": "Market Research Report",
  "name": "original-filename.pdf",
  "type": "PDF",
  "size": 2451234,
  "url": "https://cdn.../bundles/uuid/market-research-report.pdf",
  "path": "bundles/uuid/market-research-report.pdf"
}
```

---

## Complete Timeline

| Time | Action | Command |
|------|--------|---------|
| T+0 | Prepare files | Organize in 500 folders |
| T+0 | Create bundles | `node seed-all-bundles.js` |
| T+3 | Upload files | `node seed-bundle-files.js ./bundle-files` |
| T+13 | Complete! | 500 bundles with 2,000 files ✓ |

---

## Verify It Worked

### In Supabase Storage
1. Go to Supabase Dashboard
2. Storage → `bundle-files` → `bundles`
3. Should see 500 folders (each named with a UUID)
4. Click into one folder → should see 4 files

### In Supabase Database
1. Go to Supabase Dashboard
2. SQL Editor
3. Run this query:
```sql
SELECT 
  COUNT(*) as total_bundles,
  COUNT(CASE WHEN metadata->'files' != 'null' THEN 1 END) as with_files
FROM products 
WHERE type = 'bundle';
```
Expected: `total_bundles=500, with_files=500`

### Download a File
1. Go to your app's bundle page
2. Click "Download" on any bundle
3. Should see 4 download links
4. Click one → file downloads ✓

---

## Troubleshooting

### Error: "Directory not found"
```bash
# Make sure path is correct
node seed-bundle-files.js C:\path\to\bundle-files
```

### Error: "Bundle not found in database"
- First run `node seed-all-bundles.js`
- Verify bundles exist in database
- Then run file upload script

### Error: "File type unknown"
- File not detected as PDF/XLSX/DOC/DOCX/PPTX
- Check file extensions are correct
- Re-organize files and re-run

### Only some files uploaded
- Some files might be too large
- Check Supabase storage limits
- Run script again to retry

### Want to re-upload a file
- Just delete it from Supabase Storage
- Re-run the script
- It will re-upload

---

## Advanced: Manual Verification

### Check all 500 bundles are created
```bash
# Terminal/PowerShell
curl -X GET https://YOUR_SUPABASE_URL/rest/v1/products?type=eq.bundle&select=count \
  -H "apikey: YOUR_ANON_KEY"
```

### Check file uploads
```sql
SELECT 
  name,
  (metadata->'files')::jsonb as files,
  metadata->'files'->>0 as first_file
FROM products 
WHERE type = 'bundle'
LIMIT 1;
```

### Check storage usage
```sql
SELECT 
  COUNT(*) as total_files,
  SUM((metadata->'files'->0->>'size')::bigint) as total_size_bytes
FROM products 
WHERE type = 'bundle'
  AND metadata->'files' IS NOT NULL;
```

---

## Next: Selling Bundles

After upload is complete:

1. **Admin Panel**: Go to Bundles tab, verify all 500 show up
2. **Stripe Setup**: Sync bundles with Stripe products
3. **Shop Page**: All bundles automatically appear
4. **Customer Purchase**: Files automatically delivered on purchase
5. **Dashboard**: Customers can download files anytime

---

## Script Files Created

- `seed-all-bundles.js` - Creates 500 bundles
- `seed-bundle-files.js` - Uploads 2,000 files (UPDATED)
- `QUICK-START-BULK-BUNDLES.md` - Quick start guide
- `BULK-BUNDLE-SEEDING-GUIDE.md` - Detailed guide
- `UPLOAD-FLOW-DETAILED.md` - Complete flow breakdown
- `QUICK-REFERENCE.md` - This file

---

## Support

Each script has built-in error handling:
- Invalid folders → Skipped, logged
- Missing files → Skipped, logged
- Upload failures → Retryable
- Database errors → Shows reason

Re-run scripts anytime to fix issues or complete partial uploads.
