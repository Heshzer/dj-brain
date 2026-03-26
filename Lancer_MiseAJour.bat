@echo off
color 0b
echo ==============================================
echo    MISE A JOUR DJ BRAIN - SERVEUR v2.0
echo ==============================================
echo.
echo Telechargement et lancement du script...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process powershell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -Command ""$s=[System.Net.WebClient]::new(); $s.Encoding=[System.Text.Encoding]::UTF8; $script=$s.DownloadString(''https://raw.githubusercontent.com/Heshzer/dj-brain/main/mise_a_jour_serveur.ps1''); $tmp=[System.IO.Path]::GetTempFileName()+''''.ps1''''; [System.IO.File]::WriteAllText($tmp,$script,[System.Text.Encoding]::UTF8); Set-Location ''R:\Partage Hanny EL SAYED''; & $tmp; Remove-Item $tmp -ErrorAction SilentlyContinue""' -Verb RunAs -Wait"
echo.
pause
