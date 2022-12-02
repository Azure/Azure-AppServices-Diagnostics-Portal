import { Type } from '@angular/core';
import { SolutionData } from './solution';

export class SolutionHolder {
  constructor(public component: Type<any>, public data: SolutionData) {}
}
