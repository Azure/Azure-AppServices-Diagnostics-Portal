import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PanelType } from 'office-ui-fabric-react';

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

  panelDisplay: boolean = false;
  panelType: PanelType = PanelType.custom
  constructor(private _router: Router, private _route: ActivatedRoute) {
  }
  ngOnInit(): void {
    if (this.solutionBody && this.solutionBody != '') {
      const obj = JSON.parse(this.solutionBody);
      this.solutionTitle = obj?.SolutionInfo?.TextSolution?.Title ?? "";
      this.solutionContent = obj?.SolutionInfo?.TextSolution?.Description ?? "";
      this.solutionId = obj?.SolutionInfo?.TextSolution?.SolutionId ?? "";
    }
  }

  navigateToSolution() {
    this.panelDisplay = true;
    const toolId = "cpumonitoring";
    this._router.navigate([`tools/${toolId}`], {relativeTo: this._route});
  }

  closePanel() {
    this.panelDisplay = false;
    this._router.navigate([`../../`], {relativeTo: this._route});
  }
}
