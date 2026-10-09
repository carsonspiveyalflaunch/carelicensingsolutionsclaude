# 🚀 Complete Bundle Upload Flow - Detailed Breakdown

## 📁 Your Current File Structure

```
bundle-files/
├── alaska-assisted-living-facilities-complete-bundle/
│   ├── licensing-checklist-AK-ALF-001.pdf
│   ├── market-research-report-AK-ALF-001.pdf
│   ├── policy-procedure-manual-AK-ALF-001.pdf
│   └── pro-forma-p-l-template-AK-ALF-001.xlsx
├── florida-assisted-living-facilities-complete-bundle/
│   ├── licensing-checklist-FL-ALF-001.pdf
│   ├── market-research-report-FL-ALF-001.pdf
│   ├── policy-procedure-manual-FL-ALF-001.pdf
│   └── pro-forma-p-l-template-FL-ALF-001.xlsx
├── florida-group-homes-for-children-complete-bundle/
│   └── (4 files...)
├── florida-hospice-programs-complete-bundle/
│   └── (4 files...)
├── florida-nursing-facilities-snf-complete-bundle/
│   └── (4 files...)
└── ... (500 folders total)
```

---

## 🔄 Complete Upload Process Flow

### **PHASE 1: Scan & Parse Folders**

```
Input: bundle-files/ directory
         ↓
    ┌─────────────────────────────────────────────────────────┐
    │ SCRIPT: Find all subdirectories                          │
    │ Filter: Only folders with 4 files                        │
    └─────────────────────────────────────────────────────────┘
         ↓
    ┌─────────────────────────────────────────────────────────┐
    │ EXTRACT STATE CODE from folder name                      │
    │ Pattern: alaska-xxx → "AL"                              │
    │ Pattern: florida-xxx → "FL"                             │
    │ Mapping: Uses stateMap dictionary                        │
    └─────────────────────────────────────────────────────────┘
         ↓
    ┌─────────────────────────────────────────────────────────┐
    │ EXTRACT PROGRAM from folder name                        │
    │ Pattern: xxx-assisted-living-xxx → "Assisted Living..."│
    │ Pattern: xxx-nursing-facilities-xxx → "Nursing..."     │
    │ Mapping: Uses programMap dictionary                     │
    └─────────────────────────────────────────────────────────┘
         ↓
    ┌─────────────────────────────────────────────────────────┐
    │ RESULT: Parsed Bundles                                  │
    │ {                                                        │
    │   "AL-Assisted Living Facilities": {                    │
    │     state: "AL",                                        │
    │     program: "Assisted Living Facilities",              │
    │     files: {                                            │
    │       "Market Research Report": "./...file.pdf",        │
    │       "Pro Forma P&L Template": "./...file.xlsx",       │
    │       "Policy & Procedure Manual": "./...file.pdf",     │
    │       "Licensing Checklist": "./...file.pdf"            │
    │     }                                                    │
    │   },                                                     │
    │   "FL-Assisted Living Facilities": { ... },             │
    │   ...                                                    │
    │ }                                                        │
    └─────────────────────────────────────────────────────────┘
```

### **PHASE 2: Find Bundle in Database**

```
For each parsed bundle (AL-Assisted Living Facilities):
         ↓
    ┌─────────────────────────────────────────────────────────┐
    │ QUERY: products table                                   │
    │   WHERE type = 'bundle'                                │
    │   AND code = 'AL'                                      │
    │   AND program ILIKE '%Assisted%'                       │
    │                                                         │
    │ RESULT: Returns bundleId from Step 1                   │
    │   id: "550e8400-e29b-41d4-a716-446655440000"           │
    │   name: "Alabama Assisted Living Facilities..."        │
    │   code: "AL"                                           │
    │   program: "Assisted Living Facilities"                │
    └─────────────────────────────────────────────────────────┘
         ↓
    Status: ✓ Bundle found → Continue to upload
    Status: ✗ Bundle not found → Skip this folder
```

### **PHASE 3: Upload Files to Supabase Storage**

```
For each of 4 files in the bundle folder:
         ↓
    ┌─────────────────────────────────────────────────────────┐
    │ STEP 1: Read file from disk                             │
    │ FilePath: ./bundle-files/alaska-assisted-living.../...  │
    │ FileSize: 2.4 MB                                        │
    └─────────────────────────────────────────────────────────┘
         ↓
    ┌─────────────────────────────────────────────────────────┐
    │ STEP 2: Detect file label from filename                │
    │ Filename: "market-research-report-AK-ALF-001.pdf"      │
    │ Contains "market" + "research"                          │
    │ → Label: "Market Research Report"                       │
    └─────────────────────────────────────────────────────────┘
         ↓
    ┌─────────────────────────────────────────────────────────┐
    │ STEP 3: Create storage path                             │
    │ Pattern: bundles/{bundleId}/{label-slug}.{ext}          │
    │ Example: bundles/550e8400.../market-research-report.pdf │
    │                                                         │
    │ This creates folder structure:                          │
    │ supabase/storage/bundle-files/                          │
    │   └── bundles/                                          │
    │       └── 550e8400-e29b-41d4-a716-446655440000/         │
    │           ├── market-research-report.pdf                │
    │           ├── pro-forma-p-l-template.xlsx               │
    │           ├── policy-procedure-manual.pdf               │
    │           └── licensing-checklist.pdf                   │
    └─────────────────────────────────────────────────────────┘
         ↓
    ┌─────────────────────────────────────────────────────────┐
    │ STEP 4: Upload to Supabase Storage                      │
    │ POST /storage/v1/object/bundle-files/bundles/...        │
    │ Body: File binary content                               │
    │ Result: File stored in Supabase                         │
    └─────────────────────────────────────────────────────────┘
         ↓
    ┌─────────────────────────────────────────────────────────┐
    │ STEP 5: Get public URL                                  │
    │ getPublicUrl("bundles/550e8400.../market-research...")  │
    │ Returns: https://...cdn.../bundles/550e8400.../...      │
    │                                                         │
    │ This URL is public + cacheable                          │
    └─────────────────────────────────────────────────────────┘
         ↓
    ✓ File stored in Supabase Storage
    ✓ Public URL ready for database
```

### **PHASE 4: Update Bundle Metadata in Database**

```
After all 4 files are uploaded for a bundle:
         ↓
    ┌─────────────────────────────────────────────────────────┐
    │ BUILD FILE METADATA ARRAY                               │
    │ [                                                       │
    │   {                                                     │
    │     "label": "Market Research Report",                  │
    │     "name": "market-research-report-AK-ALF-001.pdf",   │
    │     "type": "PDF",                                      │
    │     "size": 2451234,                                    │
    │     "url": "https://cdn.../bundles/550e8400.../...",   │
    │     "path": "bundles/550e8400-e29b-.../market..."      │
    │   },                                                    │
    │   {                                                     │
    │     "label": "Pro Forma P&L Template",                  │
    │     "name": "pro-forma-p-l-template-AK-ALF-001.xlsx",  │
    │     "type": "XLSX",                                     │
    │     "size": 912345,                                     │
    │     "url": "https://cdn.../bundles/550e8400.../...",   │
    │     "path": "bundles/550e8400-e29b-.../pro-forma..."    │
    │   },                                                    │
    │   ... (2 more files)                                    │
    │ ]                                                       │
    └─────────────────────────────────────────────────────────┘
         ↓
    ┌─────────────────────────────────────────────────────────┐
    │ UPDATE DATABASE                                         │
    │ UPDATE products                                         │
    │ SET metadata = {                                        │
    │   ...existing metadata...,                             │
    │   "files": [fileArray from above]                       │
    │ }                                                       │
    │ WHERE id = '550e8400-e29b-41d4-a716-446655440000'      │
    │                                                         │
    │ Result: Bundle now linked to all 4 files               │
    └─────────────────────────────────────────────────────────┘
         ↓
    ✓ Bundle metadata updated with file URLs
```

---

## 📊 Before & After Database State

### **BEFORE (After Step 1: seed-all-bundles.js)**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Alabama Assisted Living Facilities Complete Bundle",
  "code": "AL",
  "program": "Assisted Living Facilities",
  "metadata": {
    "state": "Alabama",
    "program": "Assisted Living Facilities",
    "files": []  ← EMPTY!
  }
}
```

### **AFTER (After Step 2: seed-bundle-files.js)**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Alabama Assisted Living Facilities Complete Bundle",
  "code": "AL",
  "program": "Assisted Living Facilities",
  "metadata": {
    "state": "Alabama",
    "program": "Assisted Living Facilities",
    "files": [
      {
        "label": "Market Research Report",
        "name": "market-research-report-AK-ALF-001.pdf",
        "type": "PDF",
        "size": 2451234,
        "url": "https://abc123.supabase.co/storage/v1/object/public/bundle-files/bundles/550e8400-e29b-41d4-a716-446655440000/market-research-report.pdf",
        "path": "bundles/550e8400-e29b-41d4-a716-446655440000/market-research-report.pdf"
      },
      {
        "label": "Pro Forma P&L Template",
        "name": "pro-forma-p-l-template-AK-ALF-001.xlsx",
        "type": "XLSX",
        "size": 912345,
        "url": "https://abc123.supabase.co/storage/v1/object/public/bundle-files/bundles/550e8400-e29b-41d4-a716-446655440000/pro-forma-p-l-template.xlsx",
        "path": "bundles/550e8400-e29b-41d4-a716-446655440000/pro-forma-p-l-template.xlsx"
      },
      {
        "label": "Policy & Procedure Manual",
        "name": "policy-procedure-manual-AK-ALF-001.pdf",
        "type": "PDF",
        "size": 3100234,
        "url": "https://abc123.supabase.co/storage/v1/object/public/bundle-files/bundles/550e8400-e29b-41d4-a716-446655440000/policy-procedure-manual.pdf",
        "path": "bundles/550e8400-e29b-41d4-a716-446655440000/policy-procedure-manual.pdf"
      },
      {
        "label": "Licensing Checklist",
        "name": "licensing-checklist-AK-ALF-001.pdf",
        "type": "PDF",
        "size": 451234,
        "url": "https://abc123.supabase.co/storage/v1/object/public/bundle-files/bundles/550e8400-e29b-41d4-a716-446655440000/licensing-checklist.pdf",
        "path": "bundles/550e8400-e29b-41d4-a716-446655440000/licensing-checklist.pdf"
      }
    ]
  }
}
```

---

## 🎯 Supabase Storage Structure After Upload

```
Supabase Storage Bucket: "bundle-files"
                    ↓
        /bundles/ (folder)
             ↓
    /550e8400-e29b-41d4.../ (one folder per bundle)
             ↓
    ├── market-research-report.pdf
    ├── pro-forma-p-l-template.xlsx
    ├── policy-procedure-manual.pdf
    └── licensing-checklist.pdf

    /550e8401-a40c-42e5.../ (next bundle)
             ↓
    ├── market-research-report.pdf
    ├── pro-forma-p-l-template.xlsx
    ├── policy-procedure-manual.pdf
    └── licensing-checklist.pdf
    
    ... (500 folders total for 500 bundles)
    
    TOTAL: 500 folders × 4 files = 2,000 files in Supabase
```

---

## 🔄 Script Execution Flow

```bash
$ node seed-bundle-files.js ./bundle-files

╔════════════════════════════════════════════════════════════╗
║         BULK BUNDLE FILE UPLOAD - All States               ║
║        50 States × 10 Programs = 500 Bundles × 4 Files    ║
╚════════════════════════════════════════════════════════════╝

📂 Scanning folder: ./bundle-files

Found 500 bundle folders

📦 Ready to process:
   Total Folders: 500
   Valid Bundles: 500
   Total Files: 2000

─────────────────────────────────────────────────────────────

📊 Batch 1/10 (50 bundles)

  📦 AL - Assisted Living Facilities
     ✓ Market Research Report          2450 KB
     ✓ Pro Forma P&L Template           912 KB
     ✓ Policy & Procedure Manual       3100 KB
     ✓ Licensing Checklist              451 KB
     ✓ Bundle updated (4/4 files)

  📦 AL - Nursing Facilities (SNF)
     ✓ Market Research Report          2450 KB
     ...
     ✓ Bundle updated (4/4 files)

  ... (48 more bundles)

📊 Batch 2/10 (50 bundles)
  ... (more bundles)

═════════════════════════════════════════════════════════════
╔════════════════════════════════════════════════════════════╗
║                    UPLOAD COMPLETE                          ║
║ Bundles Fully Updated: 500                                  ║
║ Bundles Partially Updated: 0                                ║
║ Failed: 0                                                   ║
║ Skipped (not in DB): 0                                      ║
║ Total Files Uploaded: 2000                                  ║
║ Success Rate: 100.0%                                        ║
╚════════════════════════════════════════════════════════════╝
```

---

## 💾 How Customers Download Files

When a customer purchases a bundle, the flow is:

```
Customer clicks "Download" on bundle
         ↓
App fetches bundle metadata from DB
         ↓
Displays 4 file links from metadata.files[].url
         ↓
Customer clicks file link
         ↓
Public Supabase URL serves the file
         ↓
File downloads to customer's device
         ↓
✓ Download complete!
```

---

## 📋 Step-by-Step Execution

### **Step 1: Create all 500 bundles**
```bash
node seed-all-bundles.js
```
Output: 500 bundles created with empty file arrays

### **Step 2: Upload all 2,000 files**
```bash
node seed-bundle-files.js ./bundle-files
```
Output: All files uploaded and linked to bundles

### **Step 3: Verify in Supabase**
- Go to Supabase Dashboard
- Storage → bundle-files → bundles
- Should see 500 folders (one per bundle)
- Each folder has 4 files

### **Step 4: Verify in Database**
- Go to Supabase Dashboard
- SQL Editor
- Query:
```sql
SELECT 
  id, 
  name, 
  code, 
  program,
  metadata->>'files' as file_count
FROM products 
WHERE type = 'bundle'
LIMIT 10;
```
- Should show all bundles with file metadata

---

## 🔑 Key Points

✅ **Automated**: No manual uploads  
✅ **Batch Processing**: Handles 500 bundles efficiently  
✅ **Smart Extraction**: Auto-detects state/program from folder names  
✅ **Public URLs**: Files stored with public access for customers  
✅ **Database Linked**: All file data stored in bundle metadata  
✅ **Scalable**: Can handle 2,000 files in ~10 minutes  

---

## ❓ Common Questions

**Q: What if a folder has fewer than 4 files?**  
A: It's skipped and logged as an error. Fix the folder and re-run.

**Q: Can I re-run if some uploads fail?**  
A: Yes! The script will overwrite existing files. Just fix issues and run again.

**Q: Are the files public or private?**  
A: Public! Stored with `cacheControl: '3600'` for CDN caching.

**Q: Can customers access files directly from URLs?**  
A: Yes! They get direct Supabase CDN URLs.

**Q: What if I need to update a file?**  
A: Delete the old file and re-run the script (or manually update in Supabase).
