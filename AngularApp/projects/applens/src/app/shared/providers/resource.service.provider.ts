import { StartupService } from '../services/startup.service';
import { SiteService } from '../services/site.service';
import { ContainerAppService } from '../services/containerapp.service';
import { AseService } from '../services/ase.service';
import { ResourceService } from '../services/resource.service';
import { ObserverService } from '../services/observer.service';
import { StaticWebAppService } from '../services/staticwebapp.service';
import { StampService } from '../services/stamp.service';
import { DiagnosticApiService } from '../services/diagnostic-api.service';
import { DetectorControlService } from 'diagnostic-data';

export let ResourceServiceFactory = (
  startupService: StartupService,
  observerService: ObserverService,
  diagnosticApiService: DiagnosticApiService,
  detectorControlService: DetectorControlService
) => {
  let serviceInputs = startupService.getInputs();
  let service: ResourceService;

  //TODO: Is there a way to remove this switch
  // I have a string of the class name and I was to create a class,
  // would also have to worry about differing parameters also though
  switch (serviceInputs.resourceType) {
    case 'Microsoft.Web/hostingEnvironments':
      service = new AseService(serviceInputs, observerService);
      break;
    case 'Microsoft.Web/sites':
      service = new SiteService(serviceInputs, observerService);
      break;
    case 'Microsoft.Web/containerApps':
    case 'Microsoft.App/containerApps':
      service = new ContainerAppService(serviceInputs, observerService);
      break;
    case 'Microsoft.Web/staticSites':
      service = new StaticWebAppService(serviceInputs, observerService);
      break;
    case 'stamps':
      service = new StampService(
        serviceInputs,
        observerService,
        diagnosticApiService,
        detectorControlService
      );
      break;
    default:
      service = new ResourceService(serviceInputs);
      break;
  }

  //TODO: This did not work when called from base constructor
  service.startInitializationObservable();

  return service;
};
