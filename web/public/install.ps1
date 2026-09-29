# CloudArena Automated Windows PowerShell Zero-Friction Installer
# Installs all required dependencies (Python, Docker Desktop, k3d, kubectl, CloudArena)
# Automatically skips components that are already installed.

$ErrorActionPreference = "Continue"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   CloudArena Zero-Friction Installer for Windows              " -ForegroundColor Cyan
Write-Host "   AI-Powered Sandboxed Kubernetes Survival Game               " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# 1. Setup Directories
$arenaHome = Join-Path $HOME ".cloudarena"
$binDir = Join-Path $arenaHome "bin"
if (-not (Test-Path $binDir)) {
    New-Item -ItemType Directory -Path $binDir -Force | Out-Null
}

# 2. Check / Install Python
Write-Host "`n[1/5] Checking Python Runtime..." -ForegroundColor White
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    $pythonCmd = Get-Command py -ErrorAction SilentlyContinue
}

if ($pythonCmd) {
    Write-Host "  ✓ Python is already installed ($($pythonCmd.Source)). Skipping." -ForegroundColor Green
} else {
    Write-Host "  ⚙️ Python not found. Installing Python 3.11 automatically..." -ForegroundColor Yellow
    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if ($winget) {
        Write-Host "  Running: winget install Python.Python.3.11..." -ForegroundColor Cyan
        & winget install Python.Python.3.11 --accept-source-agreements --accept-package-agreements --silent
    } else {
        Write-Host "  Downloading official Python installer from python.org..." -ForegroundColor Cyan
        $pyInstaller = Join-Path $env:TEMP "python-installer.exe"
        Invoke-WebRequest -Uri "https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe" -OutFile $pyInstaller
        Start-Process -FilePath $pyInstaller -ArgumentList "/quiet InstallAllUsers=0 PrependPath=1" -Wait
    }
    # Refresh PATH in current session
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "User") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "Machine")
    $pythonCmd = Get-Command python -ErrorAction SilentlyContinue
    if ($pythonCmd) {
        Write-Host "  ✓ Python successfully installed!" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ Please restart PowerShell after installation to refresh PATH." -ForegroundColor Yellow
    }
}

# 3. Check / Install Docker Desktop
Write-Host "`n[2/5] Checking Docker Engine & Daemon..." -ForegroundColor White
$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
$dockerRunning = $false

if ($dockerCmd) {
    # Check if daemon is active
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerRunning = $true
        Write-Host "  ✓ Docker Engine is already installed and running. Skipping." -ForegroundColor Green
    } else {
        Write-Host "  ⚡ Docker CLI found, but Docker daemon is closed." -ForegroundColor Yellow
        Write-Host "  Attempting to launch Docker Desktop..." -ForegroundColor Cyan
        $desktopExe = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        if (Test-Path $desktopExe) {
            Start-Process $desktopExe
            Write-Host "  ✓ Launched Docker Desktop. Waking up daemon in background." -ForegroundColor Green
        }
    }
} else {
    Write-Host "  ⚙️ Docker not found. Installing Docker Desktop automatically..." -ForegroundColor Yellow
    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if ($winget) {
        Write-Host "  Running: winget install Docker.DockerDesktop..." -ForegroundColor Cyan
        & winget install Docker.DockerDesktop --accept-source-agreements --accept-package-agreements
    } else {
        Write-Host "  Downloading official Docker Desktop installer..." -ForegroundColor Cyan
        $dockerInstaller = Join-Path $env:TEMP "DockerDesktopInstaller.exe"
        Invoke-WebRequest -Uri "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe" -OutFile $dockerInstaller
        Write-Host "  Launching Docker Desktop setup..." -ForegroundColor Cyan
        Start-Process -FilePath $dockerInstaller -ArgumentList "install" -Wait
    }
    Write-Host "  ✓ Docker Desktop installation completed!" -ForegroundColor Green
    Write-Host "  ⚠️ Note: If prompted, ensure WSL2 feature is enabled and restart if required." -ForegroundColor Yellow
}

# 4. Check / Download k3d
Write-Host "`n[3/5] Checking Kubernetes Cluster Provisioner (k3d)..." -ForegroundColor White
$k3dTarget = Join-Path $binDir "k3d.exe"
if (Test-Path $k3dTarget) {
    Write-Host "  ✓ k3d is already installed at $k3dTarget. Skipping." -ForegroundColor Green
} else {
    Write-Host "  📦 Downloading k3d (v5.7.4) for Windows..." -ForegroundColor Cyan
    $k3dUrl = "https://github.com/k3d-io/k3d/releases/download/v5.7.4/k3d-windows-amd64.exe"
    Invoke-WebRequest -Uri $k3dUrl -OutFile $k3dTarget
    Write-Host "  ✓ k3d installed successfully!" -ForegroundColor Green
}

# 5. Check / Download kubectl
Write-Host "`n[4/5] Checking Kubernetes CLI (kubectl)..." -ForegroundColor White
$kubectlTarget = Join-Path $binDir "kubectl.exe"
if (Test-Path $kubectlTarget) {
    Write-Host "  ✓ kubectl is already installed at $kubectlTarget. Skipping." -ForegroundColor Green
} else {
    Write-Host "  📦 Downloading kubectl (v1.30.2) for Windows..." -ForegroundColor Cyan
    $kubectlUrl = "https://dl.k8s.io/release/v1.30.2/bin/windows/amd64/kubectl.exe"
    Invoke-WebRequest -Uri $kubectlUrl -OutFile $kubectlTarget
    Write-Host "  ✓ kubectl installed successfully!" -ForegroundColor Green
}

# 6. Install CloudArena CLI Package via pip
Write-Host "`n[5/5] Installing CloudArena Platform..." -ForegroundColor White
$wheelUrl = "https://gdg-cloudarena.web.app/cloudarena-latest-py3-none-any.whl"
$archiveUrl = "https://github.com/AdityaPatra-dev/CloudArena/archive/refs/heads/main.zip"

& python -m pip install --upgrade --force-reinstall --user $wheelUrl
if ($LASTEXITCODE -ne 0) {
    & python -m pip install --upgrade --user $archiveUrl
}

# Ensure manifests exist in ~/.cloudarena/manifests
$manifestsDir = Join-Path $homeDir "manifests"
if (-not (Test-Path $manifestsDir)) {
    New-Item -ItemType Directory -Path $manifestsDir -Force | Out-Null
}
$manifestFiles = @("00_namespaces.yaml", "01_cache.yaml", "02_backend.yaml", "03_frontend.yaml", "04_traffic_gen.yaml")
foreach ($mf in $manifestFiles) {
    $mfPath = Join-Path $manifestsDir $mf
    if (-not (Test-Path $mfPath)) {
        Invoke-WebRequest -Uri "https://gdg-cloudarena.web.app/manifests/$mf" -OutFile $mfPath -UseBasicParsing -ErrorAction SilentlyContinue
    }
}


# 7. Configure PATH Environment Variables
$userPath = [System.Environment]::GetEnvironmentVariable("PATH", "User")
if ($userPath -notlike "*$binDir*") {
    [System.Environment]::SetEnvironmentVariable("PATH", "$userPath;$binDir", "User")
}
if ($env:PATH -notlike "*$binDir*") {
    $env:PATH = "$env:PATH;$binDir"
}

# Add user Python Scripts folder to PATH if needed
$pythonUserBase = & python -m site --user-base 2>$null
if ($pythonUserBase) {
    $pyScripts = Join-Path $pythonUserBase "Scripts"
    if ((Test-Path $pyScripts) -and ($env:PATH -notlike "*$pyScripts*")) {
        $env:PATH = "$env:PATH;$pyScripts"
        $currentUserPath = [System.Environment]::GetEnvironmentVariable("PATH", "User")
        if ($currentUserPath -notlike "*$pyScripts*") {
            [System.Environment]::SetEnvironmentVariable("PATH", "$currentUserPath;$pyScripts", "User")
        }
    }
}

Write-Host "`n================================================================" -ForegroundColor Green
Write-Host "  🎉 All CloudArena dependencies are ready!                     " -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host "`nNext Steps in PowerShell:" -ForegroundColor White
Write-Host "  1. Link your arena token:  " -NoNewline
Write-Host "cloudarena link <YOUR_ARENA_TOKEN>" -ForegroundColor Cyan
Write-Host "  2. Run environment doctor: " -NoNewline
Write-Host "cloudarena doctor" -ForegroundColor Cyan
Write-Host "  3. Spin up local cluster:  " -NoNewline
Write-Host "cloudarena start" -ForegroundColor Cyan
Write-Host "  4. Enter Wave 1 battle:    " -NoNewline
Write-Host "cloudarena wave start 1`n" -ForegroundColor Cyan
