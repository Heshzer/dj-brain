@echo off
echo Lancement de l'Agent de Synchronisation DJ Brain...
echo L'agent va se connecter au serveur : http://marcib.ddns.net:4000/api
echo.
cd /d "%~dp0"
call venv\Scripts\activate.bat
python main.py
pause
