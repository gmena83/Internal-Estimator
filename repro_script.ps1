# repro_script.ps1 - Reproduces the Ghost Bug
$Port = 5000
$BaseUrl = "http://localhost:$Port/api"

Write-Host "1. Creating dummy project..." -ForegroundColor Cyan
$ProjectBody = @{
    title = "Forensic Repro Project"
    rawInput = "Reproduction of ghost bug."
} | ConvertTo-Json

try {
    $ProjectResponse = Invoke-RestMethod -Uri "$BaseUrl/projects" -Method Post -Body $ProjectBody -ContentType "application/json"
    $ProjectId = $ProjectResponse.id
    Write-Host "Created project: $ProjectId" -ForegroundColor Green
} catch {
    Write-Error "Failed to create project. Error: $_"
    exit
}

Write-Host "2. Triggering /vibecode-guide..." -ForegroundColor Cyan
try {
    $Response = Invoke-WebRequest -Uri "$BaseUrl/projects/$ProjectId/vibecode-guide" -Method Post -ContentType "application/json" -Body "{}"
    Write-Host "Response Status: $($Response.StatusCode)" -ForegroundColor Green
    Write-Host "Response Content: $($Response.Content)"
} catch {
    Write-Host "Response Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Response Content: $([System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream()).ReadToEnd())"
}

Write-Host "`nReproduction attempt completed. Check server logs for [Forensic] output." -ForegroundColor Yellow
