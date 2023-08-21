param(
    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string]$SubscriptionId = $env:SubscriptionId,

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string]$StorageAccountName = "diagnoseandsolve"
)

Write-Host "Logging in to Azure..."

if ($null -ne $env:USERDOMAIN -and $env:USERDOMAIN -eq "REDMOND"){
    $_ = az account get-access-token
    if (1 -eq $LASTEXITCODE){
        Write-Host "Connecting your Azure account..."
        az login
    }
}
else {
    az login --identity
}

az account set --subscription $SubscriptionId


Write-Host "Unzipping files..."
Expand-Archive -Path "shell_deps/AppServiceDiagnostics.zip" -DestinationPath "AppServiceDiagnostics" -Force

$connectionString = (az storage account show-connection-string --name $StorageAccountName --query connectionString).Trim('"')

Write-Host "Uploading files to CDN..."
az storage blob upload-batch --destination "bundles" --account-name $StorageAccountName  --source "AppServiceDiagnostics/wwwroot" --connection-string $connectionString --overwrite

Write-Host "Deleting old files from CDN..."
az storage blob delete-batch -s bundles --account-name $StorageAccountName --connection-string $connectionString --if-unmodified-since ((Get-Date).ToUniversalTime().AddDays(-45).ToString("s")+"Z")

Write-Host "Done!"