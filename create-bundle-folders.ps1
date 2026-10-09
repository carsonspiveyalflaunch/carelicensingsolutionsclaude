$states = @("alabama","alaska","arizona","arkansas","california","colorado","connecticut","delaware","florida","georgia","hawaii","idaho","illinois","indiana","iowa","kansas","kentucky","louisiana","maine","maryland","massachusetts","michigan","minnesota","mississippi","missouri","montana","nebraska","nevada","new-hampshire","new-jersey","new-mexico","new-york","north-carolina","north-dakota","ohio","oklahoma","oregon","pennsylvania","rhode-island","south-carolina","south-dakota","tennessee","texas","utah","vermont","virginia","washington","west-virginia","wisconsin","wyoming")

$programs = @("assisted-living-facilities","nursing-facilities-snf","home-health-agencies","adult-day-care-programs","hospice-programs","child-care-facilities","group-homes-for-children","personal-home-care","residential-care-dd","residential-treatment-children")

$bundleFilesPath = "bundle-files"
if (-not (Test-Path $bundleFilesPath)) {
    New-Item -ItemType Directory -Path $bundleFilesPath | Out-Null
}

$count = 0
$total = $states.Count * $programs.Count

foreach ($state in $states) {
    foreach ($program in $programs) {
        $folderName = "$state-$program-complete-bundle"
        $folderPath = Join-Path $bundleFilesPath $folderName
        
        if (-not (Test-Path $folderPath)) {
            New-Item -ItemType Directory -Path $folderPath | Out-Null
        }
        $count++
        
        if ($count % 50 -eq 0) {
            Write-Host "Created $count / $total folders"
        }
    }
}

Write-Host ""
Write-Host "SUCCESS: Folder structure created"
Write-Host "Total Folders: $count"
Write-Host "States: 50"
Write-Host "Programs per State: 10"
Write-Host "Location: ./bundle-files/"
Write-Host ""
Write-Host "Next Steps:"
Write-Host "1. Add your 4 files to each folder"
Write-Host "2. Run: node seed-all-bundles.js"
Write-Host "3. Run: node seed-bundle-files.js ./bundle-files"
Write-Host ""
