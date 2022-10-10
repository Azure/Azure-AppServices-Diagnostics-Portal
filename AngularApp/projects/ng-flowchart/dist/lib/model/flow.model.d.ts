import { TemplateRef, Type } from '@angular/core';
import { NgFlowchartCanvasService } from '../ng-flowchart-canvas.service';
import { NgFlowchartStepComponent } from '../ng-flowchart-step/ng-flowchart-step.component';
export declare namespace NgFlowchart {
    class Flow {
        private canvas;
        constructor(canvas: NgFlowchartCanvasService);
        /**
         * Returns the json representation of this flow
         * @param indent Optional indent to specify for formatting
         */
        toJSON(indent?: number): string;
        toObject(): {
            root: any;
        };
        /**
         * Create a flow and render it on the canvas from a json string
         * @param json The json string of the flow to render
         */
        upload(json: string | object): Promise<void>;
        /**
         * Returns the root step of the flow chart
         */
        getRoot(): NgFlowchartStepComponent;
        /**
         * Finds a step in the flow chart by a given id
         * @param id Id of the step to find. By default, the html id of the step
         */
        getStep(id: any): NgFlowchartStepComponent;
        /**
         * Re-renders the canvas. Generally this should only be used in rare circumstances
         * @param pretty Attempt to recenter the flow in the canvas
         */
        render(pretty?: boolean): void;
        /**
         * Clears all flow chart, reseting the current canvas
         */
        clear(): void;
    }
    class Options {
        /** The gap (in pixels) between flow steps*/
        stepGap?: number;
        /** An inner deadzone radius (in pixels) that will not register the hover icon  */
        hoverDeadzoneRadius?: number;
        /** Is the flow sequential? If true, then you will not be able to drag parallel steps */
        isSequential?: boolean;
        /** The default root position when dropped. Default is TOP_CENTER */
        rootPosition?: 'TOP_CENTER' | 'CENTER' | 'FREE';
        /** Should the canvas be centered when a resize is detected? */
        centerOnResize?: boolean;
        /** Canvas zoom options. Defaults to mouse wheel zoom */
        zoom?: {
            mode: 'WHEEL' | 'MANUAL' | 'DISABLED';
            defaultStep?: number;
        };
    }
    type DropEvent = {
        step: NgFlowchartStepComponent;
        parent?: NgFlowchartStepComponent;
        isMove: boolean;
    };
    type DropError = {
        step: PendingStep;
        parent?: NgFlowchartStepComponent;
        error: ErrorMessage;
    };
    type MoveError = {
        step: MoveStep;
        parent?: NgFlowchartStepComponent;
        error: ErrorMessage;
    };
    type ErrorMessage = {
        code?: string;
        message?: string;
    };
    interface MoveStep extends Step {
        instance: NgFlowchartStepComponent;
    }
    interface PendingStep extends Step {
        /**
         * An Ng-template containing the canvas content to be displayed.
         * Or a component type that extends NgFlowchartStepComponent
         */
        template: TemplateRef<any> | Type<NgFlowchartStepComponent>;
    }
    interface Step {
        /**
         * A unique string indicating the type of step this is.
         * This type will be used to register steps if you are uploading from json.
         */
        type: string;
        /**
         * Optional data to give the step. Typically configuration data that users can edit on the step.
         */
        data?: any;
    }
    type DropTarget = {
        step: NgFlowchartStepComponent;
        position: DropPosition;
    };
    type DropStatus = 'SUCCESS' | 'PENDING' | 'FAILED';
    type DropPosition = 'RIGHT' | 'LEFT' | 'BELOW' | 'ABOVE';
    type Callbacks = {
        /**
         * Called when user drops a new step from the palette or moves an existing step
         */
        onDropStep?: (drop: DropEvent) => void;
        /**
         * Called when the delete method has been called on the step
         */
        beforeDeleteStep?: (step: NgFlowchartStepComponent) => void;
        /**
         * Called after the delete method has run on the step. If you need to access
         * step children or parents, use beforeDeleteStep
         */
        afterDeleteStep?: (step: NgFlowchartStepComponent) => void;
        /**
         * Called when a new step fails to drop on the canvas
         */
        onDropError?: (drop: DropError) => void;
        /**
         * Called when an existing step fails to move
         */
        onMoveError?: (drop: MoveError) => void;
        /**
         * Called before the canvas is about to re-render
         */
        beforeRender?: () => void;
        /**
         * Called after the canvas completes a re-render
         */
        afterRender?: () => void;
        /**
         * Called after the canvas has been scaled
         */
        afterScale?: (newScale: number) => void;
    };
}
