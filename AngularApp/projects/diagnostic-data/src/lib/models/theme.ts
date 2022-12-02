import {
  CommonSemanticColors,
  DarkSemanticColors,
  FontSizes,
  HighContrastDarkSemanticColors,
  HighContrastLightSemanticColors,
  LightSemanticColors
} from '@uifabric/azure-themes';
import * as StyleConstants from '@uifabric/azure-themes/lib/azure/Constants';

export interface Theme {
  name: string;
  properties: any;
}

export const light: Theme = {
  name: 'light',
  properties: {
    '--color': LightSemanticColors.background,
    '--solutionButtonBackground': '#f1f1f1',
    '--highlightBlue': '#286090',
    '--proactiveTopMenuButton': '#ddd',
    '--notificationBarBackground': '#FEF0F1',
    '--listAnalysisBackground': '#f9f9f9',
    '--sectionTitle': '#323130',
    '--summaryText': '#605E5C',
    '--cardHovered': '#323130',
    '--cardTileKeywords': '#605E5C',
    '--tileHomepageHoverBackground': '#f3f2f1',
    '--homeBannerPreview': '#F0F6FF',
    '--homeBannerProd': 'rgba(0, 120, 212, 0.1)',
    '--utterancesLink': 'indigo',
    '--imageLabel': 'green',
    '--bannerHovered': LightSemanticColors.text.bodyHovered,
    '--borderBottom': '#ccc',
    '--mainSiderBar': '#ffffff',
    '--panelBorder': '#ffffff',
    '--cardViewTitle': '#646464',
    '--inputGroupBorder': '#cccccc',
    '--homeBannerBackground': 'rgba(215, 172, 237,1)',
    '--timePickerStr': '#605E5C',
    '--listHeader': '#666',
    '--dropdownLabel': '#6b6969',
    '--mainContainerBackground': '#E5E5E5',
    '--genieSystemMessageBackgroundColor': 'rgba(0, 0, 0, 0.06)',
    '--activeIssueMessageBarBGColor': 'rgb(253, 231, 233)',
    '--resolvedIssueMessageBarBGColor': 'rgb(255 244 206)',
    '--commIssueTitle': '#3c3c3c',
    '--messageBarBackground': '#F0F6FF',
    '--messageBarIconColor': '#015CDA',
    '--imgButtonBackground': 'white',
    '--recommendationInfoBg': 'rgb(240, 246, 255)',
    '--diagnosticInfoBg': 'rgb(249, 243, 252)',
    '--docsCodeWindowCommandbar': '#e6e6e6',
    '--docsCodeWindowBackground': '#e9e9e9',
    '--menuItemText': LightSemanticColors.text.body,
    '--bodyDivider': CommonSemanticColors.dividers.lineSeparator,
    '--bodyText': LightSemanticColors.text.body,
    '--bodyTextHovered': LightSemanticColors.text.bodyHovered,
    '--buttonBackground': LightSemanticColors.secondaryButton.rest.background,
    '--buttonBackgroundChecked':
      LightSemanticColors.secondaryButton.pressed.background,
    '--buttonBackgroundCheckedHovered':
      LightSemanticColors.secondaryButton.hover.background,
    '--buttonBackgroundDisabled': LightSemanticColors.disabledButton.background,
    '--buttonBackgroundHovered':
      LightSemanticColors.secondaryButton.hover.background,
    '--buttonBackgroundPressed':
      LightSemanticColors.secondaryButton.pressed.background,
    '--ButtonBorderDisabled': LightSemanticColors.disabledButton.background,
    '--buttonText': LightSemanticColors.secondaryButton.rest.text,
    '--buttonTextChecked': LightSemanticColors.secondaryButton.pressed.border,
    '--buttonTextCheckedHovered':
      LightSemanticColors.secondaryButton.hover.border,
    '--buttonTextDisabled': LightSemanticColors.disabledButton.text,
    '--buttonTextHovered': LightSemanticColors.secondaryButton.hover.color,
    '--buttonTextPressed': LightSemanticColors.secondaryButton.pressed.text,
    '--checkboxBackgroundChecked':
      LightSemanticColors.checkBox.checked.background,
    '--checkboxBackgroundHovered':
      LightSemanticColors.checkBox.checked.hoverBorder,
    '--checkBoxBorder': LightSemanticColors.checkBox.rest.border,
    '--checkboxBorderChecked': LightSemanticColors.checkBox.checked.border,
    '--checkboxBorderCheckedHovered':
      LightSemanticColors.checkBox.checked.hoverBorder,
    '--checkBoxCheck': LightSemanticColors.checkBox.rest.check,
    '--checkBoxCheckedFocus': LightSemanticColors.checkBox.rest.focus,
    '--checkBoxCheckHover': LightSemanticColors.checkBox.rest.hover,
    '--checkBoxDisabled': LightSemanticColors.checkBox.disabled.border,
    '--checkBoxIndeterminateBackground':
      LightSemanticColors.checkBox.rest.check,
    '--choiceGroupUncheckedDotHover':
      LightSemanticColors.choiceGroup.circle.hover,
    '--commandBarBorder': LightSemanticColors.commandBar.border,
    '--datePickerDisabledBorder':
      LightSemanticColors.datePicker.disabled.border,
    '--datePickerSelectionBackground':
      LightSemanticColors.datePicker.rest.selected,
    '--datePickerSelectionText': LightSemanticColors.datePicker.rest.text,
    '--disabledBackground': CommonSemanticColors.backgrounds.disabled,
    '--disabledBodyText': LightSemanticColors.text.disabled,
    '--errorBackground': LightSemanticColors.controlOutlines.error,
    '--errorText': LightSemanticColors.text.error,
    '--focusBorder': LightSemanticColors.controlOutlines.accent,
    '--inputBackground': LightSemanticColors.background,
    '--inputBorder': LightSemanticColors.secondaryButton.rest.border,
    '--inputBorderHovered': LightSemanticColors.secondaryButton.hover.border,
    '--inputBorderPressed': LightSemanticColors.secondaryButton.pressed.border,
    '--inputPlaceholderText': LightSemanticColors.text.placeholder,
    '--inputText': LightSemanticColors.text.value,
    '--link': LightSemanticColors.text.hyperlink,
    '--linkBackgroundHovered':
      LightSemanticColors.text.hyperlinkBackgroundHovered,
    '--linkHovered': LightSemanticColors.text.hyperlinkHovered,
    '--listBackground': LightSemanticColors.background,
    '--listHeaderBackgroundPressed': LightSemanticColors.item.hover,
    '--listItemBackgroundChecked': LightSemanticColors.item.select,
    '--listItemBackgroundCheckedHovered': LightSemanticColors.item.select,
    '--listItemBackgroundHovered': LightSemanticColors.item.hover,
    '--sideMenuItemBackgroundSelected': 'rgba(0,137,250,.1)',
    '--listItemBackgroundSelected': LightSemanticColors.item.hover,
    '--listItemBackgroundSelectedHovered':
      LightSemanticColors.item.selectHovered,
    '--listText': LightSemanticColors.text.body,
    '--menuItemBackgroundHovered': LightSemanticColors.item.hover,
    '--menuItemBackgroundPressed': LightSemanticColors.item.select,
    '--primaryButtonBackground':
      LightSemanticColors.primaryButton.rest.background,
    '--primaryButtonBackgroundDisabled':
      LightSemanticColors.disabledButton.background,
    '--primaryButtonBackgroundHovered':
      LightSemanticColors.primaryButton.hover.background,
    '--primaryButtonBackgroundPressed':
      LightSemanticColors.primaryButton.pressed.background,
    '--primaryButtonBorder': LightSemanticColors.primaryButton.rest.border,
    '--primaryButtonBorderDisabled':
      LightSemanticColors.primaryButton.disabled.border,
    '--primaryButtonText': LightSemanticColors.primaryButton.rest.text,
    '--primaryButtonTextDisabled': LightSemanticColors.disabledButton.text,
    '--primaryButtonTextFocused': LightSemanticColors.primaryButton.focus.text,
    '--primaryButtonTextHovered': LightSemanticColors.primaryButton.hover.text,
    '--primaryButtonTextPressed':
      LightSemanticColors.primaryButton.pressed.text,
    '--primaryCompoundButtonBorder':
      LightSemanticColors.primaryButton.rest.background,
    '--radioButtonPillBorderDisabled':
      LightSemanticColors.radioButton.circle.borderDisabled,
    '--radioButtonPillCheckedHover':
      LightSemanticColors.radioButton.pill.checkedHover,
    '--radioButtonPillUncheckedDisabled':
      LightSemanticColors.radioButton.pill.uncheckedDisabled,
    '--radioButtonPillUncheckedHover':
      LightSemanticColors.radioButton.pill.uncheckedHover,
    '--radioButtonPillDisabled': LightSemanticColors.radioButton.pill.disabled,
    '--radioButtonThumbUnchecked':
      LightSemanticColors.radioButton.circle.uncheckedRest,
    '--radioButtonThumbUncheckedDisabled':
      LightSemanticColors.radioButton.pill.disabled,
    '--radioButtonThumbCheckedDisabled':
      LightSemanticColors.radioButton.circle.checkedDisabled,
    '--rowBorder': LightSemanticColors.detailsRow.border,
    '--tabHover': LightSemanticColors.tabs.hover,
    '--variantBorder': CommonSemanticColors.dividers.lineSeparator,
    // extended
    '--controlAccent': LightSemanticColors.controlOutlines.accent,
    '--controlOutline': LightSemanticColors.controlOutlines.rest,
    '--controlOutlineDisabled': LightSemanticColors.controlOutlines.disabled,
    '--controlOutlineHovered': LightSemanticColors.controlOutlines.hover,
    '--iconButtonBackground': StyleConstants.transparent,
    '--iconButtonFill': LightSemanticColors.primaryButton.rest.background,
    '--iconButtonFillHovered':
      LightSemanticColors.primaryButton.hover.background,
    '--labelText': LightSemanticColors.text.label,
    '--statusErrorBackground': LightSemanticColors.statusBar.error,
    '--statusErrorText': LightSemanticColors.text.body,
    '--statusErrorIcon': CommonSemanticColors.icons.error,
    '--statusInformationBackground': LightSemanticColors.statusBar.information,
    '--statusInformationText': LightSemanticColors.text.body,
    '--statusInformationIcon': CommonSemanticColors.icons.information,
    '--statusSuccessBackground': LightSemanticColors.statusBar.okay,
    '--statusSuccessText': LightSemanticColors.text.body,
    '--statusSuccessIcon': CommonSemanticColors.icons.okay,
    '--statusWarningBackground': LightSemanticColors.statusBar.warning,
    '--statusWarningText': LightSemanticColors.text.body,
    '--statusWarningIcon': CommonSemanticColors.icons.warning,
    '--teachingBubbleBackground':
      LightSemanticColors.teachingBubble.rest.background,
    '--teachingBubblePrimaryButtonHover':
      LightSemanticColors.teachingBubble.hover.primaryButtonBackground,
    '--teachingBubbleSecondaryBackground':
      LightSemanticColors.teachingBubble.rest.secondaryBackround,
    '--teachingBubbleText': LightSemanticColors.teachingBubble.rest.text,
    '--textFieldBorderDisabled':
      LightSemanticColors.primaryButton.disabled.border,
    // temporary work around for high contrast themes
    '--choiceGroupContainerBorder': '0px',
    '--choiceGroupContainerBorderStyle': 'solid',
    '--listUnderline': 'none',
    '--linkBorderStyle': 'dashed',

    '--bodyBackground': LightSemanticColors.background
  }
};

export const dark: Theme = {
  name: 'dark',
  properties: {
    '--color': DarkSemanticColors.background,
    '--proactiveTopMenuButton': '#605e5c',
    '--notificationBarBackground': '#323130',
    '--solutionButtonBackground':
      DarkSemanticColors.secondaryButton.rest.background,
    '--highlightBlue': '#2899f5',
    '--listAnalysisBackground': DarkSemanticColors.background,
    '--sectionTitle': 'white',
    '--summaryText': 'white',
    '--cardHovered': '#323130',
    '--cardTileKeywords': 'white',
    '--tileHomepageHoverBackground': '#323130',
    '--homeBannerPreview': '#323130',
    '--homeBannerProd': '#323130',
    '--cardViewTitle': '#bbb',
    '--genieSystemMessageBackgroundColor': '#605e5c',
    '--homeBannerBackground': 'rgb(107 81 121)',
    '--timePickerStr': 'white',
    '--inputGroupBorder': '#cccccc',
    '--listHeader': 'white',
    '--dropdownLabel': 'white',
    '--commIssueTitle': 'white',
    '--activeIssueMessageBarBGColor': 'rgb(189 114 121)',
    '--resolvedIssueMessageBarBGColor': 'rgb(172 138 19)',
    '--messageBarBackground': '#444649',
    '--messageBarIconColor': 'rgb(127 157 197)',
    '--utterancesLink': '#ab6dd8',
    '--bannerHovered': DarkSemanticColors.text.bodyHovered,
    '--borderBottom': DarkSemanticColors.background,
    '--mainSiderBar': DarkSemanticColors.background,
    '--panelBorder': 'white',
    '--imageLabel': '#45eb42',
    '--mainContainerBackground': '#565454',
    '--imgButtonBackground': 'darkgray',
    '--recommendationInfoBg': '#5d5d5d',
    '--diagnosticInfoBg': '#5d5d5d',
    '--docsCodeWindowCommandbar': '#444',
    '--docsCodeWindowBackground': '#404040',
    '--menuItemText': DarkSemanticColors.text.body,
    '--bodyDivider': CommonSemanticColors.dividers.lineSeparator,
    '--bodyText': DarkSemanticColors.text.body,
    '--bodyTextHovered': DarkSemanticColors.text.bodyHovered,
    '--buttonBackground': DarkSemanticColors.secondaryButton.rest.background,
    '--buttonBackgroundChecked':
      DarkSemanticColors.secondaryButton.pressed.background,
    '--buttonBackgroundCheckedHovered':
      DarkSemanticColors.secondaryButton.hover.background,
    '--buttonBackgroundDisabled': DarkSemanticColors.disabledButton.background,
    '--buttonBackgroundHovered':
      DarkSemanticColors.secondaryButton.hover.background,
    '--buttonBackgroundPressed':
      DarkSemanticColors.secondaryButton.pressed.background,
    '--ButtonBorderDisabled': DarkSemanticColors.disabledButton.background,
    '--buttonText': DarkSemanticColors.secondaryButton.rest.text,
    '--buttonTextChecked': DarkSemanticColors.secondaryButton.pressed.border,
    '--buttonTextCheckedHovered':
      DarkSemanticColors.secondaryButton.hover.border,
    '--buttonTextDisabled': DarkSemanticColors.disabledButton.text,
    '--buttonTextHovered': DarkSemanticColors.secondaryButton.hover.color,
    '--buttonTextPressed': DarkSemanticColors.secondaryButton.pressed.text,
    '--checkboxBackgroundChecked':
      DarkSemanticColors.checkBox.checked.background,
    '--checkboxBackgroundHovered':
      DarkSemanticColors.checkBox.checked.hoverBorder,
    '--checkBoxBorder': DarkSemanticColors.checkBox.rest.border,
    '--checkboxBorderChecked': DarkSemanticColors.checkBox.checked.border,
    '--checkboxBorderCheckedHovered':
      DarkSemanticColors.checkBox.checked.hoverBorder,
    '--checkBoxCheck': DarkSemanticColors.checkBox.rest.check,
    '--checkBoxCheckedFocus': DarkSemanticColors.checkBox.rest.focus,
    '--checkBoxCheckHover': DarkSemanticColors.checkBox.rest.hover,
    '--checkBoxDisabled': DarkSemanticColors.checkBox.disabled.border,
    '--checkBoxIndeterminateBackground': DarkSemanticColors.checkBox.rest.check,
    '--choiceGroupUncheckedDotHover':
      DarkSemanticColors.choiceGroup.circle.hover,
    '--commandBarBorder': DarkSemanticColors.commandBar.border,
    '--datePickerDisabledBorder': DarkSemanticColors.datePicker.disabled.border,
    '--datePickerSelectionBackground':
      DarkSemanticColors.datePicker.rest.selected,
    '--datePickerSelectionText': DarkSemanticColors.datePicker.rest.text,
    '--disabledBackground': CommonSemanticColors.backgrounds.disabled,
    '--disabledBodyText': DarkSemanticColors.text.disabled,
    '--errorBackground': DarkSemanticColors.controlOutlines.error,
    '--errorText': DarkSemanticColors.text.error,
    '--focusBorder': DarkSemanticColors.controlOutlines.accent,
    '--inputBackground': DarkSemanticColors.background,
    '--inputBorder': DarkSemanticColors.secondaryButton.rest.border,
    '--inputBorderHovered': DarkSemanticColors.secondaryButton.hover.border,
    '--inputBorderPressed': DarkSemanticColors.secondaryButton.pressed.border,
    '--inputPlaceholderText': DarkSemanticColors.text.placeholder,
    '--inputText': DarkSemanticColors.text.value,
    '--link': DarkSemanticColors.text.hyperlink,
    '--linkBackgroundHovered':
      DarkSemanticColors.text.hyperlinkBackgroundHovered,
    '--linkHovered': DarkSemanticColors.text.hyperlinkHovered,
    '--listBackground': DarkSemanticColors.background,
    '--listHeaderBackgroundPressed': DarkSemanticColors.item.hover,
    '--listItemBackgroundChecked': DarkSemanticColors.item.select,
    '--listItemBackgroundCheckedHovered': DarkSemanticColors.item.select,
    '--listItemBackgroundHovered': DarkSemanticColors.item.hover,
    '--sideMenuItemBackgroundSelected': DarkSemanticColors.item.hover,
    '--listItemBackgroundSelected': DarkSemanticColors.item.hover,
    '--listItemBackgroundSelectedHovered':
      DarkSemanticColors.item.selectHovered,
    '--listText': DarkSemanticColors.text.body,
    '--menuItemBackgroundHovered': DarkSemanticColors.item.hover,
    '--menuItemBackgroundPressed': DarkSemanticColors.item.select,
    '--primaryButtonBackground':
      DarkSemanticColors.primaryButton.rest.background,
    '--primaryButtonBackgroundDisabled':
      DarkSemanticColors.disabledButton.background,
    '--primaryButtonBackgroundHovered':
      DarkSemanticColors.primaryButton.hover.background,
    '--primaryButtonBackgroundPressed':
      DarkSemanticColors.primaryButton.pressed.background,
    '--primaryButtonBorder': DarkSemanticColors.primaryButton.rest.border,
    '--primaryButtonBorderDisabled':
      DarkSemanticColors.primaryButton.disabled.border,
    '--primaryButtonText': DarkSemanticColors.primaryButton.rest.text,
    '--primaryButtonTextDisabled': DarkSemanticColors.disabledButton.text,
    '--primaryButtonTextFocused': DarkSemanticColors.primaryButton.focus.text,
    '--primaryButtonTextHovered': DarkSemanticColors.primaryButton.hover.text,
    '--primaryButtonTextPressed': DarkSemanticColors.primaryButton.pressed.text,
    '--primaryCompoundButtonBorder':
      DarkSemanticColors.primaryButton.rest.background,
    '--radioButtonPillBorderDisabled':
      DarkSemanticColors.radioButton.circle.borderDisabled,
    '--radioButtonPillCheckedHover':
      DarkSemanticColors.radioButton.pill.checkedHover,
    '--radioButtonPillUncheckedDisabled':
      DarkSemanticColors.radioButton.pill.uncheckedDisabled,
    '--radioButtonPillUncheckedHover':
      DarkSemanticColors.radioButton.pill.uncheckedHover,
    '--radioButtonPillDisabled': DarkSemanticColors.radioButton.pill.disabled,
    '--radioButtonThumbUnchecked':
      DarkSemanticColors.radioButton.circle.uncheckedRest,
    '--radioButtonThumbUncheckedDisabled':
      DarkSemanticColors.radioButton.pill.disabled,
    '--radioButtonThumbCheckedDisabled':
      DarkSemanticColors.radioButton.circle.checkedDisabled,
    '--rowBorder': DarkSemanticColors.detailsRow.border,
    '--tabHover': DarkSemanticColors.tabs.hover,
    '--variantBorder': CommonSemanticColors.dividers.lineSeparator,
    // extended
    '--controlAccent': DarkSemanticColors.controlOutlines.accent,
    '--controlOutline': DarkSemanticColors.controlOutlines.rest,
    '--controlOutlineDisabled': DarkSemanticColors.controlOutlines.disabled,
    '--controlOutlineHovered': DarkSemanticColors.controlOutlines.hover,
    '--iconButtonBackground': StyleConstants.transparent,
    '--iconButtonFill': DarkSemanticColors.primaryButton.rest.background,
    '--iconButtonFillHovered':
      DarkSemanticColors.primaryButton.hover.background,
    '--labelText': DarkSemanticColors.text.label,
    '--statusErrorBackground': DarkSemanticColors.statusBar.error,
    '--statusErrorText': DarkSemanticColors.text.body,
    '--statusErrorIcon': CommonSemanticColors.icons.error,
    '--statusInformationBackground': DarkSemanticColors.statusBar.information,
    '--statusInformationText': DarkSemanticColors.text.body,
    '--statusInformationIcon': CommonSemanticColors.icons.information,
    '--statusSuccessBackground': DarkSemanticColors.statusBar.okay,
    '--statusSuccessText': DarkSemanticColors.text.body,
    '--statusSuccessIcon': CommonSemanticColors.icons.okay,
    '--statusWarningBackground': DarkSemanticColors.statusBar.warning,
    '--statusWarningText': DarkSemanticColors.text.body,
    '--statusWarningIcon': CommonSemanticColors.icons.warning,
    '--teachingBubbleBackground':
      DarkSemanticColors.teachingBubble.rest.background,
    '--teachingBubblePrimaryButtonHover':
      DarkSemanticColors.teachingBubble.hover.primaryButtonBackground,
    '--teachingBubbleSecondaryBackground':
      DarkSemanticColors.teachingBubble.rest.secondaryBackround,
    '--teachingBubbleText': DarkSemanticColors.teachingBubble.rest.text,
    '--textFieldBorderDisabled':
      DarkSemanticColors.primaryButton.disabled.border,
    // temporary work around for high contrast themes
    '--choiceGroupContainerBorder': '0px',
    '--choiceGroupContainerBorderStyle': 'solid',
    '--listUnderline': 'none',
    '--linkBorderStyle': 'dashed',

    '--bodyBackground': '#1b1a19'
  }
};

export const highContrastDark: Theme = {
  name: 'highContrastDark',
  properties: {
    '--color': HighContrastDarkSemanticColors.background,
    '--highlightBlue': '#2899f5',
    '--solutionButtonBackground':
      DarkSemanticColors.secondaryButton.rest.background,
    '--proactiveTopMenuButton': '#605e5c',
    '--notificationBarBackground': '#323130',
    '--listAnalysisBackground': HighContrastDarkSemanticColors.background,
    '--sectionTitle': 'white',
    '--summaryText': 'white',
    '--cardHovered': '#323130',
    '--cardTileKeywords': 'white',
    '--tileHomepageHoverBackground': '#323130',
    '--homeBannerPreview': '#323130',
    '--homeBannerProd': '#323130',
    '--bannerHovered': '#0ff',
    '--panelBorder': '#ffffff',
    '--cardViewTitle': '#bbb',
    '--genieSystemMessageBackgroundColor': '#605e5c',
    '--homeBannerBackground': 'rgb(107 81 121)',
    '--timePickerStr': 'white',
    '--inputGroupBorder': '#cccccc',
    '--dropdownLabel': 'white',
    '--listHeader': 'white',
    '--mainContainerBackground': '#565454',
    '--utterancesLink': '#ab6dd8',
    '--activeIssueMessageBarBGColor': 'rgb(189 114 121)',
    '--resolvedIssueMessageBarBGColor': 'rgb(172 138 19)',
    '--commIssueTitle': 'white',
    '--imageLabel': '#45eb42',
    '--messageBarBackground': '#444649',
    '--messageBarIconColor': 'rgb(127 157 197)',
    '--imgButtonBackground': 'darkgray',
    '--recommendationInfoBg': '#5d5d5d',
    '--diagnosticInfoBg': '#5d5d5d',
    '--menuItemText': HighContrastDarkSemanticColors.text.hyperlink,
    '--borderBottom': HighContrastDarkSemanticColors.background,
    '--mainSiderBar': HighContrastDarkSemanticColors.background,
    '--bodyDivider': CommonSemanticColors.dividers.lineSeparator,
    '--bodyText': HighContrastDarkSemanticColors.text.body,
    '--bodyTextHovered': HighContrastDarkSemanticColors.text.bodyHovered,
    '--buttonBackground':
      HighContrastDarkSemanticColors.secondaryButton.rest.background,
    '--buttonBackgroundChecked':
      HighContrastDarkSemanticColors.secondaryButton.pressed.background,
    '--buttonBackgroundCheckedHovered':
      HighContrastDarkSemanticColors.secondaryButton.hover.background,
    '--buttonBackgroundDisabled':
      HighContrastDarkSemanticColors.disabledButton.background,
    '--buttonBackgroundHovered':
      HighContrastDarkSemanticColors.secondaryButton.hover.background,
    '--buttonBackgroundPressed':
      HighContrastDarkSemanticColors.secondaryButton.pressed.background,
    '--ButtonBorderDisabled':
      HighContrastDarkSemanticColors.disabledButton.background,
    '--buttonText': HighContrastDarkSemanticColors.secondaryButton.rest.text,
    '--buttonTextChecked':
      HighContrastDarkSemanticColors.secondaryButton.pressed.border,
    '--buttonTextCheckedHovered':
      HighContrastDarkSemanticColors.secondaryButton.hover.border,
    '--buttonTextDisabled': HighContrastDarkSemanticColors.disabledButton.text,
    '--buttonTextHovered':
      HighContrastDarkSemanticColors.secondaryButton.hover.color,
    '--buttonTextPressed':
      HighContrastDarkSemanticColors.secondaryButton.pressed.text,
    '--checkboxBackgroundChecked':
      HighContrastDarkSemanticColors.checkBox.checked.background,
    '--checkboxBackgroundHovered':
      HighContrastDarkSemanticColors.checkBox.checked.hoverBorder,
    '--checkBoxBorder': HighContrastDarkSemanticColors.checkBox.rest.border,
    '--checkboxBorderChecked':
      HighContrastDarkSemanticColors.checkBox.checked.border,
    '--checkboxBorderCheckedHovered':
      HighContrastDarkSemanticColors.checkBox.checked.hoverBorder,
    '--checkBoxCheck': HighContrastDarkSemanticColors.checkBox.rest.check,
    '--checkBoxCheckedFocus':
      HighContrastDarkSemanticColors.checkBox.rest.focus,
    '--checkBoxCheckHover': HighContrastDarkSemanticColors.checkBox.rest.hover,
    '--checkBoxDisabled':
      HighContrastDarkSemanticColors.checkBox.disabled.border,
    '--checkBoxIndeterminateBackground':
      HighContrastDarkSemanticColors.checkBox.rest.check,
    '--choiceGroupUncheckedDotHover':
      HighContrastDarkSemanticColors.choiceGroup.circle.hover,
    '--commandBarBorder': HighContrastDarkSemanticColors.commandBar.border,
    '--datePickerDisabledBorder':
      HighContrastDarkSemanticColors.datePicker.disabled.border,
    '--datePickerSelectionBackground':
      HighContrastDarkSemanticColors.datePicker.rest.selected,
    '--datePickerSelectionText':
      HighContrastDarkSemanticColors.datePicker.rest.text,
    '--disabledBackground': CommonSemanticColors.backgrounds.disabled,
    '--disabledBodyText': HighContrastDarkSemanticColors.text.disabled,
    '--errorBackground': HighContrastDarkSemanticColors.controlOutlines.error,
    '--errorText': HighContrastDarkSemanticColors.text.error,
    '--focusBorder': HighContrastDarkSemanticColors.controlOutlines.accent,
    '--inputBackground': HighContrastDarkSemanticColors.background,
    '--inputBorder': HighContrastDarkSemanticColors.secondaryButton.rest.border,
    '--inputBorderHovered':
      HighContrastDarkSemanticColors.secondaryButton.hover.border,
    '--inputBorderPressed':
      HighContrastDarkSemanticColors.secondaryButton.pressed.border,
    '--inputPlaceholderText': HighContrastDarkSemanticColors.text.placeholder,
    '--inputText': HighContrastDarkSemanticColors.text.value,
    '--link': HighContrastDarkSemanticColors.text.hyperlink,
    '--linkBackgroundHovered':
      HighContrastDarkSemanticColors.text.hyperlinkBackgroundHovered,
    '--linkHovered': HighContrastDarkSemanticColors.text.hyperlinkHovered,
    '--listBackground': HighContrastDarkSemanticColors.background,
    '--listHeaderBackgroundPressed': HighContrastDarkSemanticColors.item.hover,
    '--listItemBackgroundChecked': HighContrastDarkSemanticColors.item.select,
    '--listItemBackgroundCheckedHovered':
      HighContrastDarkSemanticColors.item.select,
    '--listItemBackgroundHovered': HighContrastDarkSemanticColors.item.hover,
    '--sideMenuItemBackgroundSelected': DarkSemanticColors.item.hover,
    '--listItemBackgroundSelected': HighContrastDarkSemanticColors.item.hover,
    '--listItemBackgroundSelectedHovered':
      HighContrastDarkSemanticColors.item.selectHovered,
    '--listText': HighContrastDarkSemanticColors.text.body,
    '--menuItemBackgroundHovered': HighContrastDarkSemanticColors.item.hover,
    '--menuItemBackgroundPressed': HighContrastDarkSemanticColors.item.select,
    '--primaryButtonBackground':
      HighContrastDarkSemanticColors.primaryButton.rest.background,
    '--primaryButtonBackgroundDisabled':
      HighContrastDarkSemanticColors.disabledButton.background,
    '--primaryButtonBackgroundHovered':
      HighContrastDarkSemanticColors.primaryButton.hover.background,
    '--primaryButtonBackgroundPressed':
      HighContrastDarkSemanticColors.primaryButton.pressed.background,
    '--primaryButtonBorder':
      HighContrastDarkSemanticColors.primaryButton.rest.border,
    '--primaryButtonBorderDisabled':
      HighContrastDarkSemanticColors.primaryButton.disabled.border,
    '--primaryButtonText':
      HighContrastDarkSemanticColors.primaryButton.rest.text,
    '--primaryButtonTextDisabled':
      HighContrastDarkSemanticColors.disabledButton.text,
    '--primaryButtonTextFocused':
      HighContrastDarkSemanticColors.primaryButton.focus.text,
    '--primaryButtonTextHovered':
      HighContrastDarkSemanticColors.primaryButton.hover.text,
    '--primaryButtonTextPressed':
      HighContrastDarkSemanticColors.primaryButton.pressed.text,
    '--primaryCompoundButtonBorder':
      HighContrastDarkSemanticColors.primaryButton.rest.background,
    '--radioButtonPillBorderDisabled':
      HighContrastDarkSemanticColors.radioButton.circle.borderDisabled,
    '--radioButtonPillCheckedHover':
      HighContrastDarkSemanticColors.radioButton.pill.checkedHover,
    '--radioButtonPillUncheckedDisabled':
      HighContrastDarkSemanticColors.radioButton.pill.uncheckedDisabled,
    '--radioButtonPillUncheckedHover':
      HighContrastDarkSemanticColors.radioButton.pill.uncheckedHover,
    '--radioButtonPillDisabled':
      HighContrastDarkSemanticColors.radioButton.pill.disabled,
    '--radioButtonThumbUnchecked':
      HighContrastDarkSemanticColors.radioButton.circle.uncheckedRest,
    '--radioButtonThumbUncheckedDisabled':
      HighContrastDarkSemanticColors.radioButton.pill.disabled,
    '--radioButtonThumbCheckedDisabled':
      HighContrastDarkSemanticColors.radioButton.circle.checkedDisabled,
    '--rowBorder': HighContrastDarkSemanticColors.detailsRow.border,
    '--tabHover': HighContrastDarkSemanticColors.tabs.hover,
    '--variantBorder': CommonSemanticColors.dividers.lineSeparator,
    // extended
    '--controlAccent': HighContrastDarkSemanticColors.controlOutlines.accent,
    '--controlOutline': HighContrastDarkSemanticColors.controlOutlines.rest,
    '--controlOutlineDisabled':
      HighContrastDarkSemanticColors.controlOutlines.disabled,
    '--controlOutlineHovered':
      HighContrastDarkSemanticColors.controlOutlines.hover,
    '--iconButtonBackground': StyleConstants.transparent,
    '--iconButtonFill':
      HighContrastDarkSemanticColors.primaryButton.rest.background,
    '--iconButtonFillHovered':
      HighContrastDarkSemanticColors.primaryButton.hover.background,
    '--labelText': HighContrastDarkSemanticColors.text.label,
    '--statusErrorBackground': HighContrastDarkSemanticColors.statusBar.error,
    '--statusErrorText': HighContrastDarkSemanticColors.text.body,
    '--statusErrorIcon': CommonSemanticColors.icons.error,
    '--statusInformationBackground':
      HighContrastDarkSemanticColors.statusBar.information,
    '--statusInformationText': HighContrastDarkSemanticColors.text.body,
    '--statusInformationIcon': CommonSemanticColors.icons.information,
    '--statusSuccessBackground': HighContrastDarkSemanticColors.statusBar.okay,
    '--statusSuccessText': HighContrastDarkSemanticColors.text.body,
    '--statusSuccessIcon': CommonSemanticColors.icons.okay,
    '--statusWarningBackground':
      HighContrastDarkSemanticColors.statusBar.warning,
    '--statusWarningText': HighContrastDarkSemanticColors.text.body,
    '--statusWarningIcon': CommonSemanticColors.icons.warning,
    '--teachingBubbleBackground':
      HighContrastDarkSemanticColors.teachingBubble.rest.background,
    '--teachingBubblePrimaryButtonHover':
      HighContrastDarkSemanticColors.teachingBubble.hover
        .primaryButtonBackground,
    '--teachingBubbleSecondaryBackground':
      HighContrastDarkSemanticColors.teachingBubble.rest.secondaryBackround,
    '--teachingBubbleText':
      HighContrastDarkSemanticColors.teachingBubble.rest.text,
    '--textFieldBorderDisabled':
      HighContrastDarkSemanticColors.primaryButton.disabled.border,
    // temporary work around for high contrast themes
    '--choiceGroupContainerBorder': '0px',
    '--choiceGroupContainerBorderStyle': 'solid',
    '--listUnderline': 'none',
    '--linkBorderStyle': 'dashed',

    '--bodyBackground': HighContrastDarkSemanticColors.background
  }
};

export const highContrastLight: Theme = {
  name: 'highContrastLight',
  properties: {
    '--color': HighContrastLightSemanticColors.background,
    '--solutionButtonBackground': '#f1f1f1',
    '--highlightBlue': '#286090',
    '--proactiveTopMenuButton': '#ddd',
    '--notificationBarBackground': '#FEF0F1',
    '--listAnalysisBackground': '#f9f9f9',
    '--imageLabel': 'green',
    '--sectionTitle': '#323130',
    '--summaryText': '#605E5C',
    '--cardHovered': '#323130',
    '--cardTileKeywords': '#605E5C',
    '--tileHomepageHoverBackground': '#f3f2f1',
    '--homeBannerPreview': '#F0F6FF',
    '--homeBannerProd': 'rgba(0, 120, 212, 0.1)',
    '--bannerHovered': '#0ff',
    '--borderBottom': '#ccc',
    '--mainSiderBar': '#ffffff',
    '--dropdownLabel': '#6b6969',
    '--cardViewTitle': '#646464',
    '--utterancesLink': 'indigo',
    '--sideMenuItemBackgroundSelected': 'rgba(0,137,250,.1)',
    '--genieSystemMessageBackgroundColor': 'rgba(0, 0, 0, 0.06)',
    '--homeBannerBackground': 'rgba(215, 172, 237,1)',
    '--timePickerStr': '#605E5C',
    '--inputGroupBorder': '#cccccc',
    '--mainContainerBackground': '#E5E5E5',
    '--listHeader': '#666',
    '--activeIssueMessageBarBGColor': 'rgb(253, 231, 233)',
    '--resolvedIssueMessageBarBGColor': 'rgb(255 244 206)',
    '--commIssueTitle': '#3c3c3c',
    '--messageBarBackground': '#F0F6FF',
    '--messageBarIconColor': '#015CDA',
    '--imgButtonBackground': 'white',
    '--recommendationInfoBg': 'rgb(240, 246, 255)',
    '--diagnosticInfoBg': 'rgb(249, 243, 252)',
    '--menuItemText': HighContrastLightSemanticColors.text.hyperlink,
    '--panelBorder':
      HighContrastLightSemanticColors.secondaryButton.rest.border,
    '--bodyDivider': CommonSemanticColors.dividers.lineSeparator,
    '--bodyText': HighContrastLightSemanticColors.text.body,
    '--bodyTextHovered': HighContrastLightSemanticColors.text.bodyHovered,
    '--buttonBackground':
      HighContrastLightSemanticColors.secondaryButton.rest.background,
    '--buttonBackgroundChecked':
      HighContrastLightSemanticColors.secondaryButton.pressed.background,
    '--buttonBackgroundCheckedHovered':
      HighContrastLightSemanticColors.secondaryButton.hover.background,
    '--buttonBackgroundDisabled':
      HighContrastLightSemanticColors.disabledButton.background,
    '--buttonBackgroundHovered':
      HighContrastLightSemanticColors.secondaryButton.hover.background,
    '--buttonBackgroundPressed':
      HighContrastLightSemanticColors.secondaryButton.pressed.background,
    '--ButtonBorderDisabled':
      HighContrastLightSemanticColors.disabledButton.background,
    '--buttonText': HighContrastLightSemanticColors.secondaryButton.rest.text,
    '--buttonTextChecked':
      HighContrastLightSemanticColors.secondaryButton.pressed.border,
    '--buttonTextCheckedHovered':
      HighContrastLightSemanticColors.secondaryButton.hover.border,
    '--buttonTextDisabled': HighContrastLightSemanticColors.disabledButton.text,
    '--buttonTextHovered':
      HighContrastLightSemanticColors.secondaryButton.hover.color,
    '--buttonTextPressed':
      HighContrastLightSemanticColors.secondaryButton.pressed.text,
    '--checkboxBackgroundChecked':
      HighContrastLightSemanticColors.checkBox.checked.background,
    '--checkboxBackgroundHovered':
      HighContrastLightSemanticColors.checkBox.checked.hoverBorder,
    '--checkBoxBorder': HighContrastLightSemanticColors.checkBox.rest.border,
    '--checkboxBorderChecked':
      HighContrastLightSemanticColors.checkBox.checked.border,
    '--checkboxBorderCheckedHovered':
      HighContrastLightSemanticColors.checkBox.checked.hoverBorder,
    '--checkBoxCheck': HighContrastLightSemanticColors.checkBox.rest.check,
    '--checkBoxCheckedFocus':
      HighContrastLightSemanticColors.checkBox.rest.focus,
    '--checkBoxCheckHover': HighContrastLightSemanticColors.checkBox.rest.hover,
    '--checkBoxDisabled':
      HighContrastLightSemanticColors.checkBox.disabled.border,
    '--checkBoxIndeterminateBackground':
      HighContrastLightSemanticColors.checkBox.rest.check,
    '--choiceGroupUncheckedDotHover':
      HighContrastLightSemanticColors.choiceGroup.circle.hover,
    '--commandBarBorder': HighContrastLightSemanticColors.commandBar.border,
    '--datePickerDisabledBorder':
      HighContrastLightSemanticColors.datePicker.disabled.border,
    '--datePickerSelectionBackground':
      HighContrastLightSemanticColors.datePicker.rest.selected,
    '--datePickerSelectionText':
      HighContrastLightSemanticColors.datePicker.rest.text,
    '--disabledBackground': CommonSemanticColors.backgrounds.disabled,
    '--disabledBodyText': HighContrastLightSemanticColors.text.disabled,
    '--errorBackground': HighContrastLightSemanticColors.controlOutlines.error,
    '--errorText': HighContrastLightSemanticColors.text.error,
    '--focusBorder': HighContrastLightSemanticColors.controlOutlines.accent,
    '--inputBackground': HighContrastLightSemanticColors.background,
    '--inputBorder':
      HighContrastLightSemanticColors.secondaryButton.rest.border,
    '--inputBorderHovered':
      HighContrastLightSemanticColors.secondaryButton.hover.border,
    '--inputBorderPressed':
      HighContrastLightSemanticColors.secondaryButton.pressed.border,
    '--inputPlaceholderText': HighContrastLightSemanticColors.text.placeholder,
    '--inputText': HighContrastLightSemanticColors.text.value,
    '--link': HighContrastLightSemanticColors.text.hyperlink,
    '--linkBackgroundHovered':
      HighContrastLightSemanticColors.text.hyperlinkBackgroundHovered,
    '--linkHovered': HighContrastLightSemanticColors.text.hyperlinkHovered,
    '--listBackground': HighContrastLightSemanticColors.background,
    '--listHeaderBackgroundPressed': HighContrastLightSemanticColors.item.hover,
    '--listItemBackgroundChecked': HighContrastLightSemanticColors.item.select,
    '--listItemBackgroundCheckedHovered':
      HighContrastLightSemanticColors.item.select,
    '--listItemBackgroundHovered': HighContrastLightSemanticColors.item.hover,
    '--listItemBackgroundSelected': HighContrastLightSemanticColors.item.hover,
    '--listItemBackgroundSelectedHovered':
      HighContrastLightSemanticColors.item.selectHovered,
    '--listText': HighContrastLightSemanticColors.text.body,
    '--menuItemBackgroundHovered': HighContrastLightSemanticColors.item.hover,
    '--menuItemBackgroundPressed': HighContrastLightSemanticColors.item.select,
    '--primaryButtonBackground':
      HighContrastLightSemanticColors.primaryButton.rest.background,
    '--primaryButtonBackgroundDisabled':
      HighContrastLightSemanticColors.disabledButton.background,
    '--primaryButtonBackgroundHovered':
      HighContrastLightSemanticColors.primaryButton.hover.background,
    '--primaryButtonBackgroundPressed':
      HighContrastLightSemanticColors.primaryButton.pressed.background,
    '--primaryButtonBorder':
      HighContrastLightSemanticColors.primaryButton.rest.border,
    '--primaryButtonBorderDisabled':
      HighContrastLightSemanticColors.primaryButton.disabled.border,
    '--primaryButtonText':
      HighContrastLightSemanticColors.primaryButton.rest.text,
    '--primaryButtonTextDisabled':
      HighContrastLightSemanticColors.disabledButton.text,
    '--primaryButtonTextFocused':
      HighContrastLightSemanticColors.primaryButton.focus.text,
    '--primaryButtonTextHovered':
      HighContrastLightSemanticColors.primaryButton.hover.text,
    '--primaryButtonTextPressed':
      HighContrastLightSemanticColors.primaryButton.pressed.text,
    '--primaryCompoundButtonBorder':
      HighContrastLightSemanticColors.primaryButton.rest.background,
    '--radioButtonPillBorderDisabled':
      HighContrastLightSemanticColors.radioButton.circle.borderDisabled,
    '--radioButtonPillCheckedHover':
      HighContrastLightSemanticColors.radioButton.pill.checkedHover,
    '--radioButtonPillUncheckedDisabled':
      HighContrastLightSemanticColors.radioButton.pill.uncheckedDisabled,
    '--radioButtonPillUncheckedHover':
      HighContrastLightSemanticColors.radioButton.pill.uncheckedHover,
    '--radioButtonPillDisabled':
      HighContrastLightSemanticColors.radioButton.pill.disabled,
    '--radioButtonThumbUnchecked':
      HighContrastLightSemanticColors.radioButton.circle.uncheckedRest,
    '--radioButtonThumbUncheckedDisabled':
      HighContrastLightSemanticColors.radioButton.pill.disabled,
    '--radioButtonThumbCheckedDisabled':
      HighContrastLightSemanticColors.radioButton.circle.checkedDisabled,
    '--rowBorder': HighContrastLightSemanticColors.detailsRow.border,
    '--tabHover': HighContrastLightSemanticColors.tabs.hover,
    '--variantBorder': CommonSemanticColors.dividers.lineSeparator,
    // extended
    '--controlAccent': HighContrastLightSemanticColors.controlOutlines.accent,
    '--controlOutline': HighContrastLightSemanticColors.controlOutlines.rest,
    '--controlOutlineDisabled':
      HighContrastLightSemanticColors.controlOutlines.disabled,
    '--controlOutlineHovered':
      HighContrastLightSemanticColors.controlOutlines.hover,
    '--iconButtonBackground': StyleConstants.transparent,
    '--iconButtonFill':
      HighContrastLightSemanticColors.primaryButton.rest.background,
    '--iconButtonFillHovered':
      HighContrastLightSemanticColors.primaryButton.hover.background,
    '--labelText': HighContrastLightSemanticColors.text.label,
    '--statusErrorBackground': HighContrastLightSemanticColors.statusBar.error,
    '--statusErrorText': HighContrastLightSemanticColors.text.body,
    '--statusErrorIcon': CommonSemanticColors.icons.error,
    '--statusInformationBackground':
      HighContrastLightSemanticColors.statusBar.information,
    '--statusInformationText': HighContrastLightSemanticColors.text.body,
    '--statusInformationIcon': CommonSemanticColors.icons.information,
    '--statusSuccessBackground': HighContrastLightSemanticColors.statusBar.okay,
    '--statusSuccessText': HighContrastLightSemanticColors.text.body,
    '--statusSuccessIcon': CommonSemanticColors.icons.okay,
    '--statusWarningBackground':
      HighContrastLightSemanticColors.statusBar.warning,
    '--statusWarningText': HighContrastLightSemanticColors.text.body,
    '--statusWarningIcon': CommonSemanticColors.icons.warning,
    '--teachingBubbleBackground':
      HighContrastLightSemanticColors.teachingBubble.rest.background,
    '--teachingBubblePrimaryButtonHover':
      HighContrastLightSemanticColors.teachingBubble.hover
        .primaryButtonBackground,
    '--teachingBubbleSecondaryBackground':
      HighContrastLightSemanticColors.teachingBubble.rest.secondaryBackround,
    '--teachingBubbleText':
      HighContrastLightSemanticColors.teachingBubble.rest.text,
    '--textFieldBorderDisabled':
      HighContrastLightSemanticColors.primaryButton.disabled.border,
    // temporary work around for high contrast themes
    '--choiceGroupContainerBorder': '0px',
    '--choiceGroupContainerBorderStyle': 'solid',
    '--listUnderline': 'none',
    '--linkBorderStyle': 'dashed',

    '--bodyBackground': HighContrastLightSemanticColors.background
  }
};
