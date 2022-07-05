Because Ev2 deploys ARM templates at the resource group scope, it will not be able to deploy resources at the tenant scope. Hence adding a role assignment at the tenant scope is not supported. Therefore we must manually create AAD apps (these are the only things as of 05.28.20 that we are concerned with at the tenant scope).

As of 05.29.2020, we will not be able to see Ev2 deployment status of airgapped releases from the client side. Before the lift and shift, you may be able to use XTS tool to observe the deployment status. Builds will not get replicated to the high side immedietely and they have an SLA of 12 hours.

Instructions to see deployment status using XTS
https://microsoft.sharepoint.com/teams/LX/unrestricted/SitePages/Debug%20Boxes%20and%20Buildshare.aspx?CT=1590774166269&OR=OWA-NT&CID=0a67bf77-7504-357f-9c94-5d0014da8b0d
https://msazure.visualstudio.com/AzureWiki/_wiki/wikis/AzureWiki.wiki/265/XTS
https://dev.azure.com/msazure/AzureWiki/_wiki/wikis/AzureWiki.wiki/587/AGRM-Customer-FAQ


# Pre Requisites

1. Create keyvault for use during Ev2 deployment
2. Give Ev2 access to the target subscription and deployment keyvault
3. Create AAD app for azure CLI use, Kusto access, EasyAuth [^1]
4. Store any AAD secrets into deployment keyvault
5. Create OneCert/DigiCert signed certificate via KeyVault for observer-to-geomaster, diagnostic-service-to-geomaster, diagnostics-to-mdm

[^1]: AAD apps cannot be created automatically via Ev2 as Ev2 deploys resources only at a resource group level and AAD app APIs operate at a tenant level.

## Create AAD Apps
```
az ad app create --display-name DiagnosticObserver --identifier-uri "https://diagobserver-usnateast.appservice.eaglex.ic.gov"
az ad app create --display-name DiagnosticsSub --identifier-uri "https://applensev2diagnosticssub"
az ad app create --display-name ApplensDiagnosticsUsNat --identifier-uri "https://applensdiagnosticsusnat"
az ad app credential reset --id https://applensdiagnosticsusnat --append --credential-description "Kusto secret"
az ad app credential reset --id https://applensdiagnosticsusnat --append --credential-description "Observer secret"
az keyvault secret set --vault-name appservicediagnosticskv --name KustoClientSecret --description "Kusto access client secret" --value <KustoClientSecret>
```

## Give Ev2 access to the subscription
Give Contributor access to the subscription.

```
New-AzRoleAssignment -ObjectId 402aadec-e3d1-4d30-a348-677dacc19548 -RoleDefinitionName "Contributor" -Scope "/subscriptions/237836ad-af13-4e7f-9289-b5f0d3104209"
New-AzRoleAssignment -ObjectId 402aadec-e3d1-4d30-a348-677dacc19548 -RoleDefinitionName "User Access Administrator" -Scope "/subscriptions/237836ad-af13-4e7f-9289-b5f0d3104209"
```

## Deployment Keyvault

During an Ev2 deployment, we execute shell scripts for some initial setup. The shell scripts use a service principal to execute all authorized actions. Every cloud environment needs to have a keyvault that holds the client secret for the service principal. Ev2 uses a compound identity to access the keyvault during deployment time. Learn more https://ev2docs.azure.net/features/security/secrets/permissions.html

Create compound identity between onebranch service principal and Ev2 Prod Infra service principal
``` 
$principal = Get-AzADServicePrincipal -ObjectId 402aadec-e3d1-4d30-a348-677dacc19548
Set-AzKeyVaultAccessPolicy -VaultName 'AppServiceDiagnosticsKV' -ObjectId $principal.Id -ApplicationId 5b306cba-9c71-49db-96c3-d17ca2379c4d -PermissionsToCertificates get -PermissionsToSecrets get
```

## Create Service Principal for Azure CLI and Powershell scripts

```
az ad app create 
```
UsNat service principal name: DiagnosticsSub d6c8f27b-27f5-469f-8e4c-bc14681454c3
Test  service principal name: 1160435e-725a-479f-bcbb-f533d011862e

```
    az login --service-principal -u $env:ServicePrincipalApplicationId -p $env:ServicePrincipalClientSecret
    az account set --subscription $env:SubscriptionId   
``` 

