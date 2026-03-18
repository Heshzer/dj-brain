<#
.SYNOPSIS
Script de mise à jour automatique DJ-Brain v2.0
Ce script : vérifie Docker, récupère ton IP locale, active Docker au démarrage, et relance les conteneurs.
#>

$ErrorActionPreference = "Stop"

# Demande élévation Admin si nécessaire
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Warning "Droits administrateur requis. Relancement..."
    Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "     MISE A JOUR DJ BRAIN - SERVEUR v2.0     " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# ─── 1. VÉRIFICATION DOCKER ─────────────────────────────────────────────────
Write-Host "[1/5] Verification de Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = & docker --version 2>&1
    Write-Host "  [OK] $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "  [ERREUR] Docker n'est pas lance ou installe !" -ForegroundColor Red
    Write-Host "  Lancez Docker Desktop et reessayez." -ForegroundColor Red
    Read-Host "Appuyez sur Entree pour quitter"
    exit
}

# ─── 2. DOCKER DÉMARRE AU BOOT ──────────────────────────────────────────────
Write-Host ""
Write-Host "[2/5] Configuration de Docker pour demarrer au boot Windows..." -ForegroundColor Yellow
$dockerDesktopPath = "$env:LOCALAPPDATA\Docker\Docker Desktop.exe"
if (Test-Path $dockerDesktopPath) {
    $regPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
    Set-ItemProperty -Path $regPath -Name "Docker Desktop" -Value "`"$dockerDesktopPath`"" -ErrorAction SilentlyContinue
    Write-Host "  [OK] Docker demarrera automatiquement au prochain boot." -ForegroundColor Green
} else {
    Write-Host "  [INFO] Docker Desktop non trouve au chemin standard, a verifier manuellement." -ForegroundColor DarkYellow
}

# ─── 3. RÉCUPÉRER ET AFFICHER L'IP LOCALE ───────────────────────────────────
Write-Host ""
Write-Host "[3/5] Detection de votre adresse IP locale..." -ForegroundColor Yellow
$localIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" -and $_.PrefixOrigin -eq "Dhcp"
} | Select-Object -First 1).IPAddress

if ($localIp) {
    Write-Host "  [OK] Votre IP locale est : $localIp" -ForegroundColor Green
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║  NOTEZ CET IP POUR LA CONFIGURATION DE VOTRE BOX ║" -ForegroundColor Cyan
    Write-Host "  ║                                                    ║" -ForegroundColor Cyan
    Write-Host "  ║   IP Locale du serveur : $localIp" -ForegroundColor Yellow
    Write-Host "  ║   Ports a rediriger   : 3000 et 4000 (TCP)        ║" -ForegroundColor Yellow
    Write-Host "  ╚════════════════════════════════════════════════════╝" -ForegroundColor Cyan
} else {
    Write-Host "  [INFO] IP non detectee automatiquement. Tapez 'ipconfig' en cmd pour la trouver." -ForegroundColor DarkYellow
}

# ─── 4. RELANCE DES CONTENEURS DOCKER ───────────────────────────────────────
Write-Host ""
Write-Host "[4/5] Arret des anciens conteneurs DJ Brain..." -ForegroundColor Yellow
Set-Location $PSScriptRoot
& docker-compose down
Write-Host "  [OK] Conteneurs arretes." -ForegroundColor Green

Write-Host ""
Write-Host "[5/5] Reconstruction et relancement (peut prendre 2-3 minutes)..." -ForegroundColor Yellow
& docker-compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "  [OK] Tous les conteneurs sont lances !" -ForegroundColor Green
    Write-Host ""
    & docker ps --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}"
} else {
    Write-Host ""
    Write-Host "  [ERREUR] docker-compose a retourne une erreur. Voir les logs ci-dessus." -ForegroundColor Red
}

# ─── RÉSUMÉ FINAL ────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "                 RESUME FINAL                " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " [OK] Docker configure pour demarrer au boot" -ForegroundColor Green
Write-Host " [OK] Conteneurs DJ Brain relances (version corrigee)" -ForegroundColor Green
Write-Host ""
Write-Host " [ACTION MANUELLE REQUISE] Configuration de la box/routeur :" -ForegroundColor Yellow
Write-Host "   - Connectez-vous a votre box (souvent http://192.168.1.1)" -ForegroundColor White
Write-Host "   - Cherchez : Redirection de ports / NAT / Port Forwarding" -ForegroundColor White
Write-Host "   - Ajouter ces 2 regles :" -ForegroundColor White
if ($localIp) {
    Write-Host "       Port 3000 TCP  ->  $localIp : 3000" -ForegroundColor Yellow
    Write-Host "       Port 4000 TCP  ->  $localIp : 4000" -ForegroundColor Yellow
} else {
    Write-Host "       Port 3000 TCP  ->  [VOTRE IP LOCALE] : 3000" -ForegroundColor Yellow
    Write-Host "       Port 4000 TCP  ->  [VOTRE IP LOCALE] : 4000" -ForegroundColor Yellow
}
Write-Host ""
Write-Host " Une fois fait, l'app sera accessible sur : http://marcib.ddns.net:3000" -ForegroundColor Green
Write-Host ""
Read-Host "Appuyez sur Entree pour quitter"
