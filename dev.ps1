$portable = Join-Path $PSScriptRoot ".tools\node-v22.19.0-win-x64"
if (Test-Path $portable) {
  $env:PATH = "$portable;$env:PATH"
}
Set-Location $PSScriptRoot
npm run dev
