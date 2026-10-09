# 🚀 Bulk Bundle Seeding Guide - 500 Bundles with 4 Files Each

## Overview
You have **50 states × 10 program types = 500 bundles**, with **4 files per bundle**.

This guide shows you how to create all 500 bundles at once (instead of one-by-one through the admin panel).

---

## 📋 What's Included in Each Bundle

Each bundle comes with 4 files:
1. **Market Research Report** (PDF)
2. **Pro Forma P&L Template** (Excel)
3. **Policy & Procedure Manual** (PDF)
4. **Licensing Checklist** (PDF)

---

## ✅ Step 1: Generate All 500 Bundles (Bundle Metadata)

### Run the seeding script:

```bash
node seed-all-bundles.js
```

### What This Does:
- Creates 500 bundle records in your `products` table
- Sets up proper metadata structure for file references
- Configures pricing, descriptions, features for each
- Takes ~2-3 minutes
- **No actual files uploaded yet** (just metadata structure)

### Output:
```
╔════════════════════════════════════════════════════════════╗
║  BULK BUNDLE SEEDING - All States & Program Categories    ║
║  50 States × 10 Programs = 500 Bundles with 4 Files Each  ║
╚════════════════════════════════════════════════════════════╝

✓ Cleared existing bundles
✓ Generated 500 bundles
✓ Batch 1: 100 bundles inserted
✓ Batch 2: 100 bundles inserted
✓ Batch 3: 100 bundles inserted
✓ Batch 4: 100 bundles inserted
✓ Batch 5: 100 bundles inserted

╔════════════════════════════════════════════════════════════╗
║                    SEEDING COMPLETE                         ║
║ Total Bundles Created: 500                                  ║
║ Files Included: 2000                                        ║
╚════════════════════════════════════════════════════════════╝
```

---

## 📤 Step 2: Upload 4 Files to Each Bundle

After step 1, you have 500 empty bundles ready. Now upload the actual files.

### Option A: Upload One-by-One (Tedious but Easy)

1. Go to **Admin Panel → Upload Bundle**
2. Select a State
3. Select a Program Type
4. Upload 4 files:
   - Market Research Report
   - Pro Forma P&L Template
   - Policy & Procedure Manual
   - Licensing Checklist
5. Repeat for each of 500 bundles... ⏱️ **Very time-consuming!**

---

### Option B: Bulk Upload Files (Recommended for 2000 files) ⭐

To create a bulk file uploader, we need to know:

**Question 1:** Do you have all 2,000 files already organized in folders?

**Option B1:** Files organized by state:
```
/bundle-files/
  /AL/
    market-research.pdf
    p&l-template.xlsx
    policy-manual.pdf
    licensing-checklist.pdf
  /AK/
    market-research.pdf
    p&l-template.xlsx
    ...
  /AZ/
    ...
```

**Option B2:** Files organized by state + program:
```
/bundle-files/
  /AL-assisted-living/
    market-research.pdf
    p&l-template.xlsx
    policy-manual.pdf
    licensing-checklist.pdf
  /AL-nursing-facilities/
    market-research.pdf
    ...
```

**Option B3:** All files in one folder with naming pattern:
```
/bundle-files/
  al-assisted-living-market-research.pdf
  al-assisted-living-p&l-template.xlsx
  al-assisted-living-policy-manual.pdf
  al-assisted-living-licensing-checklist.pdf
  al-nursing-facilities-market-research.pdf
  ...
```

---

## 🎯 Recommended Approach

### For 500 bundles × 4 files = 2,000 files:

1. **Create the 500 bundles** (Step 1)
   ```bash
   node seed-all-bundles.js
   ```

2. **Organize your files** using one of the patterns above

3. **Create a bulk upload script** - we can create this for you:
   - **`seed-bundle-files.js`** - Reads files from a folder and uploads them to matching bundles
   - Handles batch processing of 2,000 files
   - Maps file names to bundle state/program automatically

---

## 💡 What You Need to Do Now

Please let me know:

1. **Do you already have all 2,000 files created?**
   - If YES: Where are they located and how are they organized?
   - If NO: Do you have template files to duplicate?

2. **What's your file naming/organization structure?**
   - By state folder?
   - By state + program folder?
   - Single folder with naming pattern?

3. **Are the files hosted somewhere or stored locally?**
   - Local hard drive?
   - Cloud storage?
   - Need to be created from templates?

Once you provide these details, I can:
- Create an automated file upload script
- Set up batch processing for 2,000 files
- Verify file associations are correct

---

## 📊 Quick Reference

| Task | Command | Time | Files |
|------|---------|------|-------|
| Create 500 bundles | `node seed-all-bundles.js` | ~3 min | Metadata only |
| Upload files (manual) | Admin Panel | ~500 min | 2,000 |
| Upload files (bulk) | `node seed-bundle-files.js` | ~10 min | 2,000 |

---

## 🔗 Related Files in Project

- `seed-all-bundles.js` - Bulk bundle creator (NEW)
- `seed-alabama-bundle.js` - Single bundle example
- `seed-products.js` - Product seeding reference
- `app/admin/AdminPanelClient.tsx` - Admin upload interface
- `lib/bundles.ts` - Bundle utilities
- `app/api/admin/bundles/route.ts` - Bundle API

---

## ❓ FAQ

**Q: Can I create bundles without uploading files?**
A: Yes! Step 1 creates all 500 bundles with empty file slots. You can upload files later.

**Q: What if I only want to create bundles for certain states?**
A: Edit `seed-all-bundles.js` and filter the `states` array before running.

**Q: Can I update prices or descriptions after creating?**
A: Yes, edit them in Admin Panel or create an update script.

**Q: How do I delete and re-run the seeding?**
A: The script automatically clears existing bundles. Just run it again.

**Q: What's the file upload limit?**
A: Supabase has file size limits. PDFs typically < 50MB, Excel files < 25MB should be fine.

---

## 🚀 Next Steps

1. Run `node seed-all-bundles.js` to create all 500 bundles
2. Tell me about your file organization
3. I'll create the bulk file upload script
4. Upload all 2,000 files in one go!
