# Starts the API and web dev servers, each in its own PowerShell window.
$root = $PSScriptRoot

Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run start:dev -w @dealport/api" -WorkingDirectory $root
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev -w @dealport/web" -WorkingDirectory $root
