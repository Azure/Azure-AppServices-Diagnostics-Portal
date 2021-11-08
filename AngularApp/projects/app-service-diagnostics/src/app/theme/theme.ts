import { createTheme } from 'office-ui-fabric-react';
import { CommonSemanticColors, DarkSemanticColors, FontSizes } from '@uifabric/azure-themes';
//import { FontSizes } from './AzureType';
import * as StyleConstants from '@uifabric/azure-themes/lib/azure/Constants';

export interface Theme {
  name: string;
  properties: any;
}

export const light: Theme = {
  name: "light",
  properties: {

    // "--cardHovered": "#323130",
     "--cardTileKeywords": "#605E5C",
     "--tileHomepageHoverBackground": "#f3f2f1",
     "--homeBannerPreview": "#F0F6FF",
     "--homeBannerProd": "#F9F3FC",

    "--foreground-default": "#08090A",
    "--foreground-secondary": "#41474D",
    "--foreground-tertiary": "#797C80",
    "--foreground-quaternary": "#F4FAFF",
    "--foreground-light": "#41474D",

    "--bodyBackground": "#F4FAFF",
    "--background-secondary": "#A3B9CC",
    "--background-tertiary": "#5C7D99",
    "--background-light": "#FFFFFF",

    "--primary-default": "#5DFDCB",
    "--primary-dark": "#24B286",
    "--primary-light": "#B2FFE7",

    "--error-default": "#EF3E36",
    "--error-dark": "#800600",
    "--error-light": "#FFCECC",

    "--background-tertiary-shadow": "0 1px 3px 0 rgba(92, 125, 153, 0.5)"
  }
};

export const dark: Theme = {
  name: "dark",
  properties: {
    "--color": DarkSemanticColors.background,
    "--cardHovered": "#323130",
    "--cardTileKeywords": "white",
    "--tileHomepageHoverBackground": "#323130",
    "--homeBannerPreview": "#323130",
    "--homeBannerProd": "#323130",
    "--bodyDivider": CommonSemanticColors.dividers.lineSeparator,
    "--bodyText": DarkSemanticColors.text.body,
    "--bodyTextHovered": DarkSemanticColors.text.bodyHovered,
    "--buttonBackground": DarkSemanticColors.secondaryButton.rest.background,
    "--buttonBackgroundChecked": DarkSemanticColors.secondaryButton.pressed.background,
    "--buttonBackgroundCheckedHovered": DarkSemanticColors.secondaryButton.hover.background,
    "--buttonBackgroundDisabled": DarkSemanticColors.disabledButton.background,
    "--buttonBackgroundHovered": DarkSemanticColors.secondaryButton.hover.background,
    "--buttonBackgroundPressed": DarkSemanticColors.secondaryButton.pressed.background,
    "--ButtonBorderDisabled": DarkSemanticColors.disabledButton.background,
    "--buttonText": DarkSemanticColors.secondaryButton.rest.text,
    "--buttonTextChecked": DarkSemanticColors.secondaryButton.pressed.border,
    "--buttonTextCheckedHovered": DarkSemanticColors.secondaryButton.hover.border,
    "--buttonTextDisabled": DarkSemanticColors.disabledButton.text,
    "--buttonTextHovered": DarkSemanticColors.secondaryButton.hover.color,
    "--buttonTextPressed": DarkSemanticColors.secondaryButton.pressed.text,
    "--checkboxBackgroundChecked": DarkSemanticColors.checkBox.checked.background,
    "--checkboxBackgroundHovered": DarkSemanticColors.checkBox.checked.hoverBorder,
    "--checkBoxBorder": DarkSemanticColors.checkBox.rest.border,
    "--checkboxBorderChecked": DarkSemanticColors.checkBox.checked.border,
    "--checkboxBorderCheckedHovered": DarkSemanticColors.checkBox.checked.hoverBorder,
    "--checkBoxCheck": DarkSemanticColors.checkBox.rest.check,
    "--checkBoxCheckedFocus": DarkSemanticColors.checkBox.rest.focus,
    "--checkBoxCheckHover": DarkSemanticColors.checkBox.rest.hover,
    "--checkBoxDisabled": DarkSemanticColors.checkBox.disabled.border,
    "--checkBoxIndeterminateBackground": DarkSemanticColors.checkBox.rest.check,
    "--choiceGroupUncheckedDotHover": DarkSemanticColors.choiceGroup.circle.hover,
    "--commandBarBorder": DarkSemanticColors.commandBar.border,
    "--datePickerDisabledBorder": DarkSemanticColors.datePicker.disabled.border,
    "--datePickerSelectionBackground": DarkSemanticColors.datePicker.rest.selected,
    "--datePickerSelectionText": DarkSemanticColors.datePicker.rest.text,
    "--disabledBackground": CommonSemanticColors.backgrounds.disabled,
    "--disabledBodyText": DarkSemanticColors.text.disabled,
    "--errorBackground": DarkSemanticColors.controlOutlines.error,
    "--errorText": DarkSemanticColors.text.error,
    "--focusBorder": DarkSemanticColors.controlOutlines.accent,
    "--inputBackground": DarkSemanticColors.background,
    "--inputBorder": DarkSemanticColors.secondaryButton.rest.border,
    "--inputBorderHovered": DarkSemanticColors.secondaryButton.hover.border,
    "--inputBorderPressed": DarkSemanticColors.secondaryButton.pressed.border,
    "--inputPlaceholderText": DarkSemanticColors.text.placeholder,
    "--inputText": DarkSemanticColors.text.value,
    "--link": DarkSemanticColors.text.hyperlink,
    "--linkBackgroundHovered": DarkSemanticColors.text.hyperlinkBackgroundHovered,
    "--linkHovered": DarkSemanticColors.text.hyperlinkHovered,
    "--listBackground": DarkSemanticColors.background,
    "--listHeaderBackgroundPressed": DarkSemanticColors.item.hover,
    "--listItemBackgroundChecked": DarkSemanticColors.item.select,
    "--listItemBackgroundCheckedHovered": DarkSemanticColors.item.select,
    "--listItemBackgroundHovered": DarkSemanticColors.item.hover,
    "--listItemBackgroundSelected": DarkSemanticColors.item.hover,
    "--listItemBackgroundSelectedHovered": DarkSemanticColors.item.selectHovered,
    "--listText": DarkSemanticColors.text.body,
    "--menuItemBackgroundHovered": DarkSemanticColors.item.hover,
    "--menuItemBackgroundPressed": DarkSemanticColors.item.select,
    "--primaryButtonBackground": DarkSemanticColors.primaryButton.rest.background,
    "--primaryButtonBackgroundDisabled": DarkSemanticColors.disabledButton.background,
    "--primaryButtonBackgroundHovered": DarkSemanticColors.primaryButton.hover.background,
    "--primaryButtonBackgroundPressed": DarkSemanticColors.primaryButton.pressed.background,
    "--primaryButtonBorder": DarkSemanticColors.primaryButton.rest.border,
    "--primaryButtonBorderDisabled": DarkSemanticColors.primaryButton.disabled.border,
    "--primaryButtonText": DarkSemanticColors.primaryButton.rest.text,
    "--primaryButtonTextDisabled": DarkSemanticColors.disabledButton.text,
    "--primaryButtonTextFocused": DarkSemanticColors.primaryButton.focus.text,
    "--primaryButtonTextHovered": DarkSemanticColors.primaryButton.hover.text,
    "--primaryButtonTextPressed": DarkSemanticColors.primaryButton.pressed.text,
    "--primaryCompoundButtonBorder": DarkSemanticColors.primaryButton.rest.background,
    "--radioButtonPillBorderDisabled": DarkSemanticColors.radioButton.circle.borderDisabled,
    "--radioButtonPillCheckedHover": DarkSemanticColors.radioButton.pill.checkedHover,
    "--radioButtonPillUncheckedDisabled": DarkSemanticColors.radioButton.pill.uncheckedDisabled,
    "--radioButtonPillUncheckedHover": DarkSemanticColors.radioButton.pill.uncheckedHover,
    "--radioButtonPillDisabled": DarkSemanticColors.radioButton.pill.disabled,
    "--radioButtonThumbUnchecked": DarkSemanticColors.radioButton.circle.uncheckedRest,
    "--radioButtonThumbUncheckedDisabled": DarkSemanticColors.radioButton.pill.disabled,
    "--radioButtonThumbCheckedDisabled": DarkSemanticColors.radioButton.circle.checkedDisabled,
    "--rowBorder": DarkSemanticColors.detailsRow.border,
    "--tabHover": DarkSemanticColors.tabs.hover,
    "--variantBorder": CommonSemanticColors.dividers.lineSeparator,
    // extended
    "--controlAccent": DarkSemanticColors.controlOutlines.accent,
    "--controlOutline": DarkSemanticColors.controlOutlines.rest,
    "--controlOutlineDisabled": DarkSemanticColors.controlOutlines.disabled,
    "--controlOutlineHovered": DarkSemanticColors.controlOutlines.hover,
    "--iconButtonBackground": StyleConstants.transparent,
    "--iconButtonFill": DarkSemanticColors.primaryButton.rest.background,
    "--iconButtonFillHovered": DarkSemanticColors.primaryButton.hover.background,
    "--labelText": DarkSemanticColors.text.label,
    "--statusErrorBackground": DarkSemanticColors.statusBar.error,
    "--statusErrorText": DarkSemanticColors.text.body,
    "--statusErrorIcon": CommonSemanticColors.icons.error,
    "--statusInformationBackground": DarkSemanticColors.statusBar.information,
    "--statusInformationText": DarkSemanticColors.text.body,
    "--statusInformationIcon": CommonSemanticColors.icons.information,
    "--statusSuccessBackground": DarkSemanticColors.statusBar.okay,
    "--statusSuccessText": DarkSemanticColors.text.body,
    "--statusSuccessIcon": CommonSemanticColors.icons.okay,
    "--statusWarningBackground": DarkSemanticColors.statusBar.warning,
    "--statusWarningText": DarkSemanticColors.text.body,
    "--statusWarningIcon": CommonSemanticColors.icons.warning,
    "--teachingBubbleBackground": DarkSemanticColors.teachingBubble.rest.background,
    "--teachingBubblePrimaryButtonHover": DarkSemanticColors.teachingBubble.hover.primaryButtonBackground,
    "--teachingBubbleSecondaryBackground": DarkSemanticColors.teachingBubble.rest.secondaryBackround,
    "--teachingBubbleText": DarkSemanticColors.teachingBubble.rest.text,
    "--textFieldBorderDisabled": DarkSemanticColors.primaryButton.disabled.border,
    // temporary work around for high contrast themes
    "--choiceGroupContainerBorder": '0px',
    "--choiceGroupContainerBorderStyle": 'solid',
    "--listUnderline": 'none',
    "--linkBorderStyle": 'dashed',

    "--bodyBackground": DarkSemanticColors.background,
  }
};


var darkExtendedSemanticColors = {
    bodyBackground: DarkSemanticColors.background,
    bodyDivider: CommonSemanticColors.dividers.lineSeparator,
    bodyText: DarkSemanticColors.text.body,
    bodyTextHovered: DarkSemanticColors.text.bodyHovered,
    buttonBackground: DarkSemanticColors.secondaryButton.rest.background,
    buttonBackgroundChecked: DarkSemanticColors.secondaryButton.pressed.background,
    buttonBackgroundCheckedHovered: DarkSemanticColors.secondaryButton.hover.background,
    buttonBackgroundDisabled: DarkSemanticColors.disabledButton.background,
    buttonBackgroundHovered: DarkSemanticColors.secondaryButton.hover.background,
    buttonBackgroundPressed: DarkSemanticColors.secondaryButton.pressed.background,
    ButtonBorderDisabled: DarkSemanticColors.disabledButton.background,
    buttonText: DarkSemanticColors.secondaryButton.rest.text,
    buttonTextChecked: DarkSemanticColors.secondaryButton.pressed.border,
    buttonTextCheckedHovered: DarkSemanticColors.secondaryButton.hover.border,
    buttonTextDisabled: DarkSemanticColors.disabledButton.text,
    buttonTextHovered: DarkSemanticColors.secondaryButton.hover.color,
    buttonTextPressed: DarkSemanticColors.secondaryButton.pressed.text,
    checkboxBackgroundChecked: DarkSemanticColors.checkBox.checked.background,
    checkboxBackgroundHovered: DarkSemanticColors.checkBox.checked.hoverBorder,
    checkBoxBorder: DarkSemanticColors.checkBox.rest.border,
    checkboxBorderChecked: DarkSemanticColors.checkBox.checked.border,
    checkboxBorderCheckedHovered: DarkSemanticColors.checkBox.checked.hoverBorder,
    checkBoxCheck: DarkSemanticColors.checkBox.rest.check,
    checkBoxCheckedFocus: DarkSemanticColors.checkBox.rest.focus,
    checkBoxCheckHover: DarkSemanticColors.checkBox.rest.hover,
    checkBoxDisabled: DarkSemanticColors.checkBox.disabled.border,
    checkBoxIndeterminateBackground: DarkSemanticColors.checkBox.rest.check,
    choiceGroupUncheckedDotHover: DarkSemanticColors.choiceGroup.circle.hover,
    commandBarBorder: DarkSemanticColors.commandBar.border,
    datePickerDisabledBorder: DarkSemanticColors.datePicker.disabled.border,
    datePickerSelectionBackground: DarkSemanticColors.datePicker.rest.selected,
    datePickerSelectionText: DarkSemanticColors.datePicker.rest.text,
    disabledBackground: CommonSemanticColors.backgrounds.disabled,
    disabledBodyText: DarkSemanticColors.text.disabled,
    errorBackground: DarkSemanticColors.controlOutlines.error,
    errorText: DarkSemanticColors.text.error,
    focusBorder: DarkSemanticColors.controlOutlines.accent,
    inputBackground: DarkSemanticColors.background,
    inputBorder: DarkSemanticColors.secondaryButton.rest.border,
    inputBorderHovered: DarkSemanticColors.secondaryButton.hover.border,
    inputBorderPressed: DarkSemanticColors.secondaryButton.pressed.border,
    inputPlaceholderText: DarkSemanticColors.text.placeholder,
    inputText: DarkSemanticColors.text.value,
    link: DarkSemanticColors.text.hyperlink,
    linkBackgroundHovered: DarkSemanticColors.text.hyperlinkBackgroundHovered,
    linkHovered: DarkSemanticColors.text.hyperlinkHovered,
    listBackground: DarkSemanticColors.background,
    listHeaderBackgroundPressed: DarkSemanticColors.item.hover,
    listItemBackgroundChecked: DarkSemanticColors.item.select,
    listItemBackgroundCheckedHovered: DarkSemanticColors.item.select,
    listItemBackgroundHovered: DarkSemanticColors.item.hover,
    listItemBackgroundSelected: DarkSemanticColors.item.hover,
    listItemBackgroundSelectedHovered: DarkSemanticColors.item.selectHovered,
    listText: DarkSemanticColors.text.body,
    menuItemBackgroundHovered: DarkSemanticColors.item.hover,
    menuItemBackgroundPressed: DarkSemanticColors.item.select,
    primaryButtonBackground: DarkSemanticColors.primaryButton.rest.background,
    primaryButtonBackgroundDisabled: DarkSemanticColors.disabledButton.background,
    primaryButtonBackgroundHovered: DarkSemanticColors.primaryButton.hover.background,
    primaryButtonBackgroundPressed: DarkSemanticColors.primaryButton.pressed.background,
    primaryButtonBorder: DarkSemanticColors.primaryButton.rest.border,
    primaryButtonBorderDisabled: DarkSemanticColors.primaryButton.disabled.border,
    primaryButtonText: DarkSemanticColors.primaryButton.rest.text,
    primaryButtonTextDisabled: DarkSemanticColors.disabledButton.text,
    primaryButtonTextFocused: DarkSemanticColors.primaryButton.focus.text,
    primaryButtonTextHovered: DarkSemanticColors.primaryButton.hover.text,
    primaryButtonTextPressed: DarkSemanticColors.primaryButton.pressed.text,
    primaryCompoundButtonBorder: DarkSemanticColors.primaryButton.rest.background,
    radioButtonPillBorderDisabled: DarkSemanticColors.radioButton.circle.borderDisabled,
    radioButtonPillCheckedHover: DarkSemanticColors.radioButton.pill.checkedHover,
    radioButtonPillUncheckedDisabled: DarkSemanticColors.radioButton.pill.uncheckedDisabled,
    radioButtonPillUncheckedHover: DarkSemanticColors.radioButton.pill.uncheckedHover,
    radioButtonPillDisabled: DarkSemanticColors.radioButton.pill.disabled,
    radioButtonThumbUnchecked: DarkSemanticColors.radioButton.circle.uncheckedRest,
    radioButtonThumbUncheckedDisabled: DarkSemanticColors.radioButton.pill.disabled,
    radioButtonThumbCheckedDisabled: DarkSemanticColors.radioButton.circle.checkedDisabled,
    rowBorder: DarkSemanticColors.detailsRow.border,
    tabHover: DarkSemanticColors.tabs.hover,
    variantBorder: CommonSemanticColors.dividers.lineSeparator,
    // extended
    controlAccent: DarkSemanticColors.controlOutlines.accent,
    controlOutline: DarkSemanticColors.controlOutlines.rest,
    controlOutlineDisabled: DarkSemanticColors.controlOutlines.disabled,
    controlOutlineHovered: DarkSemanticColors.controlOutlines.hover,
    iconButtonBackground: StyleConstants.transparent,
    iconButtonFill: DarkSemanticColors.primaryButton.rest.background,
    iconButtonFillHovered: DarkSemanticColors.primaryButton.hover.background,
    labelText: DarkSemanticColors.text.label,
    statusErrorBackground: DarkSemanticColors.statusBar.error,
    statusErrorText: DarkSemanticColors.text.body,
    statusErrorIcon: CommonSemanticColors.icons.error,
    statusInformationBackground: DarkSemanticColors.statusBar.information,
    statusInformationText: DarkSemanticColors.text.body,
    statusInformationIcon: CommonSemanticColors.icons.information,
    statusSuccessBackground: DarkSemanticColors.statusBar.okay,
    statusSuccessText: DarkSemanticColors.text.body,
    statusSuccessIcon: CommonSemanticColors.icons.okay,
    statusWarningBackground: DarkSemanticColors.statusBar.warning,
    statusWarningText: DarkSemanticColors.text.body,
    statusWarningIcon: CommonSemanticColors.icons.warning,
    teachingBubbleBackground: DarkSemanticColors.teachingBubble.rest.background,
    teachingBubblePrimaryButtonHover: DarkSemanticColors.teachingBubble.hover.primaryButtonBackground,
    teachingBubbleSecondaryBackground: DarkSemanticColors.teachingBubble.rest.secondaryBackround,
    teachingBubbleText: DarkSemanticColors.teachingBubble.rest.text,
    textFieldBorderDisabled: DarkSemanticColors.primaryButton.disabled.border,
    // temporary work around for high contrast themes
    choiceGroupContainerBorder: '0px',
    choiceGroupContainerBorderStyle: 'solid',
    listUnderline: 'none',
    linkBorderStyle: 'dashed',
};
export var AzureThemeDark = createTheme({
    fonts: {
        medium: {
            fontFamily: StyleConstants.fontFamily,
            fontSize: FontSizes.size12,
        },
    },
    palette: {
        themePrimary: DarkSemanticColors.controlOutlines.accent,
        neutralPrimary: DarkSemanticColors.text.body,
        neutralDark: DarkSemanticColors.text.body,
        neutralLighter: DarkSemanticColors.shimmer.secondary,
        neutralLight: DarkSemanticColors.shimmer.primary,
        neutralLighterAlt: DarkSemanticColors.item.hover,
        neutralQuaternaryAlt: DarkSemanticColors.item.select,
        neutralSecondary: DarkSemanticColors.text.label,
        white: DarkSemanticColors.background,
    },
    semanticColors: darkExtendedSemanticColors,
});
//# sourceMappingURL=AzureThemeDark.js.map`
