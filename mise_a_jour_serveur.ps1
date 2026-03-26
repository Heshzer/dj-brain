<#
.SYNOPSIS
Script de mise a jour automatique DJ-Brain v2.0
Ce script verifie Docker, recupere l'IP locale, active Docker au demarrage, et relance les conteneurs.
#>

# Ne pas fermer sur erreur - on gere nous-memes
$ErrorActionPreference = "Continue"

# Demande elevation Admin si necessaire
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Warning "Droits administrateur requis. Relancement..."
    Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

# Fonction helper : lance docker-compose ou docker compose selon version Docker
function Invoke-DockerCompose {
    param([string[]]$CmdArgs)
    $hasOld = $null -ne (Get-Command "docker-compose" -ErrorAction SilentlyContinue)
    if ($hasOld) {
        & docker-compose @CmdArgs
    } else {
        & docker compose @CmdArgs
    }
    return $LASTEXITCODE
}

# Garde-fou global : fenetre reste ouverte si crash
trap {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Red
    Write-Host "  ERREUR INATTENDUE - COPIEZ CE MESSAGE     " -ForegroundColor Red
    Write-Host "============================================" -ForegroundColor Red
    Write-Host ($_.Exception.Message) -ForegroundColor Red
    Write-Host ($_.ScriptStackTrace) -ForegroundColor DarkRed
    Write-Host ""
    Read-Host "Appuyez sur Entree pour quitter (envoyez ce message a Marc)"
    break
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "     MISE A JOUR DJ BRAIN - SERVEUR v2.0     " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# 1. VERIFICATION DOCKER
Write-Host "[1/6] Verification de Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = & docker --version 2>&1
    Write-Host "  [OK] $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "  [ERREUR] Docker n'est pas lance ou installe !" -ForegroundColor Red
    Write-Host "  Lancez Docker Desktop et reessayez." -ForegroundColor Red
    Read-Host "Appuyez sur Entree pour quitter"
    exit
}

# 2. DOCKER AU BOOT
Write-Host ""
Write-Host "[2/6] Configuration Docker au demarrage Windows..." -ForegroundColor Yellow
$dockerDesktopPath = "$env:LOCALAPPDATA\Docker\Docker Desktop.exe"
if (Test-Path $dockerDesktopPath) {
    $regPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
    Set-ItemProperty -Path $regPath -Name "Docker Desktop" -Value "`"$dockerDesktopPath`"" -ErrorAction SilentlyContinue
    Write-Host "  [OK] Docker demarrera automatiquement au boot." -ForegroundColor Green
} else {
    Write-Host "  [INFO] Docker Desktop non trouve au chemin standard." -ForegroundColor DarkYellow
}

# 3. IP LOCALE
Write-Host ""
Write-Host "[3/6] Detection de votre adresse IP locale..." -ForegroundColor Yellow
$localIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" -and $_.PrefixOrigin -eq "Dhcp"
} | Select-Object -First 1).IPAddress

if ($localIp) {
    Write-Host "  [OK] Votre IP locale est : $localIp" -ForegroundColor Green
} else {
    Write-Host "  [INFO] IP non detectee. Tapez 'ipconfig' en cmd pour la trouver." -ForegroundColor DarkYellow
}

# 4. TELECHARGEMENT DE LA DERNIERE VERSION
Write-Host ""
Write-Host "[4/6] Telechargement du code depuis GitHub..." -ForegroundColor Yellow
Set-Location $PSScriptRoot
try {
    & git fetch origin 2>&1 | Out-Null
    & git reset --hard origin/main 2>&1 | Out-Null
    Write-Host "  [OK] Code mis a jour." -ForegroundColor Green
} catch {
    Write-Host "  [ATTENTION] Mise a jour Git echouee. Verifiez manuellement." -ForegroundColor DarkYellow
}

# Trouver le docker-compose.yml
Write-Host ""
Write-Host "[?] Recherche de docker-compose.yml..." -ForegroundColor Yellow
$composeFile = $null
if (Test-Path "$PSScriptRoot\docker-compose.yml") {
    $composeFile = "$PSScriptRoot\docker-compose.yml"
} else {
    $found = Get-ChildItem -Path $PSScriptRoot -Filter "docker-compose.yml" -Recurse -Depth 3 -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) { $composeFile = $found.FullName }
}

if (-not $composeFile) {
    Write-Host "  [ERREUR] docker-compose.yml introuvable !" -ForegroundColor Red
    Write-Host "  Verifiez que le dossier dj-brain est complet." -ForegroundColor Red
    Read-Host "Appuyez sur Entree pour quitter"
    exit 1
}

$composeDir = Split-Path $composeFile
Write-Host "  [OK] docker-compose.yml trouve dans : $composeDir" -ForegroundColor Green
Set-Location $composeDir

# 5. ARRET DES CONTENEURS
Write-Host ""
Write-Host "[5/6] Arret des anciens conteneurs DJ Brain..." -ForegroundColor Yellow
Invoke-DockerCompose "down"
Write-Host "  [OK] Conteneurs arretes." -ForegroundColor Green

# 6. RELANCE
Write-Host ""
Write-Host "[6/6] Reconstruction et relancement (2-3 minutes)..." -ForegroundColor Yellow
$exitCode = Invoke-DockerCompose @("up", "-d", "--build")

if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "  [OK] Tous les conteneurs sont lances !" -ForegroundColor Green
    Write-Host ""
    & docker ps --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}"
} else {
    Write-Host ""
    Write-Host "  [ERREUR] docker compose a retourne une erreur. Voir les logs ci-dessus." -ForegroundColor Red
}

# RESUME FINAL
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "                RESUME FINAL                 " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  [OK] Docker configure pour demarrer au boot" -ForegroundColor Green
Write-Host "  [OK] Conteneurs DJ Brain relances" -ForegroundColor Green
if ($localIp) {
    Write-Host "  [OK] IP locale du serveur : $localIp" -ForegroundColor Green
}
Write-Host ""
Write-Host "  L'app est accessible sur : http://marcib.ddns.net:3000" -ForegroundColor Cyan
Write-Host ""
Read-Host "Appuyez sur Entree pour quitter"
