import { ChangeDetectorRef } from "@angular/core";
import { SeverityLevel } from "../../models/telemetry";
import { TelemetryService } from "../../services/telemetry/telemetry.service";
import { Guid } from "../../utilities/guid";
import { PIIUtilities } from "../../utilities/pii-utilities";
export abstract class StepFlow {
    public id: string;
    public title: string;
    public description?: string;
    abstract run(flowMgr: StepFlowManager): Promise<void>;
}

export enum StepViewType {
    dropdown,
    check,
    input,
    info,
    button
}

// for angular component variable binding
export class StepViewContainer {
    public stepView: StepView;

    constructor(view: StepView) {
        this.set(view);
    }
    public set(view: StepView) {
        this.stepView = view;
        view.container = this;
    }
}

export abstract class StepView {
    public id: string;
    public hidden?: boolean;
    public type?: StepViewType;
    public container?: StepViewContainer;

    constructor(view: StepView) {
        this.type = view.type;
        this.id = view.id;
        this.hidden = view.hidden || false;
    }
}

export class DropdownStepView extends StepView {
    public dropdowns: {
        description?: string,
        options: string[],
        defaultChecked?: number,
        placeholder: string
    }[];
    public width?: string;
    public bordered?: boolean;
    public description: string;
    public expandByDefault: boolean;
    public callback: (dropdownIdx: number, selectedIdx: number) => Promise<void>;
    public onDismiss?: () => void;
    public afterInit?: () => void;
    constructor(view: DropdownStepView) {
        super(view);
        this.type = StepViewType.dropdown;
        this.dropdowns = view.dropdowns;
        for(let i = 0; i<view.dropdowns.length; ++i){
            if(view.dropdowns[i].options == null){
                throw new Error("dropdown option should not be null");
            }
        }
        this.callback = view.callback;
        this.bordered = view.bordered || false;
        this.width = view.width || "100%";
        this.description = view.description || undefined;
        this.expandByDefault = view.expandByDefault || false;
        this.onDismiss = view.onDismiss || (() => { });
        this.afterInit = view.afterInit || (() => { });
    }
}

export class ButtonStepView extends StepView {
    public callback: () => Promise<void>;
    public text:string;
    constructor(view: ButtonStepView) {
        super(view);
        this.type = StepViewType.button;
        this.callback = view.callback;
        this.text = view.text;
    }
}

export enum checkResultLevel {
    pass,
    warning,
    fail,
    info,
    loading,
    error,
    hidden
}

export interface Check {
    title: string;
    level: number;
    subChecks?: Check[];
    detailsMarkdown?: string;
    expandByDefault?: boolean;
}

export class CheckStepView extends StepView implements Check {
    title: string;
    level: number;
    subChecks?: Check[];
    detailsMarkdown?: string;
    expandByDefault?: boolean;

    constructor(view: CheckStepView) {
        super(view);
        this.type = StepViewType.check;
        this.title = view.title;
        this.level = view.level;
        this.subChecks = view.subChecks || [];
        this.expandByDefault = view.expandByDefault;
        this.detailsMarkdown = view.detailsMarkdown;
    }
}

enum InfoType {
    recommendation,
    diagnostic
}

export class InfoStepView extends StepView {
    public title: string;
    public infoType: InfoType;
    public markdown: string;

    constructor(view: InfoStepView) {
        super(view);
        this.type = StepViewType.info;
        this.title = view.title;
        this.infoType = view.infoType;
        this.markdown = markdownPreprocess(view.markdown, view.id);
    }
}

function markdownPreprocess(markdown: string, id: string): string {
    if (markdown == null) {
        return null;
    }
    // parse markdown links to html <a> tag
    var result = markdown;
    try {
        const regex = new RegExp("(?<!\!)\[(.*?)]\((.*?)( +\"(.*?)\")?\)", "g");
        result = markdown.replace(regex, `<a target="_blank" href="$2" title="$4" onclick="networkCheckLinkClickEventLogger('${id}','$2', '$1')">$1</a>`);
    }
    catch (e) {
        result = markdown;
    }
    return result;
}

export class InputStepView extends StepView {
    public title: string;
    public placeholder: string;
    public text: string;
    public entry: string;
    public buttonText: string;
    public tooltip: string;
    public error: string;
    public collapsed?= false
    public callback: (input: string) => Promise<void>;

    constructor(view: InputStepView) {
        super(view);
        this.type = StepViewType.input;
        this.title = view.title;
        this.placeholder = view.placeholder;
        this.buttonText = view.buttonText;
        this.tooltip = view.tooltip;
        this.callback = view.callback;
        this.entry = view.entry;
        this.text = view.text;
        this.error = view.error;
        this.collapsed = view.collapsed || false;
    }
}


export class StepFlowManager {
    public stepViews: StepViewContainer[];
    private _stepViewQueue: PromiseCompletionSource<StepView[]>[];
    private _currentFlow: StepFlow;
    private _executionCount = 0;
    private _stepViewQueueMap: number[];
    public loadingView: { loadingText: string };
    private _defaultLoadingText = "Loading...";
    private _dom: HTMLDivElement;
    private _telemetryService: TelemetryService;
    public errorMsg: string;
    public errorDetailMarkdown: string;
    private _sessionId: string;
    private _viewLogs: StepView[];
    private _resourceUri: string;
    private _changeDetectorRef: ChangeDetectorRef;
    constructor(views: StepViewContainer[], telemetryService: TelemetryService, resourceUri: string, changeDetectorRef: ChangeDetectorRef) {
        this.stepViews = views;
        this._telemetryService = telemetryService;
        this._stepViewQueue = [new PromiseCompletionSource<StepView[]>()];
        this._stepViewQueueMap = [];
        this._resourceUri = resourceUri;
        this._changeDetectorRef = changeDetectorRef;
        this._execute();
    }

    public setDom(dom: HTMLDivElement) {
        this._dom = dom;
    }

    public setFlow(flow: StepFlow) {
        this._currentFlow = flow;
        this.errorMsg = null;
        this.errorDetailMarkdown = null;
        this._sessionId = Guid.newGuid();
        this._viewLogs = [];

        flow.run(this.generateMgrForFlow(flow)).catch(e => {
            e.flowId = this._currentFlow.id;
            console.log(e);
            this._telemetryService.logException(e, "StepFlowManager.FlowExecution");
            this.errorMsg = "Internal error, retry may not help."
            this.errorDetailMarkdown = "```\r\n" + e.stack + "\r\n```"
        });

    }

    private endFlow() {
        this._stepViewQueue[this._stepViewQueue.length - 1].resolve(null);
    }

    public reset(idx: number) {
        /*if(this._stepViewQueue.length == idx + 2){
            return;
        }*/
        this.endFlow();
        this._stepViewQueue.length = idx + 1;
        if (this._stepViewQueueMap[idx] != null) {
            this.stepViews.length = this._stepViewQueueMap[idx];
        }else{
            this.stepViews.length = 0;
        }
        this._stepViewQueue.push(new PromiseCompletionSource<StepView[]>());
        this._execute(idx + 1);
    }

    private async _execute(idx: number = 0) {
        ++this._executionCount;
        var currentCnt = this._executionCount;
        var stepViewQueue = this._stepViewQueue;
        while (idx < stepViewQueue.length && currentCnt == this._executionCount) {
            try {
                this.loadingView = stepViewQueue[idx];
                var views = await stepViewQueue[idx];
                if (views == null || currentCnt != this._executionCount) {
                    if (currentCnt == this._executionCount) {
                        this.loadingView = null;
                    }
                    break;
                }

                for (var i = 0; i < views.length; ++i) {
                    var view = views[i];
                    if (view == null) {
                        break;
                    }
                    view.id = view.id || this._currentFlow.id + `_${idx}`;
                    this.stepViews.push(new StepViewContainer(view));
                    if (this._currentFlow != null) {
                        this._viewLogs.push(view);
                        this._telemetryService.logEvent("NetworkCheck.ViewLog", {
                            "flowId": this._currentFlow.id,
                            "sessionId": this._sessionId,
                            "views": PIIUtilities.removePII(JSON.stringify(this._viewLogs, (key, value) => ({ "container": true })[key] ? undefined : value)),
                            "resourceUri": this._resourceUri
                        });
                    }
                    if (this._dom != null) {
                        delay(0.1).then(() => this._dom.scrollTop = this._dom.scrollHeight);
                    }
                }
            }
            catch (error) {
                error.flowId = this._currentFlow || this._currentFlow.id;
                this._telemetryService.logException(error, `FlowMgr.FlowRendering`);
                this.errorMsg = "Internal error"
                this.errorDetailMarkdown = "```\r\n" + error.stack + "\r\n```"
                console.log(error);
            }
            this._stepViewQueueMap[idx] = this.stepViews.length;
            ++idx;
        }
    }

    public addView(viewPromise: StepView | Promise<StepView>, loadingText?: string) {
        return this.addViews(Promise.resolve(viewPromise).then(v => [v]), loadingText);
    }

    public addViews(viewPromise: StepView[] | Promise<StepView[]>, loadingText?: string) {
        var idx = this._stepViewQueue.length - 1;
        this._stepViewQueue.push(new PromiseCompletionSource<StepView[]>());
        this._stepViewQueue[idx].resolve(viewPromise);
        this._stepViewQueue[idx].loadingText = loadingText || this._defaultLoadingText;
        return idx;
    }

    private generateAddViewsFunc(flow: StepFlow) {
        var addViews = this.addViews.bind(this);
        return (viewPromise: StepView[] | Promise<StepView[]>, loadingText?: string): number => {
            if (this._currentFlow != flow) {
                return;
            }
            return addViews(viewPromise, loadingText);
        };
    }

    private generateMgrForFlow(flow: StepFlow) {
        var mgr = { ...this }
        mgr.addViews = this.generateAddViewsFunc(flow);
        mgr.addView = this.addView;
        mgr.reset = this.reset.bind(this);
        mgr.logEvent = this.generateLogEventFunc(flow);
        mgr.logException = this.generateLogExceptionFunc(flow);
        mgr.setLoadText = this.setLoadText.bind(this);
        mgr.getSubCheckLevel = this.getSubCheckLevel;
        return mgr;
    }

    private generateLogEventFunc(flow: StepFlow) {
        var telemetryService = this._telemetryService;
        return (eventName: string, payload: any) => telemetryService.logEvent(`NetworkCheck.Flow.${eventName}`, { 
            flowId: flow.id, 
            payload,
            "resourceUri": this._resourceUri,
            "sessionId": this._sessionId,
        });
    }

    private generateLogExceptionFunc(flow: StepFlow) {
        var telemetryService = this._telemetryService;
        return (exception: Error, handledAt?: string, properties?: any, severityLevel?: SeverityLevel) => {
            if(handledAt == null){
                handledAt = `NetworkCheck.Flow.${flow.id}`;
            }else{
                handledAt = `NetworkCheck.Flow.${flow.id}.` + handledAt;
            }
            telemetryService.logException(exception, handledAt, properties, severityLevel);
        }
    }

    public logEvent: (eventName: string, payload: any) => void;
    public logException: (exception: Error, handledAt?: string, properties?: any, severityLevel?: SeverityLevel) => void;
    public setLoadText(text:string){
        this.loadingView.loadingText = text;
        this._changeDetectorRef.detectChanges();
    }

    public getSubCheckLevel(subChecks: Check[]){
        var level = 0;
        for(var i = 0; i<subChecks.length; ++i){
            if(subChecks[i].level == 2){
                return 2;
            }else if (subChecks[i].level == 1){
                level = 1;
            }
        }

        return level;
    }
}


function delay(second: number): Promise<void> {
    return new Promise(resolve =>
        setTimeout(resolve, second * 1000));
}

export class PromiseCompletionSource<T> extends Promise<T>{
    private _resolve: (value: T | PromiseLike<T>) => void;
    private _reject: (reason?: any) => void;
    public loadingText: string;

    constructor(timeoutInSec?: number) {
        var _resolve: (value: T | PromiseLike<T>) => void;
        var _reject: (reason?: any) => void;
        super((resolve, reject) => {
            _resolve = resolve;
            _reject = reject;
        });

        this._resolve = _resolve;
        this._reject = _reject;

        if (timeoutInSec != null) {
            delay(timeoutInSec).then(() => {
                this._reject(`Timeout after ${timeoutInSec} seconds!`);
            });
        }
    }

    resolve(val: T | PromiseLike<T>) {
        this._resolve(val);
    }
}