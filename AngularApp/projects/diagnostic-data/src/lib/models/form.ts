import { DetectorResponse } from '../models/detector';
import { IDropdownOption } from 'office-ui-fabric-react/lib/components/Dropdown';

export class Form {
    formId: number;
    formTitle: string;
    formInputs: FormInput[] = [];
    formButtons: FormButton[] = [];
    errorMessage: string = '';
    formResponse: DetectorResponse;
    loadingFormResponse: boolean = false;
}

export class FormInput {
    internalId: string;
    inputId: number;
    inputType: InputType;
    inputLabel: string;
    inputValue: any;
    isRequired: boolean = false;
    displayValidation: boolean = false;
    tooltip: string;
    tooltipIcon: string;
    isVisible: boolean = true;

    constructor(internalId: string, id: number, inputType: InputType, label: string, isRequired: boolean, tooltip: string, tooltipIcon:string, isVisible: boolean = true) {
        this.internalId = internalId;
        this.inputId = id;
        this.inputType = inputType;
        this.inputLabel = label;
        this.isRequired = isRequired;
        this.tooltip = tooltip;
        this.tooltipIcon = tooltipIcon;
        this.isVisible = isVisible;
    }
}

export class FormButton extends FormInput {
    buttonStyle: ButtonStyles;
    constructor(internalId: string, id: number, inputType: InputType, label: string, isRequired: boolean, buttonStyle?: ButtonStyles) {
        super(internalId, id, inputType, label, isRequired, "", "");
        this.buttonStyle = buttonStyle != undefined ? buttonStyle : ButtonStyles.Primary;
    }
}

export class RadioButtonList extends FormInput {
    items: ListItem[] = [];
    constructor(internalId: string, id: number, inputType: InputType, label: string, items: ListItem[], tooltip: string, tooltipIcon: string, isVisible: boolean = true) {
        super(internalId, id, inputType, label, false, tooltip, tooltipIcon, isVisible);
        this.items = items;
        items.forEach(x => {
            if (x.isSelected) {
                this.inputValue = x.value;
            }
            x.tooltipIcon = x.tooltipIcon != "" ? x.tooltipIcon : "fa-info-circle";
        })
    }
}

export class Dropdown extends FormInput {
    dropdownOptions: IDropdownOption[];
    isMultiSelect:boolean;
    defaultSelectedKey: string;
    defaultSelectedKeys:string[];
    children: string[];
    constructor(internalId:string, id:number, inputType: InputType, label:string, options:IDropdownOption[], defaultKey:string,
        multiSelect: boolean, defaultKeys:string[], tooltip:string, tooltipIcon:string, children: string[], isVisible: boolean = true ) {
        super(internalId, id, inputType, label, false, tooltip, tooltipIcon, isVisible)
        this.dropdownOptions = options;
        this.isMultiSelect = multiSelect;
        this.defaultSelectedKey = defaultKey;
        this.defaultSelectedKeys = defaultKeys;
        this.inputValue = defaultKey != '' ? [defaultKey] : [];
        this.children = children;
        this.dropdownOptions.forEach(item => {
            item.ariaLabel = item.text;
            item.data = {
                "internalId": internalId,
                "isMultiSelect": multiSelect,
                "children": item["children"]
            };
        });
    }
}


export enum InputType {
    TextBox,
    Checkbox,
    RadioButton,
    DropDown,
    Button
}

export enum ButtonStyles {
    Primary = 0,
    Secondary,
    Success,
    Danger,
    Warning,
    Info,
    Light,
    Dark,
    Link
}

export interface ListItem {
    text: string;
    value: string;
    isSelected: boolean;
    tooltipIcon: string;
}
