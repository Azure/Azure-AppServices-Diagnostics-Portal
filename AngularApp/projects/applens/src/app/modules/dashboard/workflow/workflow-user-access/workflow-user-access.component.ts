import { Component, OnInit } from '@angular/core';
import { ApplensDiagnosticService } from '../../services/applens-diagnostic.service';

@Component({
  selector: 'workflow-user-access',
  templateUrl: './workflow-user-access.component.html',
  styleUrls: ['./workflow-user-access.component.scss']
})
export class WorkflowUserAccessComponent implements OnInit {

  constructor(private _applensDiagnosticService: ApplensDiagnosticService) { }

  workflowUsers: string[] = [];
  userAlias: string = '';
  isloading: boolean = true;
  error: any;

  ngOnInit(): void {
    this._applensDiagnosticService.getWorkflowUsers().subscribe(resp => {
      this.workflowUsers = resp;
      this.isloading = false;
    }, error => {
      this.error = error;
      this.isloading = false;
    });
  }

  addUser() {
    this.isloading = true;
    this.error = null;
    if (this.userAlias) {
      this._applensDiagnosticService.addWorkflowUser(this.userAlias).subscribe(resp => {
        this._applensDiagnosticService.getWorkflowUsers().subscribe(usersResponse => {
          this.workflowUsers = usersResponse;
          this.isloading = false;
        }, error => {
          this.error = error;
        });
      }, error => {
        this.error = error;
        this.isloading = false;
      });
    }
  }
}
