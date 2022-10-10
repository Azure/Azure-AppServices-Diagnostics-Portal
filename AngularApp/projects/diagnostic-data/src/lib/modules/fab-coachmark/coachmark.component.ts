// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { AngularReact, ReactWrapperComponent } from '@angular-react/core';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  Renderer2,
  ViewChild,  
} from '@angular/core';
import { ICoachmarkProps } from 'office-ui-fabric-react/lib/Coachmark';

@AngularReact()
@Component({
  selector: 'fab-coachmark',
  exportAs: 'fabCoachmark',
  template: `
    <Coachmark
      #reactNode
      [target]="target"
      [ariaAlertText]="ariaAlertText"
      [ariaDescribedBy]="ariaDescribedBy"
      [ariaDescribedByText]="ariaDescribedByText"
      [ariaLabelledBy]="ariaLabelledBy"
      [ariaLabelledByText]="ariaLabelledByText"
      [beaconColorOne]="beaconColorOne"
      [beaconColorTwo]="beaconColorTwo"            
      [className]="className"      
      [color]="color"
      [componentRef]="componentRef"
      [delayBeforeCoachmarkAnimation]="delayBeforeCoachmarkAnimation"
      [delayBeforeMouseOpen]="delayBeforeMouseOpen"      
      [isCollapsed]="isCollapsed"
      [isPositionForced]="isPositionForced"
      [mouseProximityOffset]="mouseProximityOffset"
      (onAnimationOpenEnd)="onAnimationOpenEnd.emit()"
      (onAnimationOpenStart)="onAnimationOpenStart.emit()"
      (onDismiss)="onDismiss.emit($event)"
      (onMouseMove)="onMouseMove.emit($event)"
      [persistentBeak]="persistentBeak"
      [positioningContainerProps]="positioningContainerProps"
      [preventDismissOnLostFocus]="preventDismissOnLostFocus"
      [preventFocusOnMount]="preventFocusOnMount"
      [styles]="styles"            
      [theme]="theme"      
    >
      <ReactContent><ng-content></ng-content></ReactContent>
    </Coachmark>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class FabCoachmarkComponent extends ReactWrapperComponent<ICoachmarkProps> {
  @ViewChild('reactNode', { static: true }) protected reactNodeRef: ElementRef;

  @Input() target?: ICoachmarkProps['target'];
  @Input() ariaAlertText?: ICoachmarkProps['ariaAlertText'];
  @Input() ariaDescribedBy?: ICoachmarkProps['ariaDescribedBy'];
  @Input() ariaDescribedByText?: ICoachmarkProps['ariaDescribedByText'];
  @Input() ariaLabelledBy?: ICoachmarkProps['ariaLabelledBy'];
  @Input() ariaLabelledByText?: ICoachmarkProps['ariaLabelledByText'];
  @Input() beaconColorOne?: ICoachmarkProps['beaconColorOne'];
  @Input() beaconColorTwo?: ICoachmarkProps['beaconColorTwo'];  
  @Input() className?: ICoachmarkProps['className'];
  @Input() color?: ICoachmarkProps['color'];
  @Input() componentRef?: ICoachmarkProps['componentRef'];
  @Input() delayBeforeCoachmarkAnimation?: ICoachmarkProps['delayBeforeCoachmarkAnimation'];
  @Input() delayBeforeMouseOpen?: ICoachmarkProps['delayBeforeMouseOpen'];
  @Input() isCollapsed?: ICoachmarkProps['isCollapsed'];
  @Input() isPositionForced?: ICoachmarkProps['isPositionForced'];
  @Input() mouseProximityOffset?: ICoachmarkProps['mouseProximityOffset'];  
  @Input() positioningContainerProps?: ICoachmarkProps['positioningContainerProps'];
  @Input() preventDismissOnLostFocus?: ICoachmarkProps['preventDismissOnLostFocus'];
  @Input() preventFocusOnMount?: ICoachmarkProps['preventFocusOnMount'];  
  @Input() styles?: ICoachmarkProps['styles'];
  @Input() theme?: ICoachmarkProps['theme'];  
  @Input() persistentBeak?: boolean;

  @Output() readonly onAnimationOpenEnd = new EventEmitter<void>();
  @Output() readonly onAnimationOpenStart = new EventEmitter<void>();
  @Output() readonly onDismiss = new EventEmitter<{ ev?: any }>();
  @Output() readonly onMouseMove = new EventEmitter<{ e: any}>();

  constructor(elementRef: ElementRef, changeDetectorRef: ChangeDetectorRef, renderer: Renderer2) {
    super(elementRef, changeDetectorRef, renderer);
  }
}