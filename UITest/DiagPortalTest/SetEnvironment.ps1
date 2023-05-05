#Store TestPassword and TestEnvironment into environment variables
#Once move to OneBranch and using YAML, we can remove this script for writting config into env
Param(
   [string]$diagPortalTestPasswordValue,
   [string]$diagPortalTestEnvValue
)
Write-Host "Assigning variables into environment"

[Environment]::SetEnvironmentVariable("DiagPortalTestPassword", $diagPortalTestPasswordValue,"User")
[Environment]::SetEnvironmentVariable("DiagPortalTestEnvironment", $diagPortalTestEnvValue,"User")

Write-Host "Assigned variables into environment"