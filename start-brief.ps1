# Starts Brief at logon. Exits if this machine is already serving it.
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
try {
    $health = Invoke-WebRequest -Uri "http://127.0.0.1:8787/api/health" -UseBasicParsing -TimeoutSec 2
    if ($health.StatusCode -eq 200) { exit 0 }
} catch {
    # Port is free, or something else is there and Python will try the next one.
}
$python = "C:\Users\RussellSullivan\AppData\Local\Programs\Python\Python312\python.exe"
if (-not (Test-Path $python)) { $python = "python" }
$log = Join-Path $root ".brief-server.log"
if ((Test-Path $log) -and (Get-Item $log).Length -gt 256KB) { Clear-Content $log }
& $python -u server.py >> $log 2>&1
