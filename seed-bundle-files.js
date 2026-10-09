require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// All US states for mapping
const stateMap = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
  kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO',
  montana: 'MT', nebraska: 'NE', nevada: 'NV', hampshire: 'NH', jersey: 'NJ',
  mexico: 'NM', york: 'NY', carolina: 'NC', dakota: 'ND', ohio: 'OH',
  oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', island: 'RI', carolina: 'SC',
  dakota: 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT',
  virginia: 'VA', washington: 'WA', virginia: 'WV', wisconsin: 'WI', wyoming: 'WY',
};

// Program mapping - common variations
const programMap = {
  'assisted living': 'Assisted Living Facilities',
  'assisted-living': 'Assisted Living Facilities',
  'nursing facilities': 'Nursing Facilities (SNF)',
  'nursing-facilities': 'Nursing Facilities (SNF)',
  'snf': 'Nursing Facilities (SNF)',
  'home health': 'Home Health Agencies',
  'home-health': 'Home Health Agencies',
  'adult day': 'Adult Day Care Programs',
  'adult-day': 'Adult Day Care Programs',
  'hospice': 'Hospice Programs',
  'child care': 'Child Care Facilities',
  'child-care': 'Child Care Facilities',
  'group homes': 'Group Homes for Children',
  'group-homes': 'Group Homes for Children',
  'personal home': 'Personal Home Care',
  'personal-home': 'Personal Home Care',
  'residential care': 'Residential Care (DD)',
  'residential-care': 'Residential Care (DD)',
  'residential treatment': 'Residential Treatment (Children)',
  'residential-treatment': 'Residential Treatment (Children)',
};

function normalizeFileLabel(filename) {
  const name = path.parse(filename).name.toLowerCase();
  
  if (name.includes('market') || name.includes('research')) {
    return 'Market Research Report';
  }
  if (name.includes('forma') || name.includes('p-l') || name.includes('p&l') || name.includes('pnl')) {
    return 'Pro Forma P&L Template';
  }
  if (name.includes('policy') || name.includes('procedure') || name.includes('manual')) {
    return 'Policy & Procedure Manual';
  }
  if (name.includes('licensing') || name.includes('checklist')) {
    return 'Licensing Checklist';
  }
  
  return 'Unknown';
}

// Extract state code from folder name: "alaska-assisted-living" → "AL"
function extractStateFromFolder(folderName) {
  const lower = folderName.toLowerCase();
  
  for (let [stateName, code] of Object.entries(stateMap)) {
    if (lower.includes(stateName)) {
      return code;
    }
  }
  
  return null;
}

// Extract program from folder name: "alaska-assisted-living-facilities" → "Assisted Living Facilities"
function extractProgramFromFolder(folderName) {
  const lower = folderName.toLowerCase();
  
  for (let [key, value] of Object.entries(programMap)) {
    if (lower.includes(key)) {
      return value;
    }
  }
  
  return null;
}

async function uploadFileToSupabase(filePath, bundleId, fileLabel, originalFileName, folderName) {
  const filename = originalFileName || path.parse(filePath).base;
  const extension = path.parse(filename).ext.toLowerCase();
  
  // Map extension to MIME type
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls': 'application/vnd.ms-excel',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  };
  
  const contentType = mimeTypes[extension] || 'application/octet-stream';
  
  // Read file
  const fileContent = fs.readFileSync(filePath);
  
  // Create unique path in Supabase storage
  // Pattern: {folderName}/{fileLabel-slug}.{ext}
  const slugify = (str) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const supabasePath = `${folderName}/${slugify(fileLabel)}${extension}`;
  
  try {
    const { data, error } = await supabase.storage
      .from('bundle-files')
      .upload(supabasePath, fileContent, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: false,
      });
    
    if (error) {
      console.error(`      [DEBUG] Upload failed for ${supabasePath}: ${error.message}`);
      return null;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('bundle-files')
      .getPublicUrl(supabasePath);
    
    return {
      label: fileLabel,
      name: filename,
      type: extension.substring(1).toUpperCase(),
      size: fileContent.length,
      url: publicUrl,
      path: supabasePath,
    };
  } catch (error) {
    console.error(`      [DEBUG] Upload exception for ${supabasePath}: ${error.message}`);
    return null;
  }
}

async function findBundleByStateAndProgram(stateCode, program) {
  const { data, error } = await supabase
    .from('products')
    .select('id, state, code, program')
    .eq('type', 'bundle')
    .eq('code', stateCode)
    .ilike('program', `%${program}%`)
    .single();
  
  if (error) {
    return null;
  }
  
  return data;
}

async function updateBundleWithFiles(bundleId, files) {
  const { data: bundle, error: fetchError } = await supabase
    .from('products')
    .select('metadata')
    .eq('id', bundleId)
    .single();
  
  if (fetchError) {
    console.error(`  ✗ Could not fetch bundle ${bundleId}: ${fetchError.message}`);
    return false;
  }
  
  const metadata = bundle.metadata || {};
  metadata.files = files;
  
  const { error: updateError } = await supabase
    .from('products')
    .update({ metadata })
    .eq('id', bundleId);
  
  if (updateError) {
    console.error(`  ✗ Could not update bundle ${bundleId}: ${updateError.message}`);
    return false;
  }
  
  return true;
}

async function processFilesFromFolders(baseDir) {
  console.log(`📂 Scanning folder: ${baseDir}\n`);
  
  const bundles = {};
  const errors = [];
  
  // Get all folders in baseDir
  const folders = fs.readdirSync(baseDir).filter((item) => {
    return fs.statSync(path.join(baseDir, item)).isDirectory();
  });
  
  console.log(`Found ${folders.length} bundle folders\n`);
  
  for (let folderName of folders) {
    const folderPath = path.join(baseDir, folderName);
    const stateCode = extractStateFromFolder(folderName);
    const program = extractProgramFromFolder(folderName);
    
    if (!stateCode || !program) {
      errors.push({
        folder: folderName,
        reason: `Could not parse folder name. State: ${stateCode}, Program: ${program}`,
      });
      continue;
    }
    
    // Get files in this folder
    const files = fs.readdirSync(folderPath).filter((item) => {
      const fullPath = path.join(folderPath, item);
      const stat = fs.statSync(fullPath);
      if (!stat.isFile()) return false;
      
      const ext = path.parse(item).ext.toLowerCase();
      return ['.pdf', '.xlsx', '.xls', '.doc', '.docx', '.pptx'].includes(ext);
    });
    
    // Skip only if folder is completely empty
    if (files.length === 0) {
      errors.push({
        folder: folderName,
        reason: `No files found in folder`,
      });
      continue;
    }
    
    // Map files to labels - upload whatever files have detectable labels
    const bundleFiles = {};
    const unknownFiles = [];
    for (let file of files) {
      const fileLabel = normalizeFileLabel(file);
      if (fileLabel === 'Unknown') {
        unknownFiles.push(file);
        continue;
      }
      
      bundleFiles[fileLabel] = path.join(folderPath, file);
    }
    
    // Report unknown files but continue with known files
    if (unknownFiles.length > 0) {
      errors.push({
        folder: folderName,
        reason: `Skipping ${unknownFiles.length} file(s) with undetectable names: ${unknownFiles.join(', ')}`,
      });
    }
    
    // Add bundle even if only partial files detected
    if (Object.keys(bundleFiles).length > 0) {
      const bundleKey = `${stateCode}-${program}`;
      bundles[bundleKey] = {
        folder: folderName,
        state: stateCode,
        program: program,
        files: bundleFiles,
        fileCount: Object.keys(bundleFiles).length,
      };
    } else if (Object.keys(bundleFiles).length === 0 && files.length > 0) {
      // All files had unknown names
      errors.push({
        folder: folderName,
        reason: `Could not detect any file types (all files have unknown names)`,
      });
    }
  }
  
  const totalFiles = Object.values(bundles).reduce((sum, b) => sum + b.fileCount, 0);
  return { bundles, errors, totalFiles, folderCount: folders.length };
}

async function uploadBundleFiles(baseDir, batchSize = 5) {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         BULK BUNDLE FILE UPLOAD - All States               ║');
  console.log('║        50 States × 10 Programs = 500 Bundles × 4 Files    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const { bundles, errors, totalFiles, folderCount } = await processFilesFromFolders(baseDir);
  
  // Show errors
  if (errors.length > 0) {
    console.log(`⚠️  ${errors.length} errors found:\n`);
    errors.forEach((err) => {
      console.log(`  ✗ ${err.folder || err.file}`);
      console.log(`    → ${err.reason}\n`);
    });
  }
  
  console.log(`📦 Ready to process:\n`);
  console.log(`   Total Folders: ${folderCount}`);
  console.log(`   Valid Bundles: ${Object.keys(bundles).length}`);
  console.log(`   Total Files: ${totalFiles}\n`);
  console.log('─'.repeat(60) + '\n');
  
  const bundleKeys = Object.keys(bundles);
  let uploaded = 0;
  let partiallyUploaded = 0;
  let failed = 0;
  let skipped = 0;
  let totalFilesUploaded = 0;
  
  // Process in batches
  for (let i = 0; i < bundleKeys.length; i += batchSize) {
    const batchKeys = bundleKeys.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(bundleKeys.length / batchSize);
    
    console.log(`\n📊 Batch ${batchNum}/${totalBatches} (${batchKeys.length} bundles)\n`);
    
    for (let bundleKey of batchKeys) {
      const bundle = bundles[bundleKey];
      const { state, program, files: bundleFiles } = bundle;
      
      // Find the bundle in database
      const dbBundle = await findBundleByStateAndProgram(state, program);
      
      if (!dbBundle) {
        console.log(`  ✗ ${state} - ${program}`);
        console.log(`    → Bundle not found in database\n`);
        skipped++;
        continue;
      }
      
      console.log(`  📦 ${state} - ${program}`);
      
      // Upload each file
      const uploadedFiles = [];
      let bundleFilesCount = 0;
      
      for (let [fileLabel, filePath] of Object.entries(bundleFiles)) {
        bundleFilesCount++;
        const fileName = path.basename(filePath);
        const fileSize = fs.statSync(filePath).size;
        const fileSizeKB = Math.round(fileSize / 1024);
        
        const uploadedFile = await uploadFileToSupabase(filePath, dbBundle.id, fileLabel, fileName, bundle.folder);
        
        if (uploadedFile) {
          uploadedFiles.push(uploadedFile);
          console.log(`     ✓ ${fileLabel.padEnd(30)} ${fileSizeKB.toString().padStart(6)} KB`);
          totalFilesUploaded++;
        } else {
          console.log(`     ✗ ${fileLabel.padEnd(30)}`);
        }
      }
      
      // Update bundle metadata with file info
      if (uploadedFiles.length > 0) {
        const updated = await updateBundleWithFiles(dbBundle.id, uploadedFiles);
        if (updated) {
          if (uploadedFiles.length === 4) {
            uploaded++;
            console.log(`     ✓ Bundle updated (4/4 files)\n`);
          } else {
            partiallyUploaded++;
            console.log(`     ⚠ Bundle updated (${uploadedFiles.length}/4 files)\n`);
          }
        } else {
          failed++;
          console.log(`     ✗ Failed to update bundle\n`);
        }
      } else {
        failed++;
        console.log(`     ✗ No files uploaded\n`);
      }
    }
  }
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    UPLOAD COMPLETE                          ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║ Bundles Fully Updated: ${uploaded.toString().padEnd(40)} ║`);
  console.log(`║ Bundles Partially Updated: ${partiallyUploaded.toString().padEnd(33)} ║`);
  console.log(`║ Failed: ${failed.toString().padEnd(50)} ║`);
  console.log(`║ Skipped (not in DB): ${skipped.toString().padEnd(37)} ║`);
  console.log(`║ Total Files Uploaded: ${totalFilesUploaded.toString().padEnd(38)} ║`);
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║ Success Rate: ${((uploaded / bundleKeys.length) * 100).toFixed(1)}%`.padEnd(61) + '║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  return { uploaded, partiallyUploaded, failed, skipped, totalFilesUploaded };
}

// Main execution
const baseDir = process.argv[2] || './bundle-files';

if (!fs.existsSync(baseDir)) {
  console.error(`Error: Directory not found: ${baseDir}`);
  console.error('\nUsage: node seed-bundle-files.js <path-to-files-folder>');
  console.error('Example: node seed-bundle-files.js ./bundle-files');
  process.exit(1);
}

uploadBundleFiles(baseDir)
  .then(() => {
    console.log('✓ All files processed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ ERROR:', error.message);
    process.exit(1);
  });
