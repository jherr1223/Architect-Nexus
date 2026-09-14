$ErrorActionPreference = 'Stop'
$exe = Join-Path $env:LOCALAPPDATA 'Programs\solution-arch-organize\Solution Arch Organize.exe'
$workDir = Split-Path -Parent $exe

if (-not (Test-Path -LiteralPath $exe)) {
  throw "Installed app not found: $exe"
}

function Get-ShortcutFolders {
  $folders = @()
  $desktop = [Environment]::GetFolderPath('Desktop')
  if ($desktop) {
    $folders += $desktop
  }
  $oneDrive = Join-Path $env:USERPROFILE 'OneDrive - kochind.com\Desktop'
  if (Test-Path -LiteralPath $oneDrive) {
    $folders += $oneDrive
  }
  $startMenu = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'
  if (Test-Path -LiteralPath $startMenu) {
    $folders += $startMenu
  }
  return $folders | Select-Object -Unique
}

$shell = New-Object -ComObject WScript.Shell
$updated = @()
foreach ($folder in Get-ShortcutFolders) {
  $shortcutPath = Join-Path $folder 'Solution Arch Organize.lnk'
  $shortcut = $shell.CreateShortcut($shortcutPath)
  $shortcut.TargetPath = $exe
  $shortcut.Arguments = ''
  $shortcut.WorkingDirectory = $workDir
  $shortcut.WindowStyle = 1
  $shortcut.Description = 'Solution Arch Organize'
  $shortcut.IconLocation = "$exe,0"
  $shortcut.Save()
  $updated += $shortcutPath
}

Write-Host 'Shortcuts point at the installed app:'
$updated | ForEach-Object { Write-Host " - $_" }
Write-Host "Target: $exe"
