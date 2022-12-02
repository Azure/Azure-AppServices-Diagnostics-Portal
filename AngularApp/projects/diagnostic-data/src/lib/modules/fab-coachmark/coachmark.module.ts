// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { registerElement } from '@angular-react/core';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { Coachmark } from 'office-ui-fabric-react';
import { FabCoachmarkComponent } from './coachmark.component';

const components = [FabCoachmarkComponent];

@NgModule({
  imports: [CommonModule],
  declarations: components,
  exports: components,
  schemas: [NO_ERRORS_SCHEMA]
})
export class FabCoachmarkModule {
  constructor() {
    // Add any React elements to the registry (used by the renderer).
    registerElement('Coachmark', () => Coachmark);
  }
}
