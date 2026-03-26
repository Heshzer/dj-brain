<#
.SYNOPSIS
Script d'installation automatique DJ-Brain BACKEND UNIQUEMENT v2.0
Le Frontend est desormais heberge sur Vercel - plus besoin de Docker pour ça !
#>

# Ne pas fermer sur erreur - on gère nous-mêmes
$ErrorActionPreference = "Continue"

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Warning "Droits administrateur requis. Relancement..."
    Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

# Fonction helper : docker-compose ou docker compose selon version Docker
function Invoke-DockerCompose {
    param([string[]]$CmdArgs)
    $hasOld = $null -ne (Get-Command "docker-compose" -ErrorAction SilentlyContinue)
    if ($hasOld) { & docker-compose @CmdArgs } else { & docker compose @CmdArgs }
    return $LASTEXITCODE
}

# ─── GARDE-FOU GLOBAL : fenêtre reste ouverte si crash ──────────────────────
trap {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Red
    Write-Host "  ERREUR INATTENDUE - COPIEZ CE MESSAGE     " -ForegroundColor Red
    Write-Host "============================================" -ForegroundColor Red
    Write-Host ($_.Exception.Message) -ForegroundColor Red
    Write-Host ($_.ScriptStackTrace) -ForegroundColor DarkRed
    Write-Host ""
    Read-Host "Appuyez sur Entree pour quitter (envoyez ce message d'erreur a Marc)"
    break
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   INSTALLATION DJ BRAIN - BACKEND v2.0      " -ForegroundColor Cyan
Write-Host "   (Frontend heberge sur Vercel - cloud)     " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# 1. VÉRIFICATION DOCKER
Write-Host "[1/5] Verification de Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = & docker --version 2>&1
    Write-Host "  [OK] $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "  [ERREUR] Docker n'est pas installe ou lance !" -ForegroundColor Red
    Write-Host "  Installez Docker Desktop : https://docs.docker.com/desktop/" -ForegroundColor Red
    Read-Host "Appuyez sur Entree pour quitter"
    exit
}

# 2. DOCKER AU DÉMARRAGE AUTOMATIQUE
Write-Host ""
Write-Host "[2/5] Configuration demarrage automatique Docker..." -ForegroundColor Yellow
$dockerDesktopPath = "$env:LOCALAPPDATA\Docker\Docker Desktop.exe"
if (Test-Path $dockerDesktopPath) {
    $regPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
    Set-ItemProperty -Path $regPath -Name "Docker Desktop" -Value "`"$dockerDesktopPath`"" -ErrorAction SilentlyContinue
    Write-Host "  [OK] Docker demarrera automatiquement au boot." -ForegroundColor Green
} else {
    Write-Host "  [INFO] A configurer manuellement dans Docker Desktop > Settings > General." -ForegroundColor DarkYellow
}

# 3. CONFIGURATION
Write-Host ""
Write-Host "[3/5] Configuration du serveur..." -ForegroundColor Yellow
Write-Host "  Ou sont stockes les fichiers audio sur ce PC ?"
$ftpPathInput = Read-Host "  Chemin complet (ex: C:\FTP\Tracks)"

$dockerVolumePath = $ftpPathInput -replace "\\", "/"
$dockerVolumePath = $dockerVolumePath -replace "^([a-zA-Z]):/", "/$1/"

$envContent = @"
HOST_AUDIO_PATH=$dockerVolumePath
"@
Set-Content -Path ".\\.env" -Value $envContent -Encoding UTF8
Write-Host "  [OK] Configuration enregistree." -ForegroundColor Green

# 4. OUVERTURE DU PARE-FEU (port 4000 uniquement, le 3000 n'est plus nécessaire)
Write-Host ""
Write-Host "[4/5] Ouverture du port 4000 (API) dans le Pare-Feu Windows..." -ForegroundColor Yellow

$port4000 = Get-NetFirewallRule -DisplayName "DJ-Brain API (4000)" -ErrorAction Ignore
if (-not $port4000) {
    try {
        New-NetFirewallRule -DisplayName "DJ-Brain API (4000)" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow > $null
        Write-Host "  [OK] Port 4000 ouvert." -ForegroundColor Green
    } catch {
        Write-Host "  [ERREUR] Impossible d'ouvrir le port 4000 automatiquement." -ForegroundColor Red
    }
} else {
    Write-Host "  [OK] Port 4000 deja ouvert." -ForegroundColor Green
}

# Supprimer la règle port 3000 si elle existe (plus nécessaire)
$port3000 = Get-NetFirewallRule -DisplayName "DJ-Brain Web App" -ErrorAction Ignore
if ($port3000) {
    Remove-NetFirewallRule -DisplayName "DJ-Brain Web App" -ErrorAction SilentlyContinue
    Write-Host "  [INFO] Ancienne regle port 3000 supprimee (plus necessaire, frontend sur Vercel)." -ForegroundColor DarkYellow
}

# 5. LANCEMENT DOCKER (backend + db uniquement)
Write-Host ""
Write-Host "[5/5] Lancement de la base de donnees et du backend..." -ForegroundColor Yellow
Set-Location $PSScriptRoot
$exitCode = Invoke-DockerCompose @("up", "-d", "--build")

if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "  [OK] Backend et base de donnees lances !" -ForegroundColor Green
    Write-Host ""
    & docker ps --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}"
}

# RÉCUPÉRER L'IP LOCALE
$localIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" -and $_.PrefixOrigin -eq "Dhcp"
} | Select-Object -First 1).IPAddress

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "           INSTALLATION TERMINEE !           " -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " [OK] Base de donnees PostgreSQL : en ligne" -ForegroundColor Green
Write-Host " [OK] Backend API sur le port 4000 : en ligne" -ForegroundColor Green
Write-Host " [OK] Docker demarre automatiquement au boot" -ForegroundColor Green
Write-Host ""
Write-Host " [ACTION REQUISE] Configure ta box/routeur :" -ForegroundColor Yellow
Write-Host "   -> Redirige le port 4000 TCP vers : $localIp" -ForegroundColor Yellow
Write-Host "   -> (Pas besoin du port 3000, le site est sur Vercel !)" -ForegroundColor White
Write-Host ""
Write-Host " Une fois la redirection faite, dis-le moi !" -ForegroundColor Cyan
Write-Host ""
Read-Host "Appuyez sur Entree pour quitter"
