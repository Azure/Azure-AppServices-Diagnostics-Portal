export class CustomCommandBarButtons {
    displayText: string;
    iconName: string;
    disabled: boolean = false;
    onClick : () => void = function() {};
}