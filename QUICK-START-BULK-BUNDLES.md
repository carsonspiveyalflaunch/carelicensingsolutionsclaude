# ⚡ Bulk Bundle Creation - Quick Start

## Your Setup
- **50 US States** × **10 Program Types** = **500 Bundles**
- **4 Files per Bundle** = **2,000 Files Total**
- All stored in Supabase with file metadata

---

## 🚀 Two-Step Solution

### Step 1️⃣: Create 500 Bundles (Metadata)

```bash
node seed-all-bundles.js
```

**What this does:**
- Creates 500 bundle records in database
- Sets up file structure for each
- Ready to receive files
- ⏱️ **~3 minutes**

**Output:**
```
✓ Cleared existing bundles
✓ Generated 500 bundles
✓ Batch 1-5: 500 bundles inserted

✓ Total Bundles Created: 500
✓ Files Included: 2000
```

---

### Step 2️⃣: Upload All Files (2,000 at once)

First, organize your files in a folder structure like:

**Option A: By State**
```
/bundle-files/
  /AL/
    market-research.pdf
    p&l-template.xlsx
    policy-manual.pdf
    checklist.pdf
  /AK/
    market-research.pdf
    ...
```

**Option B: By State + Program**
```
/bundle-files/
  /AL-Assisted-Living/
    market-research.pdf
    p&l-template.xlsx
    policy-manual.pdf
    checklist.pdf
  /AL-Nursing-Facilities/
    ...
```

**Option C: Single folder with naming**
```
/bundle-files/
  AL-assisted-living-market-research.pdf
  AL-assisted-living-p&l-template.xlsx
  AL-nursing-facilities-market-research.pdf
  ...
```

Then run:

```bash
node seed-bundle-files.js ./bundle-files
```

**What this does:**
- Reads all files from your folder
- Automatically maps them to correct bundles
- Uploads to Supabase storage
- Updates bundle metadata with file URLs
- ⏱️ **~10 minutes for 2,000 files**

**Output:**
```
Found 2000 files
Processing 500 bundles...

📦 AL - Assisted Living
  ✓ Market Research Report (2,450 KB)
  ✓ Pro Forma P&L Template (890 KB)
  ✓ Policy & Procedure Manual (3,100 KB)
  ✓ Licensing Checklist (450 KB)

📦 AL - Nursing Facilities
  ✓ Market Research Report (2,450 KB)
  ...

✓ Bundles Updated: 500
✓ Total Files Uploaded: 2000
```

---

## ⚙️ File Naming Requirements

The script auto-detects based on filenames. Include:
- **State code**: AL, AK, AZ, etc. (2 letters)
- **Program name**: "assisted living", "nursing", "home health", etc.
- **File type**: "market research", "p&l", "policy", "checklist"

**Examples:**
```
AL-Assisted-Living-Market-Research-2024.pdf ✓
market-research-report-AL.pdf ✓
assisted_living_policy_and_procedures.pdf ✗ (needs state)
AL-market.pdf ✓
```

---

## 📊 Timeline

| Step | Action | Time | Result |
|------|--------|------|--------|
| 1 | Create bundles | 3 min | 500 bundles ready |
| 2 | Upload files | 10 min | 2,000 files linked |
| **Total** | **Full Setup** | **13 min** | **Ready to sell!** |

---

## 🎯 Key Features

✅ **Automated**: No manual clicking through admin panel 500+ times
✅ **Batch Processing**: Handles 2,000 files efficiently  
✅ **Smart Mapping**: Auto-detects which files go to which bundle
✅ **Error Handling**: Logs any files it can't match
✅ **Metadata**: All file URLs stored in database
✅ **Reversible**: Can delete and re-run anytime

---

## 💻 Example: From Zero to 500 Bundles

```bash
# Step 1: Create all bundles (3 min)
$ node seed-all-bundles.js

# Step 2: Upload all files (10 min)
$ node seed-bundle-files.js ./my-bundle-files

# Result: 500 fully configured bundles with 2,000 files
# Ready to sell immediately!
```

---

## ❓ Troubleshooting

### "Directory not found"
```bash
# Make sure your files folder path is correct
node seed-bundle-files.js /Users/yourname/Desktop/bundle-files
```

### "Bundle not found in database"
- First run `node seed-all-bundles.js` to create bundles
- Then organize files with correct state codes

### "Could not extract state code"
- Files need to include state code (AL, AK, AZ, etc.)
- Or organize in folder named with state code

---

## 📁 Files Created

- `seed-all-bundles.js` - Creates 500 bundles
- `seed-bundle-files.js` - Uploads 2,000 files
- `BULK-BUNDLE-SEEDING-GUIDE.md` - Detailed guide

---

## 🚀 Next Steps

1. **Prepare files** - Organize your 2,000 files (or get templates)
2. **Create bundles** - `node seed-all-bundles.js`
3. **Upload files** - `node seed-bundle-files.js ./path-to-files`
4. **Verify** - Check Admin Panel > Bundles to see all 500
5. **Start selling** - All bundles ready!

---

## Need Help?

- **Files not found?** Check folder path and file extensions (.pdf, .xlsx, etc.)
- **Want to test?** Run with a few files first, then scale up
- **Need custom logic?** Edit the scripts - they're well-commented
