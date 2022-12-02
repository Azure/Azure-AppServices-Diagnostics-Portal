import { Component, Input, OnInit } from '@angular/core';
import { Solution } from '../solution/solution';

@Component({
  selector: 'solutions',
  templateUrl: './solutions.component.html',
  styleUrls: ['./solutions.component.scss']
})
export class SolutionsComponent implements OnInit {
  @Input() solutions: Solution[];
  selected: Solution;

  constructor() {}

  ngOnInit() {
    this.selected = this.solutions[0];
  }
}
