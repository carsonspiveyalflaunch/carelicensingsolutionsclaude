# 📂 Setup Guide: How to Organize Your Bundle Files

## Quick Answer

**YES**, you need to create a `bundle-files` folder in your root directory with your 500 state/program folders inside it.

---

## Folder Structure (Exact Setup)

### Root Level
```
c:\shahmeer\Work\alf-launch-project\
├── app/
├── lib/
├── public/
├── seed-all-bundles.js          ← Script 1
├── seed-bundle-files.js         ← Script 2 (points here)
└── bundle-files/                ← CREATE THIS FOLDER
    └── (your 500 state folders here)
```

### Inside `bundle-files/` Folder
```
bundle-files/
├── alaska-assisted-living-facilities-complete-bundle/
│   ├── licensing-checklist-AK-ALF-001.pdf
│   ├── market-research-report-AK-ALF-001.pdf
│   ├── policy-procedure-manual-AK-ALF-001.pdf
│   └── pro-forma-p-l-template-AK-ALF-001.xlsx
│
├── alaska-nursing-facilities-snf-complete-bundle/
│   ├── licensing-checklist-AK-NF-001.pdf
│   ├── market-research-report-AK-NF-001.pdf
│   ├── policy-procedure-manual-AK-NF-001.pdf
│   └── pro-forma-p-l-template-AK-NF-001.xlsx
│
├── florida-assisted-living-facilities-complete-bundle/
│   ├── licensing-checklist-FL-ALF-001.pdf
│   ├── market-research-report-FL-ALF-001.pdf
│   ├── policy-procedure-manual-FL-ALF-001.pdf
│   └── pro-forma-p-l-template-FL-ALF-001.xlsx
│
├── florida-group-homes-for-children-complete-bundle/
│   └── (4 files...)
│
├── florida-hospice-programs-complete-bundle/
│   └── (4 files...)
│
├── florida-nursing-facilities-snf-complete-bundle/
│   └── (4 files...)
│
└── ... (499 more state/program folders)
```

---

## Step-by-Step Setup

### Step 1: Create `bundle-files` Folder

In your project root (`c:\shahmeer\Work\alf-launch-project\`), create a new folder:

**Windows File Explorer:**
```
Right-click → New → Folder → Name it "bundle-files"
```

**Or PowerShell:**
```powershell
mkdir bundle-files
```

**Or Command Line:**
```bash
mkdir bundle-files
```

---

### Step 2: Inside `bundle-files/`, Create 500 State/Program Folders

Each folder must follow this naming pattern:

```
{state-name}-{program-name}-complete-bundle
```

**Examples:**
```
alabama-assisted-living-facilities-complete-bundle
alabama-nursing-facilities-snf-complete-bundle
alaska-assisted-living-facilities-complete-bundle
florida-assisted-living-facilities-complete-bundle
florida-group-homes-for-children-complete-bundle
florida-hospice-programs-complete-bundle
georgia-adult-day-care-programs-complete-bundle
... and so on (500 total)
```

**Naming Rules:**
- Use lowercase letters
- Use hyphens to separate words (not underscores)
- Include the state name first
- Include the program name
- End with "-complete-bundle"

---

### Step 3: Inside Each State/Program Folder, Add 4 Files

Each of the 500 folders must contain exactly 4 files:

```
{folder-name}/
├── market-research-report-{STATE-CODE}-{CODE}-001.pdf
├── pro-forma-p-l-template-{STATE-CODE}-{CODE}-001.xlsx
├── policy-procedure-manual-{STATE-CODE}-{CODE}-001.pdf
└── licensing-checklist-{STATE-CODE}-{CODE}-001.pdf
```

**Real Examples:**

**Alabama Assisted Living:**
```
alabama-assisted-living-facilities-complete-bundle/
├── market-research-report-AL-ALF-001.pdf
├── pro-forma-p-l-template-AL-ALF-001.xlsx
├── policy-procedure-manual-AL-ALF-001.pdf
└── licensing-checklist-AL-ALF-001.pdf
```

**Florida Nursing Facilities:**
```
florida-nursing-facilities-snf-complete-bundle/
├── market-research-report-FL-NF-001.pdf
├── pro-forma-p-l-template-FL-NF-001.xlsx
├── policy-procedure-manual-FL-NF-001.pdf
└── licensing-checklist-FL-NF-001.pdf
```

---

## Complete State/Program Mapping

### State Names (for folder names)
```
alabama, alaska, arizona, arkansas, california, colorado, connecticut,
delaware, florida, georgia, hawaii, idaho, illinois, indiana, iowa,
kansas, kentucky, louisiana, maine, maryland, massachusetts, michigan,
minnesota, mississippi, missouri, montana, nebraska, nevada, hampshire,
jersey, mexico, york, carolina, dakota, ohio, oklahoma, oregon,
pennsylvania, island, carolina, dakota, tennessee, texas, utah,
vermont, virginia, washington, virginia, wisconsin, wyoming
```

### Program Names (for folder names)
```
assisted-living-facilities
nursing-facilities-snf
home-health-agencies
adult-day-care-programs
hospice-programs
child-care-facilities
group-homes-for-children
personal-home-care
residential-care-dd
residential-treatment-children
```

---

## File Naming Convention

The files don't need specific names, but should contain these keywords for auto-detection:

| File Label | Keywords | Example Filename |
|-----------|----------|------------------|
| Market Research Report | "market", "research" | `market-research-report.pdf` |
| Pro Forma P&L Template | "pro", "forma", "p&l" | `pro-forma-p-l-template.xlsx` |
| Policy & Procedure Manual | "policy", "procedure" | `policy-procedure-manual.pdf` |
| Licensing Checklist | "licensing", "checklist" | `licensing-checklist.pdf` |

**The script auto-detects file types**, so these work too:
```
market_research_report.pdf ✓
MarketResearchReport.pdf ✓
market-research-2024.pdf ✓
research-market.pdf ✓
```

---

## Now Run the Command

After your folder structure is ready:

```powershell
node seed-bundle-files.js ./bundle-files
```

**This command means:**
- `node` = Run JavaScript file
- `seed-bundle-files.js` = The upload script
- `./bundle-files` = Upload files from THIS folder

---

## Example: Full Setup for 3 States (6 programs each = 6 bundles)

```
bundle-files/
│
├── alabama-assisted-living-facilities-complete-bundle/
│   ├── licensing-checklist-AL-ALF-001.pdf (500 KB)
│   ├── market-research-report-AL-ALF-001.pdf (2.5 MB)
│   ├── policy-procedure-manual-AL-ALF-001.pdf (3.1 MB)
│   └── pro-forma-p-l-template-AL-ALF-001.xlsx (912 KB)
│
├── alabama-nursing-facilities-snf-complete-bundle/
│   ├── licensing-checklist-AL-NF-001.pdf
│   ├── market-research-report-AL-NF-001.pdf
│   ├── policy-procedure-manual-AL-NF-001.pdf
│   └── pro-forma-p-l-template-AL-NF-001.xlsx
│
├── alabama-home-health-agencies-complete-bundle/
│   └── (4 files...)
│
├── florida-assisted-living-facilities-complete-bundle/
│   └── (4 files...)
│
├── florida-nursing-facilities-snf-complete-bundle/
│   └── (4 files...)
│
└── georgia-assisted-living-facilities-complete-bundle/
    └── (4 files...)

(This is 6 bundles = 24 files total)
(Real setup = 500 folders × 4 files = 2,000 files)
```

---

## Validation Checklist

Before running the command, verify:

- [ ] **Folder exists**: `c:\shahmeer\Work\alf-launch-project\bundle-files\`
- [ ] **Has 500 folders**: One for each state/program combination
- [ ] **Each folder has 4 files**: Not more, not less
- [ ] **Files have correct extensions**: `.pdf`, `.xlsx`
- [ ] **File names contain keywords**: "market", "pro forma", "policy", "licensing"
- [ ] **Folder names use hyphens**: NOT underscores or spaces
- [ ] **Folder names are lowercase**: `alabama-assisted-living-...` (not `Alabama-Assisted...`)

---

## Common Mistakes to Avoid

❌ **WRONG:**
```
bundle_files/                    ← Use hyphens, not underscores
Alabama-Assisted-Living/         ← Use lowercase
market research report.pdf       ← Use hyphens, not spaces
```

✅ **CORRECT:**
```
bundle-files/                    ← Hyphen
alabama-assisted-living/         ← Lowercase
market-research-report.pdf       ← Hyphenated
```

---

## If You Have Files Elsewhere

If your 500 folders + 2,000 files are currently in a different location:

**Option 1: Copy them to `bundle-files/`**
```powershell
Copy-Item -Path "C:\path\to\existing\files\*" -Destination "bundle-files\" -Recurse
```

**Option 2: Point script to that location**
```powershell
node seed-bundle-files.js C:\path\to\existing\files
```

**Option 3: Move them to `bundle-files/`**
```powershell
Move-Item -Path "C:\path\to\existing\files\*" -Destination "bundle-files\"
```

---

## Running the Complete Workflow

```powershell
# 1. Create bundles in database (3 minutes)
node seed-all-bundles.js

# 2. Upload files to storage (10 minutes)
node seed-bundle-files.js ./bundle-files

# 3. Check results
# - Supabase Dashboard → Storage → bundle-files → bundles
# - Should see 500 folders with files inside
```

---

## Expected Output

When you run the command, you'll see:

```
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

✓ All files processed successfully
```

---

## Quick Commands

### Create bundle-files folder
```powershell
mkdir bundle-files
```

### Run the upload
```powershell
node seed-bundle-files.js ./bundle-files
```

### Verify files are uploaded
```powershell
# In Supabase Dashboard, check:
# - Storage → bundle-files → bundles (should have 500 folders)
# - Database → products table (should have 500 rows with files)
```

---

## Still Confused?

From your earlier screenshot, you already have the structure like:
- `alaska-assisted-living-facilities-complete-bundle/`
- `florida-assisted-living-facilities-complete-bundle/`
- `florida-group-homes-for-children-complete-bundle/`
- `florida-hospice-programs-complete-bundle/`
- `florida-nursing-facilities-snf-complete-bundle/`

**Just move all those folders into the `bundle-files/` folder, and you're ready!**

Then run:
```powershell
node seed-bundle-files.js ./bundle-files
```

That's it! 🚀
