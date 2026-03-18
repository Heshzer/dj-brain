@echo off
color 0b
echo ==============================================
echo    MISE A JOUR DJ BRAIN - SERVEUR v2.0
echo ==============================================
echo.
echo Demande des droits Administrateur (requis)...
powershell -Command "Start-Process powershell -ArgumentList '-ExecutionPolicy Bypass -File \"%~dp0mise_a_jour_serveur.ps1\"' -Verb RunAs"
exit
