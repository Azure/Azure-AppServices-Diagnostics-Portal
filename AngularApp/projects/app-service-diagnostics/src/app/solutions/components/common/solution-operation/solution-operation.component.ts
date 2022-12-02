import {
  Component,
  Input,
  Output,
  EventEmitter,
  SimpleChanges
} from '@angular/core';
import { SolutionBaseComponent } from '../solution-base/solution-base.component';
import { SolutionData } from '../../../../shared/models/solution';
import { ServerFarmDataService } from '../../../../shared/services/server-farm-data.service';
import { ServerFarm } from '../../../../shared/models/server-farm';
import { ActionStatus } from '../../../../shared/models/enumerations';

@Component({
  selector: 'solution-operation',
  templateUrl: 'solution-operation.component.html',
  styleUrls: ['../../../styles/solutions.scss']
})
export class SolutionOperationComponent {
  @Input() failureMessage: string =
    'Operation Failed. Please try again or try a different solution.';
  @Input() successMessage: string = 'Operation Successful.';

  // TODO: There should be error data flowing from the services instead of just boolean

  @Input() operationStatus: ActionStatus = ActionStatus.NotStarted;

  // Need to make local copy of enum to be used in the template
  actionStatus = ActionStatus;
}
