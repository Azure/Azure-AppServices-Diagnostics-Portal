import { RenderingType } from "diagnostic-data";
import { Guid } from "projects/diagnostic-data/src/lib/utilities/guid";

export class ComposerNodeModel {
    id: string = Guid.newGuid();
    public queryName:string; //Use a property here to replace space with underscore
    public code:string;
    public editorRef?: any = null;
    public renderingType:NoCodeSupportedRenderingTypes = RenderingType.Table;
    public constructor() {
        this.id = Guid.newGuid();
    }
    public static CreateNewFrom(element:ComposerNodeModel):ComposerNodeModel {
        let newElement:ComposerNodeModel = new ComposerNodeModel();
        newElement.id = Guid.newGuid(); //Generate unique id
        newElement.queryName = element.queryName + " (Copy)";
        newElement.code = element.code;
        newElement.renderingType = element.renderingType;
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