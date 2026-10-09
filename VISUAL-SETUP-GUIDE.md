# 📊 Visual Setup Guide - Folder Structure

## THE COMMAND
```powershell
node seed-bundle-files.js ./bundle-files
```

---

## What This Command Does

```
┌─────────────────────────────────────────────────────────────┐
│                     Your Computer                           │
│                                                              │
│  c:\shahmeer\Work\alf-launch-project\                       │
│  │                                                           │
│  ├── 📁 app/                                                │
│  ├── 📁 lib/                                                │
│  ├── 📁 public/                                             │
│  ├── 📁 bundle-files/  ← SCRIPT LOOKS HERE                 │
│  │   ├── 📁 alabama-assisted-living-*.../                  │
│  │   ├── 📁 alabama-nursing-facilities-*.../               │
│  │   ├── 📁 florida-assisted-living-*.../                  │
│  │   └── ... (497 more folders)                            │
│  │                                                           │
│  ├── seed-all-bundles.js                                    │
│  └── seed-bundle-files.js  ← RUNS THIS SCRIPT              │
│                                                              │
└─────────────────────────────────────────────────────────────┘

./bundle-files means "start looking in the bundle-files folder at current location"
```

---

## Step-by-Step: Where to Create What

### Step 1: Create `bundle-files` folder
```
In: c:\shahmeer\Work\alf-launch-project\
Create: New Folder named "bundle-files"

Result:
c:\shahmeer\Work\alf-launch-project\bundle-files\
```

### Step 2: Inside bundle-files, put 500 state/program folders

**Before:**
```
Your existing files are somewhere like:
C:\Users\yourname\Downloads\bundles\
  ├── alaska-assisted-living-facilities-complete-bundle\
  ├── florida-assisted-living-facilities-complete-bundle\
  └── ... (500 folders with 4 files each)
```

**After (Move or Copy them):**
```
c:\shahmeer\Work\alf-launch-project\bundle-files\
  ├── alaska-assisted-living-facilities-complete-bundle\
  ├── florida-assisted-living-facilities-complete-bundle\
  └── ... (500 folders with 4 files each)
```

---

## Two Levels of Folders

```
LEVEL 1: Main Folder (in project root)
┌────────────────────────────────────────┐
│ c:\shahmeer\Work\alf-launch-project\   │
│   └── bundle-files\                    │
└────────────────────────────────────────┘

LEVEL 2: State/Program Folders (inside bundle-files)
┌────────────────────────────────────────┐
│ bundle-files\                          │
│   ├── alabama-assisted-living-*\       │
│   ├── alabama-nursing-facilities-*\    │
│   ├── florida-assisted-living-*\       │
│   └── florida-group-homes-*\           │
└────────────────────────────────────────┘

LEVEL 3: Your 4 Files (inside each state/program folder)
┌────────────────────────────────────────┐
│ alabama-assisted-living-*\             │
│   ├── licensing-checklist.pdf          │
│   ├── market-research-report.pdf       │
│   ├── policy-procedure-manual.pdf      │
│   └── pro-forma-p-l-template.xlsx      │
└────────────────────────────────────────┘
```

---

## Running the Command

### Location: Where you run the command from

```
C:\shahmeer\Work\alf-launch-project\
├── bundle-files\          ← Script will scan HERE
├── seed-bundle-files.js   ← Run from HERE
└── ...
```

### In PowerShell:

```powershell
# 1. Navigate to project root
cd c:\shahmeer\Work\alf-launch-project

# 2. Run the script
node seed-bundle-files.js ./bundle-files

# OR in one line:
cd c:\shahmeer\Work\alf-launch-project; node seed-bundle-files.js ./bundle-files
```

### What the script does:

```
node seed-bundle-files.js ./bundle-files
 │                         │
 │                         └─ Look for files in "./bundle-files" folder
 └─ Run this JavaScript file with Node.js
```

---

## File Structure - Complete Example

```
c:\shahmeer\Work\alf-launch-project\
│
├── 📄 seed-all-bundles.js
├── 📄 seed-bundle-files.js
│
└── 📁 bundle-files\
    │
    ├── 📁 alabama-assisted-living-facilities-complete-bundle\
    │   ├── 📄 licensing-checklist-AL-ALF-001.pdf (450 KB)
    │   ├── 📄 market-research-report-AL-ALF-001.pdf (2.4 MB)
    │   ├── 📄 policy-procedure-manual-AL-ALF-001.pdf (3.1 MB)
    │   └── 📄 pro-forma-p-l-template-AL-ALF-001.xlsx (912 KB)
    │
    ├── 📁 alabama-nursing-facilities-snf-complete-bundle\
    │   ├── 📄 licensing-checklist-AL-NF-001.pdf
    │   ├── 📄 market-research-report-AL-NF-001.pdf
    │   ├── 📄 policy-procedure-manual-AL-NF-001.pdf
    │   └── 📄 pro-forma-p-l-template-AL-NF-001.xlsx
    │
    ├── 📁 alabama-home-health-agencies-complete-bundle\
    │   └── (4 files)
    │
    ├── 📁 alabama-adult-day-care-programs-complete-bundle\
    │   └── (4 files)
    │
    ├── 📁 alabama-hospice-programs-complete-bundle\
    │   └── (4 files)
    │
    ├── 📁 alabama-child-care-facilities-complete-bundle\
    │   └── (4 files)
    │
    ├── 📁 alabama-group-homes-for-children-complete-bundle\
    │   └── (4 files)
    │
    ├── 📁 alabama-personal-home-care-complete-bundle\
    │   └── (4 files)
    │
    ├── 📁 alabama-residential-care-dd-complete-bundle\
    │   └── (4 files)
    │
    ├── 📁 alabama-residential-treatment-children-complete-bundle\
    │   └── (4 files)
    │
    │ ... (10 folders for Alabama)
    │
    ├── 📁 alaska-assisted-living-facilities-complete-bundle\
    │   └── (4 files)
    │
    ├── 📁 alaska-nursing-facilities-snf-complete-bundle\
    │   └── (4 files)
    │
    │ ... (8 more folders for Alaska)
    │
    │ ... (continue for all 50 states × 10 programs = 500 folders)
    │
    └── 📁 wyoming-residential-treatment-children-complete-bundle\
        └── (4 files)

TOTAL: 500 folders × 4 files = 2,000 files
```

---

## Validation Before Running

```powershell
# Check folder exists
Test-Path "bundle-files" -PathType Container
# Should return: True

# Count folders
(Get-ChildItem bundle-files -Directory).Count
# Should return: 500

# Count files
(Get-ChildItem bundle-files -Recurse -File).Count
# Should return: 2000
```

---

## If Files are Already Organized

**Scenario 1: Files are in a Downloads folder**
```
C:\Users\YourName\Downloads\bundles\
  └── alabama-assisted-living-*.../
  └── florida-assisted-living-*.../
  └── ... (500 folders)

DO THIS:
Copy the entire folder structure into bundle-files

Result:
c:\shahmeer\Work\alf-launch-project\bundle-files\
  └── alabama-assisted-living-*.../
  └── florida-assisted-living-*.../
  └── ... (500 folders)
```

**Scenario 2: Files are already in bundle-files (perfect!)**
```
c:\shahmeer\Work\alf-launch-project\bundle-files\
  ├── alabama-assisted-living-*.../
  ├── florida-assisted-living-*.../
  └── ... (500 folders)

JUST RUN:
node seed-bundle-files.js ./bundle-files
```

---

## The Complete 2-Step Process

```
STEP 1: Setup (one time)
┌────────────────────────────────────────┐
│ 1. Create bundle-files folder          │
│ 2. Put 500 state/program folders inside│
│ 3. Each folder has 4 files             │
└────────────────────────────────────────┘

STEP 2: Run Scripts (automation)
┌────────────────────────────────────────┐
│ 1. node seed-all-bundles.js            │
│    → Creates 500 bundles in database   │
│    → 3 minutes                         │
│                                        │
│ 2. node seed-bundle-files.js ./bundle-files
│    → Uploads 2,000 files               │
│    → Links to database                 │
│    → 10 minutes                        │
│                                        │
│ Total: 13 minutes                      │
└────────────────────────────────────────┘

RESULT: 500 fully-loaded bundles ready to sell!
```

---

## Quick Checklist

Before running `node seed-bundle-files.js ./bundle-files`:

- [ ] Folder `bundle-files` exists in project root
- [ ] Has 500 subdirectories (state-program folders)
- [ ] Each subdirectory has exactly 4 files
- [ ] File names contain: market, pro forma, policy, licensing
- [ ] Folder names use lowercase and hyphens
- [ ] All files have correct extensions (.pdf, .xlsx)
- [ ] First ran `node seed-all-bundles.js` to create bundles

Then run:
```powershell
node seed-bundle-files.js ./bundle-files
```

✓ Done!
