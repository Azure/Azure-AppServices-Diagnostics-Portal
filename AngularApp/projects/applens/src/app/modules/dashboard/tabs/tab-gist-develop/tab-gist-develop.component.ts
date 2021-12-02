import { Component, OnInit, Input } from '@angular/core';
import { DevelopMode } from '../../onboarding-flow/onboarding-flow.component';
import { ActivatedRoute, Params } from '@angular/router';

@Component({
  selector: 'tab-gist-develop',
  templateUrl: './tab-gist-develop.component.html',
  styleUrls: ['./tab-gist-develop.component.scss']
})
export class TabGistDevelopComponent implements OnInit {
  DevelopMode = DevelopMode;
  id: string;
  gradId: string;

  constructor(private _route: ActivatedRoute) {
  }

  ngOnInit() {
    this._route.params.subscribe((params: Params) => {
      this.refresh();
    });
  }

  refresh() {
    this.id = this._route.snapshot.params["gist"].toLowerCase();
    this.gradId = this._route.snapshot.params["gist"];
  }
}
