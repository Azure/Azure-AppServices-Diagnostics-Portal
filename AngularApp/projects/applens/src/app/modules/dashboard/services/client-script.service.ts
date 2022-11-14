import { Injectable, ViewContainerRef } from '@angular/core';
import { Router } from '@angular/router';
import { DiagnosticData, DynamicInsight, DynamicInsightV4Component, TelemetryService } from 'diagnostic-data';
import { MarkdownService } from 'ngx-markdown';


@Injectable()
export class ClientScriptService {

    constructor(private _markdownService:MarkdownService){

    }

    public process(viewContainerRef: ViewContainerRef, data: DiagnosticData) {
        var componentName:string = data.table.rows[0][0];
        viewContainerRef.clear();
        const componentRef = viewContainerRef.createComponent(DynamicInsightV4Component);
        var insightComponent = componentRef.instance;
        insightComponent.insight = new DynamicInsight("Info", "Client Script Component", true);
        insightComponent.insight.description = this._markdownService.compile(
            `Component name: **${componentName}**. Please make sure this component name is added in ` +
            `the \`componentDict\` of \`projects/app-service-diagnostics/src/app/shared/components/tools/client-script-components/component-manager.ts\`. ` + 
            `Otherwise nothing will be rendered in diagnostic portal`);
    }
}

