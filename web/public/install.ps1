# CloudArena Windows PowerShell Installer
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   CloudArena CLI Installer for Windows PowerShell      " -ForegroundColor Cyan
Write-Host "   AI-Powered Sandboxed Kubernetes Survival Game        " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Check Python
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    $pythonCmd = Get-Command py -ErrorAction SilentlyContinue
}

if (-not $pythonCmd) {
    Write-Host "❌ Python is not installed or not in your PATH." -ForegroundColor Red
    Write-Host "Please install Python 3.10+ from https://www.python.org/ or Windows Store."
    Exit 1
}

Write-Host "✓ Found Python: $($pythonCmd.Source)" -ForegroundColor Green

# 2. Check Git
$gitCmd = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitCmd) {
    Write-Host "❌ Git is not installed. Please install Git for Windows from https://git-scm.com/." -ForegroundColor Red
    Exit 1
}
Write-Host "✓ Found Git" -ForegroundColor Green

# 3. Check Docker
$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerCmd) {
    Write-Host "⚠️ Docker Desktop is not detected in PATH. Ensure Docker Desktop is installed and running." -ForegroundColor Yellow
} else {
    Write-Host "✓ Found Docker" -ForegroundColor Green
}

# 4. Install CloudArena via pip
Write-Host "`n📦 Installing CloudArena CLI via pip..." -ForegroundColor Cyan
& python -m pip install --upgrade --user https://github.com/AdityaPatra-dev/CloudArena/archive/refs/heads/main.zip
if ($LASTEXITCODE -ne 0) {
    & python -m pip install --upgrade --user git+https://github.com/AdityaPatra-dev/CloudArena.git
}

Write-Host "`n✓ CloudArena CLI successfully installed!" -ForegroundColor Green
Write-Host "`nNext Steps in PowerShell:" -ForegroundColor White
Write-Host "  1. Link your arena token:  " -NoNewline
Write-Host "cloudarena link <YOUR_TOKEN>" -ForegroundColor Cyan
Write-Host "  2. Spin up 3-node cluster: " -NoNewline
Write-Host "cloudarena start" -ForegroundColor Cyan
Write-Host "  3. Enter Wave 1 battle:    " -NoNewline
Write-Host "cloudarena wave start 1" -ForegroundColor Cyan
Write-Host "  4. Check status anytime:   " -NoNewline
Write-Host "cloudarena whoami`n" -ForegroundColor Cyan
