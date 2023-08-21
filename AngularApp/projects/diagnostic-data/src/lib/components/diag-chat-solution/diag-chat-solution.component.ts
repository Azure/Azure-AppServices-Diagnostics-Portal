import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GenieGlobals } from '../../services/genie.service';

@Component({
  selector: 'diag-chat-solution',
  templateUrl: './diag-chat-solution.component.html',
  styleUrls: ['./diag-chat-solution.component.scss']
})
export class DiagChatSolutionComponent implements OnInit {
  @Input() solutionBody: string = '';
  solutionTitle: string = '';
  solutionContent: string = '';
  solutionId: string = '';

  constructor(private _router: Router, private _route: ActivatedRoute, public globals: GenieGlobals) {
  }
  ngOnInit(): void {
    if (this.solutionBody && this.solutionBody != '') {
      const obj = JSON.parse(this.solutionBody);
      this.solutionTitle = obj?.SolutionInfo?.TextSolution?.Title ?? "";
      this.solutionContent = obj?.SolutionInfo?.TextSolution?.Description ?? "";
      this.solutionId = obj?.SolutionInfo?.TextSolution?.SolutionId ?? "";
    }
  }

  //To do, need to change the toolId to the real one
  openSolution() {
    this.globals.openDiagChatSolutionPanel = true;
    const toolId = "cpumonitoring";
    this._router.navigate([`tools/${toolId}`], { relativeTo: this._route, skipLocationChange: true });
  }
}
