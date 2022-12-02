// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { registerElement } from '@angular-react/core';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { TeachingBubble } from 'office-ui-fabric-react';
import { FabTeachingBubbleComponent } from './teachingbubble.component';

const components = [FabTeachingBubbleComponent];

@NgModule({
  imports: [CommonModule],
  declarations: components,
  exports: components,
  schemas: [NO_ERRORS_SCHEMA]
})
export class FabTeachingBubbleModule {
  constructor() {
    // Add any React elements to the registry (used by the renderer).
    registerElement('TeachingBubble', () => TeachingBubble);
  }
}
