@echo off
color 0b
echo ==============================================
echo    MISE A JOUR DJ BRAIN - SERVEUR v2.0
echo ==============================================
echo.

echo [1/2] Telechargement de la derniere version depuis GitHub...
powershell -NoProfile -ExecutionPolicy Bypass -Command "(New-Object System.Net.WebClient).DownloadFile('https://raw.githubusercontent.com/Heshzer/dj-brain/main/mise_a_jour_serveur.ps1', '%~dp0mise_a_jour_serveur.ps1')"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERREUR] Impossible de telecharger le script.
    echo Verifiez votre connexion internet et reessayez.
    pause
    exit /b 1
)

echo [OK] Script telecharge.
echo.
echo [2/2] Lancement avec droits administrateur...
echo     ^(La fenetre PowerShell DOIT rester ouverte - lisez les messages^)
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process powershell -ArgumentList '-NoProfile -NoExit -ExecutionPolicy Bypass -File ""%~dp0mise_a_jour_serveur.ps1""' -Verb RunAs -Wait"
echo.
pause
