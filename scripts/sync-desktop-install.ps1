$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$portable = Join-Path $root '.tools\node-v22.19.0-win-x64'
$source = Join-Path $root 'release\win-unpacked'
$dest = Join-Path $env:LOCALAPPDATA 'Programs\solution-arch-organize'

if (Test-Path -LiteralPath $portable) {
  $env:PATH = "$portable;$env:PATH"
}

$npmCmd = Join-Path $portable 'npm.cmd'
if (-not (Test-Path -LiteralPath $npmCmd)) {
  $npmCmd = 'npm.cmd'
}

Set-Location -LiteralPath $root
$env:CSC_IDENTITY_AUTO_DISCOVERY = 'false'

Write-Host 'Building Windows unpacked app...'
cmd.exe /c "`"$npmCmd`" run build"
if ($LASTEXITCODE -ne 0) {
  throw "npm run build failed with exit $LASTEXITCODE"
}

cmd.exe /c "`"$npmCmd`" exec -- electron-builder --win --dir"
if ($LASTEXITCODE -ne 0) {
  throw "electron-builder --dir failed with exit $LASTEXITCODE"
}

$builtExe = Join-Path $source 'Solution Arch Organize.exe'
if (-not (Test-Path -LiteralPath $builtExe)) {
  throw "Build output missing: $builtExe"
}

Get-Process -ErrorAction SilentlyContinue |
  Where-Object { $_.ProcessName -eq 'Solution Arch Organize' } |
  ForEach-Object {
    Write-Host "Stopping running app PID $($_.Id)"
    Stop-Process -Id $_.Id -Force
  }

Start-Sleep -Seconds 1
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Copy-Item -Path (Join-Path $source '*') -Destination $dest -Recurse -Force

& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'install-desktop-shortcut.ps1')
if ($LASTEXITCODE -ne 0) {
  throw "Shortcut update failed with exit $LASTEXITCODE"
}

$asar = Join-Path $dest 'resources\app.asar'
Write-Host "Installed app updated: $dest"
if (Test-Path -LiteralPath $asar) {
  Get-Item -LiteralPath $asar | Format-List FullName, LastWriteTime, Length
}
