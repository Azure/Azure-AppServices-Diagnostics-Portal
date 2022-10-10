import { ComponentRef, ElementRef, EventEmitter, TemplateRef } from '@angular/core';
import { NgFlowchart } from '../model/flow.model';
import { NgFlowchartCanvasService } from '../ng-flowchart-canvas.service';
import * as i0 from "@angular/core";
export declare type AddChildOptions = {
    /** Should the child be added as a sibling to existing children, if false the existing children will be reparented to this new child.
     * Default is true.
     * */
    sibling?: boolean;
    /** The index of the child. Only used when sibling is true.
     * Defaults to the end of the child array.
     */
    index?: number;
};
export declare class NgFlowchartStepComponent<T = any> {
    onMoveStart(event: DragEvent): void;
    onMoveEnd(event: DragEvent): void;
    protected view: ElementRef;
    data: T;
    type: string;
    canvas: NgFlowchartCanvasService;
    compRef: ComponentRef<NgFlowchartStepComponent>;
    viewInit: EventEmitter<any>;
    contentTemplate: TemplateRef<any>;
    private _id;
    private _currentPosition;
    private _initPosition;
    private _isHidden;
    private _parent;
    private _children;
    private arrow;
    private drop;
    private viewContainer;
    private compFactory;
    constructor();
    init(drop: any, viewContainer: any, compFactory: any): void;
    canDeleteStep(): boolean;
    canDrop(dropEvent: NgFlowchart.DropTarget, error: NgFlowchart.ErrorMessage): boolean;
    shouldEvalDropHover(coords: number[], stepToDrop: NgFlowchart.Step): boolean;
    onUpload(data: T): Promise<void>;
    getDropPositionsForStep(step: NgFlowchart.Step): NgFlowchart.DropPosition[];
    ngOnInit(): void;
    ngAfterViewInit(): void;
    get id(): any;
    get currentPosition(): number[];
    /**
     * Creates and adds a child to this step
     * @param template The template or component type to create
     * @param options Add options
     */
    addChild(pending: NgFlowchart.PendingStep, options: AddChildOptions): Promise<NgFlowchartStepComponent | null>;
    /**
     * Destroys this step component and updates all necessary child and parent relationships
     * @param recursive
     * @param checkCallbacks
     */
    destroy(recursive?: boolean, checkCallbacks?: boolean): boolean;
    /**
     * Remove a child from this step. Returns the index at which the child was found or -1 if not found.
     * @param childToRemove Step component to remove
     */
    removeChild(childToRemove: NgFlowchartStepComponent): number;
    /**
     * Re-parent this step
     * @param newParent The new parent for this step
     * @param force Force the re-parent if a parent already exists
     */
    setParent(newParent: NgFlowchartStepComponent, force?: boolean): void;
    /**
     * Called when no longer trying to drop or move a step adjacent to this one
     * @param position Position to render the icon
     */
    clearHoverIcons(): void;
    /**
     * Called when a step is trying to be dropped or moved adjacent to this step.
     * @param position Position to render the icon
     */
    showHoverIcon(position: NgFlowchart.DropPosition): void;
    /**
     * Is this the root element of the tree
     */
    isRootElement(): boolean;
    /**
     * Does this step have any children?
     * @param count Optional count of children to check. Defaults to 1. I.E has at least 1 child.
     */
    hasChildren(count?: number): boolean;
    /** Array of children steps for this step */
    get children(): NgFlowchartStepComponent<any>[];
    /** The parent step of this step */
    get parent(): NgFlowchartStepComponent<any>;
    /**
     * Returns the total width extent (in pixels) of this node tree
     * @param stepGap The current step gap for the flow canvas
     */
    getNodeTreeWidth(stepGap: number): any;
    /**
     * Is this step currently hidden and unavailable as a drop location
     */
    isHidden(): boolean;
    /**
     * Return current rect of this step. The position can be animated so getBoundingClientRect cannot
     * be reliable for positions
     * @param canvasRect Optional canvasRect to provide to offset the values
     */
    getCurrentRect(canvasRect?: DOMRect): Partial<DOMRect>;
    /**
     * Returns the JSON representation of this flow step
     */
    toJSON(): any;
    /** The native HTMLElement of this step */
    get nativeElement(): HTMLElement;
    setId(id: any): void;
    zsetPosition(pos: number[], offsetCenter?: boolean): void;
    zaddChild0(newChild: NgFlowchartStepComponent): boolean;
    zaddChildSibling0(child: NgFlowchartStepComponent, index?: number): void;
    zdrawArrow(start: number[], end: number[]): void;
    private destroy0;
    private createArrow;
    private hideTree;
    private showTree;
    private findLastSingleChild;
    private setChildren;
    static ɵfac: i0.ɵɵFactoryDeclaration<NgFlowchartStepComponent<any>, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<NgFlowchartStepComponent<any>, "ng-flowchart-step", never, { "data": "data"; "type": "type"; "canvas": "canvas"; "compRef": "compRef"; "contentTemplate": "contentTemplate"; }, { "viewInit": "viewInit"; }, never, never>;
}
