@echo off
color 0b
echo ==============================================
echo   Lancement de l'installateur automatisé DJ-Brain
echo ==============================================
echo.
echo Demande des droits Administrateur (requis pour le Pare-Feu)...
powershell -Command "Start-Process powershell -ArgumentList '-ExecutionPolicy Bypass -File \"%~dp0installer.ps1\"' -Verb RunAs"
exit
