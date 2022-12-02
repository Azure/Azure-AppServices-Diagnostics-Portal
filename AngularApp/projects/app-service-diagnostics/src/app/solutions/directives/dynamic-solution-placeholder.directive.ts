import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[dynamic-solution-placeholder]'
})
export class DynamicSolutionPlaceHolderDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}
