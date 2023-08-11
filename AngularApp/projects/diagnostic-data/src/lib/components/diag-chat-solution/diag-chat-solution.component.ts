import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'diag-chat-solution',
  templateUrl: './diag-chat-solution.component.html',
  styleUrls: ['./diag-chat-solution.component.scss']
})
export class DiagChatSolutionComponent implements OnInit {
  @Input() solutionBody: string = '';
  solutionTitle: string = '';
  solutionContent: string = '';
  constructor() {
  }
  ngOnInit(): void {
    if(this.solutionBody && this.solutionBody != '') {
      var obj = JSON.parse(this.solutionBody);
      if (obj && obj.SolutionInfo && obj.SolutionInfo.TextSolution) {
        this.solutionTitle = obj.SolutionInfo.TextSolution.Title;
        this.solutionContent = obj.SolutionInfo.TextSolution.Description;
      }
    }
  }
}
