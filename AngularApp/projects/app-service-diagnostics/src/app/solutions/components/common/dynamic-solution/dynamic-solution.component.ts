import { Component, Input, AfterViewInit, ViewChild, ComponentFactoryResolver } from '@angular/core';
import { DynamicSolutionPlaceHolderDirective } from '../../../directives/dynamic-solution-placeholder.directive';
import { SolutionHolder } from '../../../../shared/models/solution-holder';
import { SolutionBaseComponent } from '../solution-base/solution-base.component';
import { SiteRestartComponent } from '../../specific-solutions/site-restart-solution/site-restart-solution.component';
import { ScaleUpSolutionComponent } from '../../specific-solutions/scale-up-solution/scale-up-solution.component';
import { ScaleOutSolutionComponent } from '../../specific-solutions/scale-out-solution/scale-out-solution.component';
import { SplitSitesIntoDifferentServerFarmsSolutionComponent } from '../../specific-solutions/split-sites-serverfarms-solution/split-sites-serverfarms-solution.component';
import { RevertDeploymentComponent } from '../../specific-solutions/revert-deployment-solution/revert-deployment-solution.component';


@Component({
    selector: 'dynamic-solution',
    template: `
    <div dynamic-solution-placeholder></div>
    `
})
export class DynamicSolutionComponent implements AfterViewInit {
    currentComponent = null;

    @Input() solutionHolder: SolutionHolder;

    @ViewChild(DynamicSolutionPlaceHolderDirective) solutionPlaceHolder: DynamicSolutionPlaceHolderDirective;

    constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

    ngAfterViewInit(): void {
        const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.solutionHolder.component);

        const viewContainerRef = this.solutionPlaceHolder.viewContainerRef;
        viewContainerRef.clear();

        const componentRef = viewContainerRef.createComponent(componentFactory);
        (<SolutionBaseComponent>componentRef.instance).data = this.solutionHolder.data;
    }
}
