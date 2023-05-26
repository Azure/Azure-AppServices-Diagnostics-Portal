import { RenderingType } from "diagnostic-data";
import { Guid } from "projects/diagnostic-data/src/lib/utilities/guid";
import { NodeSettings, nodeJson } from "../../dynamic-node-settings/node-rendering-json-models";
import { nodeStatus } from "dist/diagnostic-data/public_api";

export class ComposerNodeModel {
    id: string = Guid.newGuid();
    public queryName:string; //Use a property here to replace space with underscore
    public code:string = '<query>\r\n';
    public editorRef?: monaco.editor.ICodeEditor = null;
    public renderingType:NoCodeSupportedRenderingTypes = RenderingType.Table;
    public settings:NodeSettings = new NodeSettings;
    public GetJson(){
        return`{"id":{${this.id}},"queryName":{${this.queryName}},"code":{${this.code}},"editorRef":{${this.editorRef}},"renderingType":{${this.renderingType}},"settings":{${this.settings.GetJson()}}}`
    }
    public constructor() {
        this.id = Guid.newGuid();
    }
    public static CreateNewFrom(element:ComposerNodeModel):ComposerNodeModel {
        let newElement:ComposerNodeModel = new ComposerNodeModel();
        newElement.id = Guid.newGuid(); //Generate unique id
        newElement.queryName = element.queryName + " (Copy)";
        newElement.code = element.code;
        newElement.renderingType = element.renderingType;
        if(element.renderingType == RenderingType.Markdown){
            newElement.code += 'you selected markdown';
        }
        return newElement;
    }
}

export type NoCodeSupportedRenderingTypes = Extract<RenderingType, RenderingType.Table | RenderingType.Insights | RenderingType.TimeSeries | RenderingType.Markdown>;
export const NoCodeSupportedRenderingTypes = {
    [RenderingType.Table]: RenderingType.Table,
    [RenderingType.Insights]: RenderingType.Insights,
    [RenderingType.TimeSeries]: RenderingType.TimeSeries,
    [RenderingType.Markdown]: RenderingType.Markdown
} as const;


export enum NodeTypes {
    Settings,
    GistReferences,
    RenderingElement
}

export interface ITPromptSuggestionModel {
    detectorId:string,
    detectorName:string,
    description:string,
    queryName:string,
    codeText:string
}
