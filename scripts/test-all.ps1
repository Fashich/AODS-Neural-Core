# AODS - Comprehensive Testing Script (PowerShell)
# Validates all services and components

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "AODS Testing Suite" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Load .env file
$envFile = Join-Path $PSScriptRoot "..\.env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Process')
        }
    }
}

# Test counters
$script:TestsPassed = 0
$script:TestsFailed = 0

# Function to test a service
function Test-Service {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Endpoint,
        [string]$ExpectedField = "status"
    )

    Write-Host "Testing $Name... " -NoNewline

    try {
        $response = Invoke-RestMethod -Uri "$Url$Endpoint" -Method GET -TimeoutSec 5 -ErrorAction Stop

        if ($response.$ExpectedField -or $response -match $ExpectedField) {
            Write-Host "PASSED" -ForegroundColor Green
            $script:TestsPassed++
            return $true
        } else {
            Write-Host "FAILED" -ForegroundColor Red
            $script:TestsFailed++
            return $false
        }
    } catch {
        Write-Host "FAILED" -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor DarkGray
        $script:TestsFailed++
        return $false
    }
}

# Function to test POST endpoint
function Test-PostEndpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Endpoint,
        [object]$Body,
        [string]$ExpectedField
    )

    Write-Host "Testing $Name... " -NoNewline

    try {
        $jsonBody = $Body | ConvertTo-Json -Depth 10
        $response = Invoke-RestMethod -Uri "$Url$Endpoint" -Method POST -Body $jsonBody -ContentType "application/json" -TimeoutSec 5 -ErrorAction Stop

        if ($response.$ExpectedField -or ($response | ConvertTo-Json) -match $ExpectedField) {
            Write-Host "PASSED" -ForegroundColor Green
            $script:TestsPassed++
            return $true
        } else {
            Write-Host "FAILED" -ForegroundColor Red
            $script:TestsFailed++
            return $false
        }
    } catch {
        Write-Host "FAILED" -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor DarkGray
        $script:TestsFailed++
        return $false
    }
}

# Get service URLs from environment or use defaults
$ApiGatewayUrl       = if ($env:API_GATEWAY_URL)       { $env:API_GATEWAY_URL }       else { "http://localhost:9000" }
$AiServiceUrl        = if ($env:AI_SERVICE_URL)        { $env:AI_SERVICE_URL }        else { "http://localhost:9001" }
$TelemetryServiceUrl = if ($env:TELEMETRY_SERVICE_URL) { $env:TELEMETRY_SERVICE_URL } else { "http://localhost:9002" }
$CppHpcUrl           = if ($env:CPP_HPC_URL)           { $env:CPP_HPC_URL }           else { "http://localhost:9003" }
$CsEnterpriseUrl     = if ($env:CSHARP_ENTERPRISE_URL) { $env:CSHARP_ENTERPRISE_URL } else { "http://localhost:9004" }
$JavaBridgeUrl       = if ($env:JAVA_BRIDGE_URL)       { $env:JAVA_BRIDGE_URL }       else { "http://localhost:9005" }
$PhpConnectorUrl     = if ($env:PHP_CONNECTOR_URL)     { $env:PHP_CONNECTOR_URL }     else { "http://localhost:9006" }
$RubyAutomationUrl   = if ($env:RUBY_AUTOMATION_URL)   { $env:RUBY_AUTOMATION_URL }   else { "http://localhost:9007" }

Write-Host "1. Testing Microservices Health" -ForegroundColor Yellow
Write-Host "--------------------------------" -ForegroundColor Yellow

$null = Test-Service -Name "API Gateway"     -Url $ApiGatewayUrl       -Endpoint "/health"
$null = Test-Service -Name "Python AI"       -Url $AiServiceUrl        -Endpoint "/health"
$null = Test-Service -Name "Go Telemetry"    -Url $TelemetryServiceUrl -Endpoint "/health"
$null = Test-Service -Name "C++ HPC"         -Url $CppHpcUrl           -Endpoint "/health"
$null = Test-Service -Name "C# Enterprise"   -Url $CsEnterpriseUrl     -Endpoint "/api/health"
$null = Test-Service -Name "Java Bridge"     -Url $JavaBridgeUrl       -Endpoint "/api/health"
$null = Test-Service -Name "PHP Connector"   -Url $PhpConnectorUrl     -Endpoint "/health"
$null = Test-Service -Name "Ruby Automation" -Url $RubyAutomationUrl   -Endpoint "/health"

Write-Host ""
Write-Host "2. Testing API Endpoints" -ForegroundColor Yellow
Write-Host "------------------------" -ForegroundColor Yellow

Write-Host "Testing Orchestration API... " -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$ApiGatewayUrl/api/orchestration" -TimeoutSec 5
    if ($response.services) {
        Write-Host "PASSED" -ForegroundColor Green
        $script:TestsPassed++
    } else {
        Write-Host "FAILED" -ForegroundColor Red
        $script:TestsFailed++
    }
} catch {
    Write-Host "FAILED" -ForegroundColor Red
    $script:TestsFailed++
}

Write-Host "Testing Subscription Plans... " -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$ApiGatewayUrl/api/plans" -TimeoutSec 5
    if ($response.plans) {
        Write-Host "PASSED" -ForegroundColor Green
        $script:TestsPassed++
    } else {
        Write-Host "FAILED" -ForegroundColor Red
        $script:TestsFailed++
    }
} catch {
    Write-Host "FAILED" -ForegroundColor Red
    $script:TestsFailed++
}

$null = Test-PostEndpoint -Name "AI Prediction" -Url $AiServiceUrl -Endpoint "/predict/scaling" -Body @{
    service_name    = "test"
    metric_type     = "cpu"
    historical_data = @()
} -ExpectedField "prediction"

$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$telemetryItems = @(
    @{
        event_type = "test"
        data       = @{}
        timestamp  = $timestamp
        session_id = "test"
    }
)
$telemetryBody = ConvertTo-Json -InputObject $telemetryItems -Depth 10
Write-Host "Testing Telemetry Ingestion... " -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$TelemetryServiceUrl/telemetry" -Method POST -Body $telemetryBody -ContentType "application/json" -TimeoutSec 5 -ErrorAction Stop
    if ($response.accepted -or ($response | ConvertTo-Json) -match "accepted") {
        Write-Host "PASSED" -ForegroundColor Green
        $script:TestsPassed++
    } else {
        Write-Host "FAILED" -ForegroundColor Red
        $script:TestsFailed++
    }
} catch {
    Write-Host "FAILED" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor DarkGray
    $script:TestsFailed++
}

Write-Host ""
Write-Host "3. Testing Database Connection" -ForegroundColor Yellow
Write-Host "------------------------------" -ForegroundColor Yellow

Write-Host "Testing Neon.tech Connection... " -NoNewline
if ($env:DATABASE_URL) {
    try {
        & psql $env:DATABASE_URL -c "SELECT 1" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "PASSED" -ForegroundColor Green
            $script:TestsPassed++
        } else {
            Write-Host "FAILED" -ForegroundColor Red
            $script:TestsFailed++
        }
    } catch {
        Write-Host "SKIPPED (psql not available)" -ForegroundColor Yellow
    }
} else {
    Write-Host "SKIPPED (No DATABASE_URL)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "4. Testing Frontend Build" -ForegroundColor Yellow
Write-Host "-------------------------" -ForegroundColor Yellow

Write-Host "Testing Vite Build... " -NoNewline
if (Test-Path "frontend/package.json") {
    Push-Location frontend
    try {
        $buildOutput = npm run build 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "PASSED" -ForegroundColor Green
            $script:TestsPassed++
        } else {
            Write-Host "FAILED" -ForegroundColor Red
            Write-Host "  Error: $($buildOutput | Select-Object -Last 5 | Out-String)" -ForegroundColor DarkGray
            $script:TestsFailed++
        }
    } catch {
        Write-Host "FAILED" -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor DarkGray
        $script:TestsFailed++
    } finally {
        Pop-Location
    }
} else {
    Write-Host "SKIPPED (Frontend not found)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Passed: $script:TestsPassed" -ForegroundColor Green
Write-Host "Failed: $script:TestsFailed" -ForegroundColor Red
Write-Host "Total: $($script:TestsPassed + $script:TestsFailed)"
Write-Host ""

if ($script:TestsFailed -eq 0) {
    Write-Host "All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Some tests failed. Please check the output above." -ForegroundColor Red
    exit 1
}
