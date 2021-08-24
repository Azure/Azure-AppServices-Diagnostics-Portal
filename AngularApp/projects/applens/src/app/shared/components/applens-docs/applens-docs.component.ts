import { Component } from '@angular/core';
import { applensDocs } from '../../utilities/applens-docs-constant';

@Component({
  selector: 'applens-docs',
  templateUrl: './applens-docs.component.html',
  styleUrls: ['./applens-docs.component.scss']
})
export class ApplensDocsComponent {
  applensDocs = applensDocs;
  constructor() { }
}
