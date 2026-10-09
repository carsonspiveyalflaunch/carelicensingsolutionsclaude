# ✅ PRACTICAL SETUP CHECKLIST

## Your Current Situation
You have your 500 folders organized like this (from your screenshot):
```
Some location (maybe Downloads or Desktop):
  ├── alaska-assisted-living-facilities-complete-bundle/
  ├── florida-assisted-living-facilities-complete-bundle/
  ├── florida-group-homes-for-children-complete-bundle/
  ├── florida-hospice-programs-complete-bundle/
  ├── florida-nursing-facilities-snf-complete-bundle/
  └── ... (495 more folders)
```

---

## STEP 1: Create `bundle-files` Folder

### Using Windows Explorer
1. Open: `c:\shahmeer\Work\alf-launch-project\`
2. Right-click → New → Folder
3. Name it: `bundle-files`

### Using PowerShell
```powershell
cd c:\shahmeer\Work\alf-launch-project
mkdir bundle-files
```

### Verify
```powershell
ls -Directory bundle-files
# If it exists, you'll see it listed
```

---

## STEP 2: Move Your 500 Folders Into `bundle-files/`

### Option A: Using Windows Explorer
1. Go to where your 500 folders are currently stored
2. Select all 500 folders
3. Cut (Ctrl+X)
4. Go to: `c:\shahmeer\Work\alf-launch-project\bundle-files\`
5. Paste (Ctrl+V)

### Option B: Using PowerShell
```powershell
# If your files are in Downloads
Move-Item -Path "C:\Users\YourName\Downloads\bundles\*" `
          -Destination "c:\shahmeer\Work\alf-launch-project\bundle-files\" -Force

# OR if copying instead of moving
Copy-Item -Path "C:\Users\YourName\Downloads\bundles\*" `
          -Destination "c:\shahmeer\Work\alf-launch-project\bundle-files\" -Recurse -Force
```

### Verify the Structure
After moving, check:
```powershell
# Should show 500 folders
(Get-ChildItem bundle-files -Directory).Count

# Should show 2000 files (500 folders × 4 files each)
(Get-ChildItem bundle-files -Recurse -File).Count
```

---

## STEP 3: Verify Folder Names Are Correct

The script needs to parse folder names like this:
```
alaska-assisted-living-facilities-complete-bundle
florida-nursing-facilities-snf-complete-bundle
georgia-adult-day-care-programs-complete-bundle
```

### Extract: State
```
alaska → AL
florida → FL
georgia → GA
```

### Extract: Program
```
assisted-living-facilities → Assisted Living Facilities
nursing-facilities-snf → Nursing Facilities (SNF)
adult-day-care-programs → Adult Day Care Programs
```

### Check Your Folder Names
```powershell
cd bundle-files
ls -Directory

# You should see output like:
# alaska-assisted-living-facilities-complete-bundle
# alaska-nursing-facilities-snf-complete-bundle
# florida-assisted-living-facilities-complete-bundle
# ... (500 total)
```

---

## STEP 4: Verify Each Folder Has 4 Files

### Check One Folder
```powershell
ls -File "bundle-files\alabama-assisted-living-facilities-complete-bundle\"

# Should show 4 files:
# - licensing-checklist-...
# - market-research-report-...
# - policy-procedure-manual-...
# - pro-forma-p-l-template-...
```

### Check All Folders Have 4 Files
```powershell
$folders = Get-ChildItem bundle-files -Directory
foreach ($folder in $folders) {
    $fileCount = (Get-ChildItem $folder.FullName -File).Count
    if ($fileCount -ne 4) {
        Write-Host "❌ $($folder.Name) has $fileCount files (should be 4)"
    }
}
# If no errors show, all folders have 4 files!
```

---

## STEP 5: Verify File Names Are Correct

Files should contain keywords so the script can detect type:

```
✓ market-research-report-*.pdf
✓ pro-forma-p-l-template-*.xlsx
✓ policy-procedure-manual-*.pdf
✓ licensing-checklist-*.pdf
```

### Check a Sample Folder
```powershell
ls -File "bundle-files\alabama-assisted-living-facilities-complete-bundle\"

# Should include:
licensing-checklist-AL-ALF-001.pdf
market-research-report-AL-ALF-001.pdf
policy-procedure-manual-AL-ALF-001.pdf
pro-forma-p-l-template-AL-ALF-001.xlsx
```

---

## STEP 6: Run STEP 1 - Create Bundles

```powershell
cd c:\shahmeer\Work\alf-launch-project
node seed-all-bundles.js
```

**Wait for completion** (about 3-5 minutes)

**Expected Output:**
```
✓ Cleared existing bundles
✓ Generated 500 bundles
✓ Batch 1: 100 bundles inserted
✓ Batch 2: 100 bundles inserted
✓ Batch 3: 100 bundles inserted
✓ Batch 4: 100 bundles inserted
✓ Batch 5: 100 bundles inserted

✓ Total Bundles Created: 500
✓ Files Included: 2000
```

---

## STEP 7: Run STEP 2 - Upload Files

```powershell
cd c:\shahmeer\Work\alf-launch-project
node seed-bundle-files.js ./bundle-files
```

**Wait for completion** (about 10-15 minutes)

**Expected Output:**
```
📂 Scanning folder: ./bundle-files
Found 500 bundle folders

📦 Ready to process:
   Total Folders: 500
   Valid Bundles: 500
   Total Files: 2000

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

✓ Bundles Fully Updated: 500
✓ Total Files Uploaded: 2000
✓ Success Rate: 100.0%
```

---

## STEP 8: Verify in Supabase

### Check Storage
1. Go to Supabase Dashboard
2. Click "Storage"
3. Click "bundle-files" bucket
4. Click "bundles" folder
5. Should see 500 folders (one per bundle)
6. Click one folder → should see 4 files

### Check Database
1. Go to Supabase Dashboard
2. Click "SQL Editor"
3. Run this query:
```sql
SELECT COUNT(*) as total_bundles FROM products WHERE type = 'bundle';
```
Expected: `500`

```sql
SELECT 
  name,
  metadata->'files' as files
FROM products 
WHERE type = 'bundle'
LIMIT 1;
```
Should show: Bundle with 4 file objects in metadata

---

## Complete Command Flow

```powershell
# 1. Navigate to project
cd c:\shahmeer\Work\alf-launch-project

# 2. Verify setup
(Get-ChildItem bundle-files -Directory).Count  # Should be 500
(Get-ChildItem bundle-files -Recurse -File).Count  # Should be 2000

# 3. Create bundles (Step 1)
node seed-all-bundles.js

# Wait ~3 minutes for completion...

# 4. Upload files (Step 2)
node seed-bundle-files.js ./bundle-files

# Wait ~10 minutes for completion...

# 5. Verify in Supabase
# Check Storage and Database (see Step 8)

# ✓ DONE! 500 bundles ready to sell
```

---

## Troubleshooting

### ❌ Error: "bundle-files not found"
```
Solution:
1. Make sure you created the folder
2. Make sure you're in the right directory
3. Run: ls bundle-files (should work without error)
```

### ❌ Error: "Bundle not found in database"
```
Solution:
1. Did you run seed-all-bundles.js first?
2. Check: SELECT COUNT(*) FROM products WHERE type='bundle';
3. Should be 500 rows
```

### ❌ Error: "File type unknown"
```
Solution:
1. Check file names contain keywords (market, pro forma, policy, licensing)
2. Rename files if needed
3. Re-run the script
```

### ❌ Error: "Folder has 3 files instead of 4"
```
Solution:
1. Check which file is missing
2. Add the missing file
3. Re-run the script
```

---

## Summary

| Step | Action | Command | Time |
|------|--------|---------|------|
| 1 | Create bundle-files folder | `mkdir bundle-files` | 1 sec |
| 2 | Move 500 folders into it | File Explorer/PowerShell | 5 min |
| 3 | Verify structure | Check folder/file counts | 1 min |
| 4 | Create bundles in DB | `node seed-all-bundles.js` | 3 min |
| 5 | Upload files to storage | `node seed-bundle-files.js ./bundle-files` | 10 min |
| 6 | Verify in Supabase | Check Dashboard | 2 min |
| **Total** | **Full Setup** | **Both commands** | **~22 min** |

---

## After It's Done

Your bundles are now:
- ✓ Created in database (500 rows in products table)
- ✓ Uploaded to Supabase Storage (500 folders with 2,000 files)
- ✓ Linked with public CDN URLs
- ✓ Ready for customers to purchase and download

Next:
1. Go to Admin Panel
2. See all 500 bundles listed
3. Set up Stripe integration if needed
4. Start selling!

---

## Need Help?

If something fails:
1. Check the error message
2. Fix the issue (folder names, file counts, etc.)
3. Re-run the script
4. All scripts are designed to be re-runnable!

You can run them as many times as needed until everything is perfect.
