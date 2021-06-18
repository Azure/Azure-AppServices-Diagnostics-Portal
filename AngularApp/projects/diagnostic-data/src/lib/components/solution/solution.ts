import { SolutionTypeTag } from '../../models/solution-type-tag';

export class Solution {
    Name: string;
    Title: string;
    DescriptionMarkdown: string;
    Action: ActionType;
    ApiOptions: ArmApiOptions;
    BladeOptions: GoToBladeOptions;
    TabOptions: OpenTabOptions;
    OverrideOptions: {};
    RequiresConfirmation: boolean;
    ResourceUri: string;
    InternalMarkdown: string;
    TypeTag: SolutionTypeTag;
    IsInternal: boolean;
    DetectorId: string;
    Score: number;
}

export enum ActionType {
    Markdown = 'Markdown',
    ArmApi = 'ArmApi',
    OpenTab = 'OpenTab',
    GoToBlade = 'GoToBlade',
    ToggleStdoutSetting = 'ToggleStdoutSetting'
}

export class ArmApiOptions {
    Route: string;
    Verb: string;
}

export class OpenTabOptions {
    TabUrl: string;
}

export class GoToBladeOptions {
    DetailBlade: string;
    DetailBladeInputs: any;
    Extension?: string;
}

export interface SolutionButtonOption {
    label: string;
    type: SolutionButtonType;
    position: SolutionButtonPosition;
}

export enum SolutionButtonType {
    Button = "Button",
    Link = "Link",
}

export enum SolutionButtonPosition {
    Bottom,
    NextToTitle
}
