@echo off
echo Lancement de l'Exportateur par Tag DJ Brain...
echo Connexion par defaut au serveur : http://marcib.ddns.net:4000/api
echo.
cd /d "%~dp0"
call venv\Scripts\activate.bat
python exporter.py
pause
