import { Injectable } from '@angular/core';
import { SolutionHolder } from '../models/solution-holder';
import { SiteRestartComponent } from '../../solutions/components/specific-solutions/site-restart-solution/site-restart-solution.component'//solutions/components/solutions/site-restart/site-restart.component';
import { ScaleUpSolutionComponent } from '../../solutions/components/specific-solutions/scale-up-solution/scale-up-solution.component';
import { ISolution, SolutionData } from '../models/solution';
import { LoggingService } from '../services/logging/logging.service';
import { SolutionTypeTag } from '../models/solution-type-tag';
import { ProfilingComponent } from '../../solutions/components/specific-solutions/profiling-solution/profiling-solution.component';

@Injectable()
export class SolutionFactoryService {

    constructor(private _logger: LoggingService) {

    }

    getSolutionById(solution: ISolution): SolutionHolder {

        switch (solution.id) {
            case 1:
                return new SolutionHolder(SiteRestartComponent, <SolutionData>{ title: "Restart App", tags: [SolutionTypeTag.Mitigation], solution: solution });
            // case 2:
            //     return new InlineSolutions.RestartSiteSolution(rank, parameters, _logger, siteService);
            case 3:
                return new SolutionHolder(ScaleUpSolutionComponent, <SolutionData>{ title: "Scale Up App Service Plan", tags: [SolutionTypeTag.Mitigation], solution: solution });
            // case 4:
            //     return new BladeSolutions.OpenScaleOutBlade(rank, parameters, _logger, portalActionService);
            // case 5: // TODO: Reboot Worker;
            // case 6:
            //     // TODO: Subscribe to incidents.
            //     // For now, log missing solution.
            //     _logger.LogMissingSolution(id);
            //     return null;
            // case 7:
            //     return new OtherSolutions.EnableLocalCache(rank, _logger);
            // case 8:
            //     return new BladeSolutions.OpenApplicationEventLogs(rank, parameters, _logger, portalActionService);
            // case 9:
            //     return new OtherSolutions.EnableAutoHeal(rank, _logger);
            // case 10: // TODO: Scale out ASE
            // case 11:
            //     // TODO : Scale Up ASE
            //     _logger.LogMissingSolution(id);
            //     return null;
            // case 12:
            //     return new OtherSolutions.SplitAppsIntoDifferentServerFarms(rank, _logger);
            // case 13:
            //     return new OtherSolutions.CheckWebConfig(rank, parameters, _logger, siteService);
            // case 14:
            //     return new OtherSolutions.CheckAppServiceQuotas(rank, _logger);
            // case 15:
            //     return new OtherSolutions.EnableStdOutRedirection(rank, parameters, _logger, siteService);
            // case 16:
            //     return new OtherSolutions.CheckStdOutLog(rank, parameters, _logger);
            // case 17:
            //     return new OtherSolutions.RevertChanges(rank, _logger);
            // case 18:
            //     return new OtherSolutions.FixStdOutLogPath(rank, parameters, _logger, siteService);
            // case 100:
            //     return new BladeSolutions.RunDaas(rank, parameters, _logger, portalActionService);
            // case 101:
            //     return new BladeSolutions.OpenAppInsights(rank, parameters, _logger, portalActionService);
            // case 102:
            //     return new OtherSolutions.CheckAutoHeal(rank, _logger);
            // case 103:
            //     return new OtherSolutions.GetDumpOfProcess(rank, _logger);
             case 104:
             return new SolutionHolder(ProfilingComponent, <SolutionData>{ title: "Remote Profile WebApp", tags: [SolutionTypeTag.Mitigation], solution: solution });
            // case 105:
            //     return new OtherSolutions.UpgradeDatabase(rank, _logger);
            // case 106:
            //     return new OtherSolutions.ContactDatabaseProvider(rank, _logger);
            // case 107:
            //     return new OtherSolutions.IncreasePHPTimeOUt(rank, parameters, _logger, siteService);  
            // case 109:
            //     return new OtherSolutions.SetPHPMemoryLimit(rank, parameters, _logger, siteService);    
            // case 110:
            //     return new OtherSolutions.EnablePHPLogging(rank, parameters, _logger, siteService);
            // case 111:
            //     return new OtherSolutions.CheckPHPLogs(rank, parameters, _logger, siteService);
            default:
                this._logger.LogMissingSolution(solution.id);
                return null;
        }

    }
}