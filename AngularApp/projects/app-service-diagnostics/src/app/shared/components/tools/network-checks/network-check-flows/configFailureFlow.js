import {
  getArmData,
  getWebAppVnetInfo,
  getSubnet,
  addSubnetSelectionDropDownView
} from './flowMisc.js';
import {
  DropdownStepView,
  InfoStepView,
  StepFlow,
  StepFlowManager,
  CheckStepView,
  StepViewContainer,
  InputStepView,
  ButtonStepView,
  PromiseCompletionSource,
  TelemetryService
} from 'diagnostic-data';
import { ConfigFailureRecommendations } from './configFailureRecommendations.js';

export var configFailureFlow = {
  title: 'Configuration issues',
  async func(siteInfo, diagProvider, flowMgr) {
    var vnets = null,
      subnets = null,
      subscriptions = null;

    var promise = checkAspVnetSupport(siteInfo, diagProvider, flowMgr);
    flowMgr.addViews(
      promise.then((r) => r.views),
      'Checking App Service Plan'
    );
    var isContinue = await promise.then((r) => r.isContinue);
    if (!isContinue) {
      return;
    }

    if (
      siteInfo.kind.includes('functionapp') &&
      siteInfo.sku.toLowerCase() == 'dynamic'
    ) {
      flowMgr.addView(
        new InfoStepView({
          title:
            'VNet integration is not supported for Consumption Plan Function Apps.',
          infoType: 1,
          markdown:
            'For more information please review <a href="https://docs.microsoft.com/en-us/azure/app-service/web-sites-integrate-with-vnet" target="_blank">Integrate your app with an Azure virtual network</a>.'
        })
      );
      return;
    }

    var getAspSitesPromise = getAspSites(
      diagProvider,
      siteInfo['serverFarmId']
    );
    flowMgr.addViews(
      getAspSitesPromise.then((d) => d.views),
      'Fetching App Service Plan data...'
    );
    var aspSites = (await getAspSitesPromise).aspSites;
    if (aspSites == null) {
      return;
    }

    addSubnetSelectionDropDownView(
      siteInfo,
      diagProvider,
      flowMgr,
      'Please select the subnet you want to integrate your app to',
      async (subnet) => {
        var promise = checkSubnetAvailabilityAsync(
          siteInfo,
          diagProvider,
          subnet,
          aspSites
        );
        flowMgr.addViews(promise, 'Checking subnet...');
      }
    );
  }
};

async function getAspSites(diagProvider, serverFarmId) {
  var views = [];
  var aspSitesObj = await diagProvider.getArmResourceAsync(
    serverFarmId + '/sites'
  );

  if (aspSitesObj.status == 401) {
    views.push(
      new CheckStepView({
        title: `Diagnostic is not available because you have no permission to access App Service Plan`,
        level: 3,
        subChecks: [{ title: serverFarmId, level: 3 }]
      })
    );
    views.push(
      new InfoStepView({
        title: 'Recommendation',
        infoType: 1,
        markdown: `Please grant your account access to **${serverFarmId}** or switch an account with access.`
      })
    );
    return { views, aspSites: null };
  } else {
    var aspSites = aspSitesObj.hasOwnProperty('value')
      ? aspSitesObj['value']
      : aspSitesObj;
    return { views, aspSites };
  }
}

async function checkSubnetAvailabilityAsync(
  siteInfo,
  diagProvider,
  subnetData,
  aspSites
) {
  if (subnetData == null) {
    throw new Error('subnetData is null');
  }
  var isSubnetAvailable = true;
  var msg;
  var successMsg = `<li>For setting up VNet integration, please see [Integrate your app with an Azure virtual network](https://docs.microsoft.com/en-us/azure/app-service/web-sites-integrate-with-vnet).</li>`;

  //Get Site data
  var siteArmId = siteInfo['id'];
  var thisSite = siteArmId.split('/sites/')[1];

  //Get Vnet data
  var selectedSubnet = subnetData.id;
  var vnetResourceId = selectedSubnet.split('/subnets/')[0];
  var selectedVnetName = vnetResourceId.split('/virtualNetworks/')[1];
  var selectedSubnetName = selectedSubnet.split('/subnets/')[1];

  //Get Serverfarm data
  var serverFarmId = siteInfo['serverFarmId'];
  var serverFarmName = serverFarmId.split('/serverfarms/')[1];

  //First check to see if the current ASP already is integrated to a subnet and if that subnet is missing SAL
  //Get All apps from the server farm(ASP)

  var views = [];
  if (aspSites != null) {
    for (var idx = 0; idx < aspSites.length; ++idx) {
      if (aspSites[idx] && aspSites[idx]['id'] == null) {
        continue;
      }
      var siteResourceUri = aspSites[idx]['id'];
      var siteVnetInfo = await getWebAppVnetInfo(siteResourceUri, diagProvider);
      var subnetName = '-';
      var vnetName = '-';

      if (siteVnetInfo && siteVnetInfo['properties'] != null) {
        var subnetResourceId = siteVnetInfo['properties']['subnetResourceId'];
        if (subnetResourceId != null) {
          if (subnetResourceId.includes('/subnets/')) {
            subnetName = subnetResourceId.split('/subnets/')[1];
            vnetName = subnetResourceId
              .split('/subnets/')[0]
              .split('/virtualNetworks/')[1];

            if (subnetResourceId == selectedSubnet) {
              let subnetData = await getSubnet(diagProvider, subnetResourceId);

              if (
                subnetData &&
                subnetData['properties'] &&
                subnetData['properties']['serviceAssociationLinks'] != null
              ) {
                var sal = subnetData['properties']['serviceAssociationLinks'];
                var linkedAsp =
                  (sal[0] &&
                    sal[0]['properties'] &&
                    sal[0]['properties']['link']) ||
                  '';
                if (siteResourceUri.toLowerCase() === siteArmId.toLowerCase()) {
                  successMsg += `<li>App <b>${thisSite}</b> is already integrated to subnet <b>${subnetName}</b>. If you are facing connectivity issues, please select <b>I'm unable to connect to a resource, such as SQL or Redis or on-prem, in my Virtual Network</b> option.`;
                } else {
                  if (linkedAsp.toLowerCase() === serverFarmId.toLowerCase()) {
                    successMsg += `<li>App <b>${thisSite}</b> is hosted on App Service Plan <b>${serverFarmName}</b> that is already integrated to subnet <b>${subnetName}</b>. You can integrate your app to the same subnet.`;
                  } else {
                    isSubnetAvailable = false;
                    msg = `This App is hosted on App Service Plan <b>${serverFarmName}</b> that is integrated to subnet <b>${subnetName}</b>, but owner of this subnet is <b>${
                      linkedAsp.split('/serverfarms/')[1]
                    }</b>. Please disconnect this subnet <b>${subnetName}</b> from Apps in <b>${
                      linkedAsp.split('/serverfarms/')[1]
                    }</b> or else create a new subnet and connect Apps in <b>${serverFarmName}</b> to it.`;

                    views.push(
                      new InfoStepView({
                        infoType: 1,
                        title:
                          'The App Service Plan is already using Regional VNet integration',
                        markdown: msg
                      })
                    );
                  }
                }
              } else {
                isSubnetAvailable = false;
                msg = `This App is hosted on App Service Plan <b>${serverFarmName}</b> that is integrated to subnet <b>${subnetName}</b>, but Service Association Link is not initialized on this subnet. For Regional VNet integration to work on this subnet, please disconnect all the apps from this subnet and reconnect.`;

                views.push(
                  new InfoStepView({
                    infoType: 1,
                    title: `Error detected in the VNet integration`,
                    markdown: msg
                  })
                );
              }
            } else {
              isSubnetAvailable = false;
              msg = `This App is hosted on App Service Plan <b>${serverFarmName}</b> that is already integrated to subnet <b>${subnetName}</b> located in VNet <b>${vnetName}</b>. One App Service Plan could be connected to one subnet only and hence you could not integrate this App to subnet <b>${selectedSubnetName}</b> located in VNet <b>${selectedVnetName}</b>. <li>You may either integrate the App to subnet <b>${subnetName}</b> located in VNet <b>${vnetName}</b>. <li>Or, move the App to another App Service Plan.`;

              views.push(
                new InfoStepView({
                  infoType: 1,
                  title:
                    'The App Service Plan is already using Regional VNet integration',
                  markdown: msg
                })
              );
            }
          }
        }
      }
    }
  }

  //Second check is for comparing app region with subnet region
  var vnetData = await diagProvider.getArmResourceAsync(
    vnetResourceId,
    '2020-11-01'
  );
  var siteRegion = siteInfo['location'].replaceAll(' ', '').toLowerCase();
  var vnetRegion = vnetData['location'];

  if (vnetRegion != siteRegion) {
    isSubnetAvailable = false;

    views.push(
      new InfoStepView({
        infoType: 1,
        title: 'Incompatible subnet region',
        markdown: `Subnet is located in <b>${vnetRegion}</b> region but the app is in <b>${siteRegion}</b> region. This is not valid for Regional VNet integration. You must choose a subnet in <b>${siteRegion}</b> region.`
      })
    );
  } else {
    //Third check is for subnet size
    var aspData = await getArmData(serverFarmId, diagProvider);
    var subnetAddressPrefix =
      (subnetData['properties'] && subnetData['properties']['addressPrefix']) ||
      '';
    var splitted = subnetAddressPrefix.split('/');
    var subnetSize = splitted.length > 0 ? splitted[1] : -1;
    var aspSku = aspData['sku'] && aspData['sku']['name'];

    if (aspSku != null) {
      if ((subnetSize > 26) & (aspSku[0] === 'P')) {
        successMsg += `<li>Subnet is not using the recommended address prefix of /26. Please increase size of the subnet.<br/>`;
        successMsg += `<br/><table><tr><th>Subnet Size</th><th>App Service Plan SKU</th><th>Recommended Subnet Size</th><th>Available Addresses</th></tr>`;
        successMsg += `<tr><td>${subnetSize}</td><td>${aspSku}</td><td><b>/26</b></td><td>64-5 = <b>59</b> Addresses</td></tr>`;
        successMsg += `<tr><td colspan='4'><i>Note: Azure reserves 5 IP addresses within each subnet.</i></td></tr></table>`;
        successMsg += `<u>Steps to increase the subnet size:</u>`;
        successMsg += `<li>In this App Service Plan, disconnect all the Web Apps that are currently using Regional VNet integration.</li>`;
        successMsg += `<li>Increase the subnet size as per the recommendations.</li>`;
        successMsg += `<li>Reconnect the webapps to the same subnet.</li>`;
      } else if (subnetSize > 27) {
        successMsg += `<li>Subnet is not using the recommended address prefix of /27. Please increase size of the subnet.<br/>`;
        successMsg += `<br/><table><tr><th>Subnet Size</th><th>App Service Plan SKU</th><th>Recommended Subnet Size</th><th>Available Addresses</th></tr>`;
        successMsg += `<tr><td>${subnetSize}</td><td>${aspSku}</td><td><b>/27</b></td><td>32-5 = <b>27</b> Addresses</td></tr>`;
        successMsg += `<tr><td colspan='4'><i>Note: Azure reserves 5 IP addresses within each subnet.</i></td></tr></table>`;
        successMsg += `<u>Steps to increase the subnet size:</u>`;
        successMsg += `<li>In this App Service Plan, disconnect all the Web Apps that are currently using Regional VNet integration.</li>`;
        successMsg += `<li>Increase the subnet size as per the recommendations.</li>`;
        successMsg += `<li>Reconnect the webapps to the same subnet.</li>`;
      }
    }

    //Fourth check if subnet is unused
    if (
      subnetData['properties'] &&
      subnetData['properties']['ipConfigurations'] &&
      subnetData['properties']['ipConfigurations'][0] != null
    ) {
      isSubnetAvailable = false;
      var splitted = (
        subnetData['properties']['ipConfigurations'][0]['id'] || ''
      ).split('/resourceGroups/');
      if (splitted.length > 0) {
        var resourceId = `/resourceGroups/${splitted[1]}`;
        var resourceIdLength = resourceId.toString().length;

        views.push(
          new InfoStepView({
            infoType: 1,
            title: 'Subnet is already in use',
            markdown: `Subnet is already in use by resource <b>${resourceId.substring(
              0,
              53
            )}<br/>${resourceId.substring(
              53,
              resourceIdLength - 1
            )}</b>. <br/><br/>Please select an unused subnet.`
          })
        );
      }
    }

    //Fifth check if subnet is owned by server farm where this app is hosted
    var subnetProperties = subnetData['properties'];

    if (subnetProperties['serviceAssociationLinks'] != null) {
      var sal = subnetProperties['serviceAssociationLinks'];
      var linkedAsp =
        (sal[0] && sal[0]['properties'] && sal[0]['properties']['link']) || '';
      if (linkedAsp.toLowerCase() != serverFarmId.toLowerCase()) {
        isSubnetAvailable = false;
        var splitted = linkedAsp.split('/serverfarms/');
        if (splitted.length > 0) {
          views.push(
            new InfoStepView({
              infoType: 1,
              title: 'Subnet Owner',
              markdown: `Subnet <b>${selectedSubnetName}</b> is owned by App Service Plan <b>${
                splitted[1]
              }</b> and cannot be used for Regional VNet integration by App Service Plan <b>${
                serverFarmId.split('/serverfarms/')[1]
              }</b> which hosts the app <b>${thisSite}</b>.`
            })
          );
        }
      }
    }
  }

  if (isSubnetAvailable) {
    views.push(
      new CheckStepView({
        title: `Subnet '${selectedSubnetName}' is valid for integration with App '${thisSite}'`,
        level: 0
      })
    );

    successMsg += `<br/>`;
    views.push(
      new InfoStepView({
        infoType: 1,
        title: 'Recommendations',
        markdown: successMsg
      })
    );
  } else {
    views = [
      new CheckStepView({
        title: `Subnet '${selectedSubnetName}' is not valid for integration with App '${thisSite}'`,
        level: 2
      })
    ].concat(views);
  }
  return views;
}

async function checkAspVnetSupport(siteInfo, diagProvider, flowMgr) {
  var rec = new ConfigFailureRecommendations();
  var sku = siteInfo.sku;
  var views = [];
  var isContinue = true;
  if (sku == 'Standard') {
    var vnet = await getWebAppVnetInfo(siteInfo.id, diagProvider);
    if (vnet.status == 200) {
      if (!vnet.properties.swiftSupported) {
        isContinue = false;
        views.push(
          new CheckStepView({
            title: `Your App Service Plan does not support VNet integration`,
            level: 2
          })
        );
        var splited = siteInfo.serverFarmId.split('/');
        var aspName = splited[splited.length - 1];
        views.push(rec.VnetNotSupported.Get(aspName, sku));
      }
    } else {
      isContinue = false;
      views.push(
        new CheckStepView({
          title: `Failed to read app VNet configuration, please refresh the page and retry`,
          level: 2
        })
      );
    }
  }

  return { views, isContinue };
}
