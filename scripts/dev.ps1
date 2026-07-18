# Start CanVas dev servers (web + sync). Run from repo root.
Set-Location $PSScriptRoot\..

Write-Host "Starting CanVas (web :3000 + sync :1234)..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop both." -ForegroundColor DarkGray

pnpm dev
