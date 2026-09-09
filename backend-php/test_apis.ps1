$baseUrl = "http://localhost:8000"

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [string]$Body = ""
    )
    Write-Host "Testing $Name ($Method $Url)..."
    
    try {
        if ($Method -eq "GET") {
            $response = Invoke-WebRequest -Uri "$baseUrl$Url" -Method GET -UseBasicParsing -ErrorAction Stop
        } elseif ($Method -eq "POST") {
            $response = Invoke-WebRequest -Uri "$baseUrl$Url" -Method POST -Body $Body -ContentType "application/json" -UseBasicParsing -ErrorAction Stop
        }
        
        Write-Host "  -> SUCCESS ($($response.StatusCode))"
    } catch {
        Write-Host "  -> FAILED ($($_.Exception.Response.StatusCode.value__))"
        Write-Host "     Message: $($_.Exception.Message)"
    }
}

Test-Endpoint -Name "Projects Public" -Url "/api/projects"
Test-Endpoint -Name "Notices Public" -Url "/api/notices"
Test-Endpoint -Name "Blog Public" -Url "/api/blog"
Test-Endpoint -Name "Gallery Public" -Url "/api/gallery"
Test-Endpoint -Name "Theme Public" -Url "/api/theme"
Test-Endpoint -Name "Stats Public" -Url "/api/stats"
Test-Endpoint -Name "Stats Transparency" -Url "/api/stats/transparency"

$volunteerBody = @{
    name = "Test User"
    email = "test@example.com"
    phone = "1234567890"
    type = "volunteer"
    availability = "weekends"
} | ConvertTo-Json

Test-Endpoint -Name "Volunteer Submit" -Url "/api/volunteers" -Method POST -Body $volunteerBody

# Razorpay Order
$orderBody = @{
    amount = 100
    donorName = "Test"
} | ConvertTo-Json
Test-Endpoint -Name "Razorpay Order" -Url "/api/razorpay/order" -Method POST -Body $orderBody

# Protected APIs (should return 401)
Test-Endpoint -Name "Admin Users (Expected 401)" -Url "/api/users"
Test-Endpoint -Name "Admin Blog (Expected 401)" -Url "/api/blog/admin"
