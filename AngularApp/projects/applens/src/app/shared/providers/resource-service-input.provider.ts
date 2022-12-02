import { StartupService } from '../services/startup.service';

export let ResourceServiceFactory = (startupService: StartupService) => {
  return startupService.getInputs();
};
