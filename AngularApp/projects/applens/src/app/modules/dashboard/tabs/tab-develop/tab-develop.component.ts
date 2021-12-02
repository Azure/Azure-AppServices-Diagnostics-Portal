import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DevelopMode } from '../../onboarding-flow/onboarding-flow.component';

@Component({
  selector: 'tab-develop',
  templateUrl: './tab-develop.component.html',
  styleUrls: ['./tab-develop.component.scss']
})
export class TabDevelopComponent implements OnInit {

  DevelopMode = DevelopMode;
  id: string;

  constructor(private _route: ActivatedRoute) {
  }

  ngOnInit() {
    this.id = this._route.parent.snapshot.params['detector'];
  }
}
