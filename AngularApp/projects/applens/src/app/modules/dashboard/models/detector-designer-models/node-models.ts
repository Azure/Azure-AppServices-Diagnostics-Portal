import { RenderingType } from "diagnostic-data";
import { Guid } from "projects/diagnostic-data/src/lib/utilities/guid";

export class ComposerNodeModel {
    id: string = Guid.newGuid();
    public queryName:string; //Use a property here to replace space with underscore
    public code:string;
    public editorRef?: any = null;
    public renderingType:RenderingType = RenderingType.Table;
    public constructor() {
        this.id = Guid.newGuid();
    }
    public static CreateFrom(element:ComposerNodeModel):ComposerNodeModel {
        let newElement:ComposerNodeModel = new ComposerNodeModel();
        newElement.id = Guid.newGuid(); //Generate unique id
        newElement.queryName = element.queryName + " (Copy)";
        newElement.code = element.code;
        newElement.renderingType = element.renderingType;
        return newElement;
    }    
}


export enum NodeTypes {
    Settings,
    GistReferences,
    RenderingElement
}