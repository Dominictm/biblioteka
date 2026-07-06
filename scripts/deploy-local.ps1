param(
    [string]$TargetDir = 'F:\Prodgect\FoundryVTT\Data\modules\biblioteka'
)

$ErrorActionPreference = 'Stop'

$ModuleRoot = Join-Path $PSScriptRoot '..'
Set-Location $ModuleRoot

Write-Host "`n== Сборка модуля (npm run build) =="
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error 'Сборка провалилась.'; exit 1 }

Write-Host "`n== Проверка модуля (npm run verify) =="
npm run verify
if ($LASTEXITCODE -ne 0) { Write-Error 'Проверка провалилась.'; exit 1 }

Write-Host "`n== Деплой в $TargetDir =="
New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null

$targetPacks = Join-Path $TargetDir 'packs'
if (Test-Path $targetPacks) { Remove-Item $targetPacks -Recurse -Force }

Copy-Item -Path (Join-Path $ModuleRoot 'module.json') -Destination $TargetDir -Force
Copy-Item -Path (Join-Path $ModuleRoot 'packs') -Destination $TargetDir -Recurse -Force

Write-Host "`nГотово: локальная тестовая копия модуля обновлена в $TargetDir"
Write-Host 'Перезапусти мир/сервер Foundry, чтобы подхватить изменения паков.'
