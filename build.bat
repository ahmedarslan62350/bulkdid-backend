@echo off
echo Building the project...
call npm run build
echo Build complete!

echo Making the scripts executable (not needed on Windows)

echo The results are:
dir /b /a:-d .\dist\script\backup-mongo.sh
dir /b /a:-d .\dist\script\pm2-scaling.sh

echo Adding Scheduled Tasks (Windows equivalent of Cron Jobs)

:: Schedule Backup-Mongo Task
schtasks /create /tn "BackupMongo" /tr "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass -File C:\bulkdid-backend\dist\script\backup-mongo.ps1" /sc MONTHLY /mo 1 /st 00:00

:: Schedule PM2 Scaling Task (Run at Startup)
schtasks /create /tn "PM2Scaling" /tr "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass -File C:\bulkdid-backend\dist\script\pm2-scaling.ps1" /sc ONSTART

echo Scheduled tasks added successfully!
