import { Component, OnInit } from '@angular/core';
import { ApplensGlobal } from '../../../applens-global';
import { applensDocs } from '../../utilities/applens-docs-constant';

@Component({
  selector: 'applens-docs',
  templateUrl: './applens-docs.component.html',
  styleUrls: ['./applens-docs.component.scss']
})
export class ApplensDocsComponent implements OnInit {
  applensDocs = applensDocs;
  constructor(private _applensGlobal:ApplensGlobal) { }
  ngOnInit() {
      this._applensGlobal.updateHeader("");
  }
}
