# Azure App Services Diagnostics Portal And Applens

This is the repository for Azure App Service diagnostics experience.

[![Build Status](https://dev.azure.com/app-service-diagnostics-portal/app-service-diagnostics-portal/_apis/build/status/Angular%20PR%20Build?branchName=master)](https://dev.azure.com/app-service-diagnostics-portal/app-service-diagnostics-portal/_build/latest?definitionId=1&branchName=master)

## Steps to upgrade to Angular 8 and run projects locally:

- Install [Node 14.*](https://nodejs.org/en/download/)
   - Download the .msi file from https://nodejs.org/en/download/ and install it on your machine
- Install Angular-CLI 8
   - `npm install -g @angular/cli@8`
- Build the diagnostic-data lib, Applens and Diagnostics Portal:
  - `npm run build`
- Run the project locally:
   - To run Applens: `npm run applens`
   - To run Diagnostics Portal: <a class="anchor" aria-hidden="true" href="#app-service-diagnostics-portal">App Service Diagnostics Portal</a>
  
## First time set up prerequisites
- [Node 12.*](https://nodejs.org/en/download/)
- Node Package Manager (npm)
- Typescript
  `npm install -g typescript`
- Angular-CLI
  `npm install -g @angular/cli@8`

## Project Structure

```
root
│
└───AngularApp
│   │   This is the home of the angular code for App Service Diagnostics Portal and Applens
|   |
|   |   angular.json - This is the angular-cli configruation file
│   │
│   └───projects
|       |   This is the list of projects registered in angular.json
|       |
│       └───app-service-diagnostics
|       |   |    This is the code for the external App Service Diagnostics Portal
|       |
|       └───applens
|       |   |    This is the code for Applens
|       |
|       └───diagnostic-data
|           |    This is a library containing the common component and services
|           |    that are used to generate detector views in ASD/Applens.
|           |    Any component or feature that you want to use both internally
|           |    or externally should be put here
│
└───Backend
│   │   ASP.Net Core Backend for App Service Diagnostics Portal
|
└───ApplensBackend
│   │   ASP.Net Core Backend for Applens
```

## Getting Started

- Clone repo `git clone https://github.com/Azure/Azure-AppServices-Diagnostics-Portal.git`
- Choose one of the two options below:
  - Setup local machine: Install required dependencies locally by navigating to the angular root folder `AngularApp` and runing `npm install` (This will install all the required packages.) OR
  - Docker container: Build and run a docker container that has all necessary dependencies. 
    - Install and run the docker desktop client.
    - Run AngularApp/buildimage.sh (or buildimage.bat on Windows) once to build an image locally.
    - Note : To build the image you may need to change installNode14Repo.sh from CRLF to LF in order to run the script in docker
    - Create a container from the image created above by running AngularApp/startcontainer.sh (or startcontainer.bat on Windows) to build a container and open a terminal session on it.  Alternately you can use the docker desktop UI to stop/start and open a terminal to the container.
    - From within the container, cd to the `AngularApp` folder and restore packages via `npm install` to install npm packages.
    - Continue to the next section.  Note: if you are only developing the diagnostic portal and not the backend, you can skip steps 2, 3 and 4.  In step 6, if working on Windows, run `npm run ssl-local-poll` as angular running in the container is unable to monitor the filesystem for changes (auto-recompile on file change)

## App Service Diagnostics Portal

### Set Up a Local Development Environment

1. Create a Local Environment Settings file
   - Copy `AngularApp\projects\app-service-diagnostics\src\environments\environment.ts` to create `AngularApp\projects\app-service-diagnostics\src\environments\environment.local.ts`
   - Set key `"useApplensBackend"` to `true`
2. Get Resource Auth Token from ARM Client:
   - Install <a href="https://github.com/projectkudu/ARMClient">ArmClient</a>: `choco install armclient`
     - Ensure source `chocolatey` is enabled: `choco source enable -n=chocolatey`
   - Log in to ArmClient: `ARMClient.exe login`
   - Run `ARMClient.exe token {SubscriptionID}` with your Subscription ID, which will copy the Auth Token to the clipboard
3. Add Auth Token and ResourceID to Local Environment Settings:
   - Paste the ArmClient token from the above step into `authServiceToken` in `environment.local.ts`
   - Copy the ID of a Resource you want to test, and paste it into `authServiceResourceId` in `environment.local.ts`
4. Skip Authorization in ApplensBackend
   - Open `appsettings.Development.json`
   - Set `"ServerMode": "internal"`
5. Create a self-signed certificate for Applens
   - Navigate to `AngularApp\ssl`
   - Follow the instructions in `AngularApp\ssl\README.md` to create a self-signed certficate and install the certificate for your local machine in Trusted Root
6. Run the SSL server
   - Run `npm run ssl-local`
   - Navigate to `https://localhost:3000` to confirm the server is up


### Testing Local Changes in the Azure Portal
  - Navigate to the Auzure portal with website extension specified as local: [Local Portal Test URL](https://ms.portal.azure.com/?websitesextension_ext=asd.env%3Dlocal)
   - This will load the "Diagnose and solve problems" iframe from `https://localhost:3000`. (Must be running in *ssl* mode).
   - Any changes made to the locally hosted project will be automatically refreshed in the Portal

### Testing Local Changes in the Portal

- In order to test your local changes in the portal, you can use the following links:
  - [Local](https://ms.portal.azure.com/?websitesextension_ext=asd.env%3Dlocal): This will load the iframe from `https://localhost:3000`. Must be running in *ssl* mode (`npm run ssl`).
  - [Staging](https://ms.portal.azure.com/?websitesextension_ext=asd.env%3Dstaging): This will load the iframe from `https://supportcenter-bay-staging.azurewebsites.net`

### Back End

- Right now the back end is optional as it is not required for functionality of the angular project.
- You will need appropriate secrets to be added to appsettings.Development.json.
- Open the `Backend` project in Visual Studio 2017 and run it in `IIS Express` mode.

### Production Build

- The production build commands for the angular projects are as follows:
  - `npm run build-applens` - Build Applens. Build output is placed in `ApplensBackend/wwwroot`.
  - `npm run build-asd` - Build App Service Diagnostic Portal. Build output is placed in `Backend/wwwroot`.
  - `npm run build` - Build both App Service Diagnostic Portal and Applens.
- If you have the appropriate Publishing Profiles, you can deploy these changes to the staging slots.
- TODO: Azure Dev Ops Integration
