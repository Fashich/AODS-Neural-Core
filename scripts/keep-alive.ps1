# ==============================================================================
# AODS - Keep Alive Script (Semua 8 Service)
# Ping semua Render service setiap 10 menit agar tidak tidur
#
# Cara jalankan:
#   PowerShell -ExecutionPolicy Bypass -File .\scripts\keep-alive.ps1
#
# Stop: tekan Ctrl+C
# ==============================================================================

$intervalMinutes = 10
$intervalSeconds  = $intervalMinutes * 60

# Ganti BASE_URL jika nama Render service kamu berbeda
$services = @(
    @{
        name = "API Gateway    (9000)"
        url  = "https://aods-api-gateway.onrender.com/health"
    },
    @{
        name = "Python AI      (9001)"
        url  = "https://aods-python-ai.onrender.com/health"
    },
    @{
        name = "Go Telemetry   (9002)"
        url  = "https://aods-go-telemetry.onrender.com/health"
    },
    @{
        name = "C++ HPC        (9003)"
        url  = "https://aods-cpp-hpc.onrender.com/health"
    },
    @{
        name = "C# Enterprise  (9004)"
        url  = "https://aods-csharp-enterprise.onrender.com/api/health"
    },
    @{
        name = "Java Bridge    (9005)"
        url  = "https://aods-java-bridge.onrender.com/actuator/health"
    },
    @{
        name = "PHP Connector  (9006)"
        url  = "https://aods-php-connector.onrender.com/health"
    },
    @{
        name = "Ruby Automation(9007)"
        url  = "https://aods-ruby-automation.onrender.com/health"
    }
)

function Ping-AllServices {
    $time = Get-Date -Format "HH:mm:ss"
    Write-Host ""
    Write-Host "[$time] Pinging semua service..." -ForegroundColor Cyan
    Write-Host "----------------------------------------------" -ForegroundColor DarkGray

    $onlineCount = 0

    foreach ($svc in $services) {
        try {
            $res = Invoke-WebRequest -Uri $svc.url -TimeoutSec 20 -UseBasicParsing -ErrorAction Stop
            Write-Host "  OK  $($svc.name)" -ForegroundColor Green
            $onlineCount++
        }
        catch {
            $errMsg = $_.Exception.Message
            if ($errMsg -match "timed out" -or $errMsg -match "timeout") {
                Write-Host "  ZZ  $($svc.name)  [bangun dari tidur, tunggu ~30 detik]" -ForegroundColor Yellow
            } else {
                Write-Host "  XX  $($svc.name)  [$errMsg]" -ForegroundColor Red
            }
        }
    }

    Write-Host "----------------------------------------------" -ForegroundColor DarkGray
    Write-Host "  $onlineCount / $($services.Count) service online" -ForegroundColor $(if ($onlineCount -eq $services.Count) { "Green" } else { "Yellow" })

    $nextPing = (Get-Date).AddMinutes($intervalMinutes).ToString("HH:mm:ss")
    Write-Host "  Ping berikutnya: $nextPing  |  Ctrl+C untuk stop" -ForegroundColor DarkGray
}

# Banner
Clear-Host
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "  ║        AODS Keep-Alive Monitor               ║" -ForegroundColor Magenta
Write-Host "  ║  Ping 8 service setiap $intervalMinutes menit              ║" -ForegroundColor Magenta
Write-Host "  ║                                              ║" -ForegroundColor Magenta
Write-Host "  ║  Tip: daftar UptimeRobot untuk 24/7 gratis  ║" -ForegroundColor Magenta
Write-Host "  ║  https://uptimerobot.com                     ║" -ForegroundColor Magenta
Write-Host "  ╚══════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# Ping pertama langsung saat script jalan
Ping-AllServices

# Loop terus sampai Ctrl+C
while ($true) {
    Start-Sleep -Seconds $intervalSeconds
    Ping-AllServices
}
