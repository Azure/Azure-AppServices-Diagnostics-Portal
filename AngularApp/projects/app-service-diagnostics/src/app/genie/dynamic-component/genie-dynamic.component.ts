import { Subscription } from 'rxjs';
import {
    Component, ComponentFactoryResolver, EventEmitter, Input, Output, ReflectiveInjector, ViewChild,
    ViewContainerRef
} from '@angular/core';
import { ButtonMessageComponent } from '../common/button-message/button-message.component';
import { FeedbackButtonMessageComponent } from '../common/feedback-button-message/feedback-button-message.component';
import { GraphMessageComponent } from '../common/graph-message/graph-message.component';
import { SolutionsMessageComponent } from '../common/solutions-message/solutions-message.component';
import { GenieTextMessageComponent } from '../common/text-message/text-message.component';
import {
    DetectorSummaryComponent
} from '../message-flow/detector-summary/detector-summary.component';
import {
    DocumentSearchResultsComponent
} from '../message-flow/document-search-results/document-search-results.component';
import {
    DynamicAnalysisComponent
} from '../message-flow/dynamic-analysis/dynamic-analysis.component';
import { DocumentSearchComponent } from '../message-flow/document-search/document-search.component';
import { GenieFeedbackComponent } from '../message-flow/genie-feedback/genie-feedback.component';
import {
    TalkToAgentMessageComponent
} from '../message-flow/talk-to-agent/talk-to-agent-message.component';
import { Message } from '../models/message';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'dynamic-component-genie',
    template: `
    <div #genieDynamicComponentContainer></div>
  `
})
export class GenieDynamicComponent {
    currentComponent = null;

    @ViewChild('genieDynamicComponentContainer', { read: ViewContainerRef, static: true }) dynamicComponentContainer: ViewContainerRef;

    @Output() onViewUpdate = new EventEmitter<any>();
    @Output() onComplete = new EventEmitter<any>();
    viewUpdateSubscription: Subscription;

    @Input() set componentData(message: Message) {
        if (!message) {
            return;
        }

        const inputProviders = Object.keys(message.parameters).map((inputName) => ({ provide: inputName, useValue: message.parameters[inputName] }));
        const resolvedInputs = ReflectiveInjector.resolve(inputProviders);

        // Create injector out of the data we want to pass down and this components injector
        const injector = ReflectiveInjector.fromResolvedProviders(resolvedInputs, this.dynamicComponentContainer.parentInjector);

        const factory = this.resolver.resolveComponentFactory(message.component);

        // Create the component using the factory and the injector
        const component = factory.create(injector);

        // Insert the component into the dom container
        this.dynamicComponentContainer.insert(component.hostView);

        // Destroy the old component
        if (this.currentComponent) {
            this.currentComponent.destroy();
        }

        this.currentComponent = component;

        // Subscribe to view Update event from Messages and emit out View Update Event
        this.viewUpdateSubscription = this.currentComponent.instance.onViewUpdate.subscribe((response: any) => {
            this.onViewUpdate.emit(response);
        });

        // Subscribe to Complete events from Messages
        // On completion, Do the following:
        //  1. Emit out the completion event
        //  2. Unsubscribe to component OnComplete and OnViewUpdate events to stop further notifications.
        this.currentComponent.instance.onComplete.pipe(
            takeUntil(this.onComplete)
        ).subscribe((response: { status: boolean, data?: any }) => {
            if (response.status === true) {
                this.onComplete.emit(response.data);
                this.viewUpdateSubscription.unsubscribe();

                // Throw ObjectUnsubscribed error if these subjects are still used
                this.onViewUpdate.unsubscribe();
                this.onComplete.unsubscribe();
            }
        });
    }

    constructor(private resolver: ComponentFactoryResolver) {
    }
}
