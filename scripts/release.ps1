param(
    [string]$Version
)

$ErrorActionPreference = 'Stop'

$ModuleRoot = Join-Path $PSScriptRoot '..'
Set-Location $ModuleRoot

if (-not $Version) {
    $Version = Read-Host 'Версия релиза (например 1.1.0, без буквы v)'
}
$Version = $Version.Trim().TrimStart('v', 'V')

if ($Version -notmatch '^\d+\.\d+\.\d+$') {
    Write-Error "Некорректный формат версии: '$Version'. Ожидается X.Y.Z"
    exit 1
}

$tag = "v$Version"

if (git rev-parse -q --verify "refs/tags/$tag" 2>$null) {
    Write-Error "Тег $tag уже существует."
    exit 1
}

$dirty = git status --porcelain
if ($dirty) {
    Write-Host 'В рабочей директории есть незакоммиченные изменения:'
    Write-Host $dirty
    $answer = Read-Host 'Продолжить и включить их в релизный коммит? (y/n)'
    if ($answer -ne 'y') {
        Write-Host 'Отменено.'
        exit 1
    }
}

Write-Host "`n== Сборка модуля (npm run build) =="
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error 'Сборка провалилась.'; exit 1 }

Write-Host "`n== Проверка модуля (npm run verify) =="
npm run verify
if ($LASTEXITCODE -ne 0) { Write-Error 'Проверка провалилась.'; exit 1 }

Write-Host "`n== Обновление module.json =="
$manifestPath = Join-Path $ModuleRoot 'module.json'
$manifestText = Get-Content $manifestPath -Raw -Encoding UTF8
$manifestText = $manifestText -replace '("version":\s*)"[^"]*"', "`$1`"$Version`""
$manifestText = $manifestText -replace '("download":\s*)"[^"]*"', "`$1`"https://github.com/Dominictm/biblioteka/releases/download/$tag/biblioteka.zip`""
[System.IO.File]::WriteAllText($manifestPath, $manifestText, (New-Object System.Text.UTF8Encoding($false)))

Write-Host "`n== Коммит и тег =="
git add -A
git commit -m "Release $tag"
git tag -a $tag -m "Release $tag"

Write-Host "`n== Push в origin =="
git push origin master
git push origin $tag

Write-Host "`nГотово: $tag запушен. GitHub Actions соберёт zip и опубликует релиз."
