import { NgModule, ModuleWithProviders } from '@angular/core';
import {
    FabBreadcrumbModule,
    FabButtonModule,
    FabCalendarModule,
    FabCalloutModule,
    FabCheckboxModule,
    FabChoiceGroupModule,
    FabComboBoxModule,
    FabCommandBarModule,
    FabDatePickerModule,
    FabDetailsListModule,
    FabDialogModule,
    FabDividerModule,
    FabFabricModule,
    FabDropdownModule,
    FabGroupModule,
    FabGroupedListModule,
    FabHoverCardModule,
    FabIconModule,
    FabImageModule,
    FabLinkModule,
    FabMarqueeSelectionModule,
    FabMessageBarModule,
    FabModalModule,
    FabPanelModule,
    FabPersonaModule,
    FabPivotModule,
    FabSearchBoxModule,
    FabShimmerModule,
    FabSliderModule,
    FabSpinnerModule,
    FabToggleModule,
    FabTooltipModule,
    FabSpinButtonModule,
    FabTextFieldModule,
    FabPeoplePickerModule,
    FabTagPickerModule,
    FabProgressIndicatorModule,
    FabContextualMenuModule
} from '@angular-react/fabric';
import { FabricFeedbackComponent } from '../fabric-ui/components/fabric-feedback/fabric-feedback.component';
import { FabricSearchResultsComponent } from '../fabric-ui/components/fabric-search-results/fabric-search-results.component';
import { DetectorCommandBarComponent } from '../fabric-ui/components/detector-command-bar/detector-command-bar.component';
import { CategorySummaryComponent } from '../fabric-ui/components/category-summary/category-summary.component';
import { CategoryOverviewComponent } from '../fabric-ui/components/category-overview/category-overview.component';
import { CategoryNavComponent } from '../home/components/category-nav/category-nav.component';
import { SectionDividerComponent } from '../home/components/section-divider/section-divider.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DiagnosticDataModule } from 'diagnostic-data';
import { CollapsibleMenuItemComponent } from '../home/components/collapsible-menu-item/collapsible-menu-item.component';
import { SearchPipe, SearchMatchPipe } from '../home/components/pipes/search.pipe';
import { DiagosticSessionsPanelComponent } from './components/diagostic-sessions-panel/diagostic-sessions-panel.component';
import { SharedModule } from '../shared/shared.module';
import { CreateStorageAccountPanelComponent } from './components/create-storage-account-panel/create-storage-account-panel.component';
import { CallstackPanelComponent } from './components/callstack-panel/callstack-panel.component';

@NgModule({
    declarations: [
        FabricSearchResultsComponent,
        FabricFeedbackComponent,
        DetectorCommandBarComponent,
        CategorySummaryComponent,
        CategoryOverviewComponent,
        CategoryNavComponent,
        SectionDividerComponent,
        CollapsibleMenuItemComponent,
        SearchPipe,
        SearchMatchPipe,
        DiagosticSessionsPanelComponent,
        CreateStorageAccountPanelComponent,
        CallstackPanelComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        FabIconModule,
        FabChoiceGroupModule,
        FabFabricModule,
        FabIconModule,
        FabButtonModule,
        FabDialogModule,
        FabImageModule,
        FabDropdownModule,
        FabPanelModule,
        FabCommandBarModule,
        FabBreadcrumbModule,
        FabCalloutModule,
        FabCheckboxModule,
        FabChoiceGroupModule,
        FabComboBoxModule,
        FabGroupedListModule,
        FabDatePickerModule,
        FabDividerModule,
        FabSpinnerModule,
        FabToggleModule,
        FabPersonaModule,
        FabPivotModule,
        FabLinkModule,
        FabMessageBarModule,
        FabHoverCardModule,
        FabModalModule,
        FabTooltipModule,
        FabShimmerModule,
        FabSliderModule,
        FabSearchBoxModule,
        FabCalendarModule,
        FabDetailsListModule,
        FabGroupModule,
        FabMarqueeSelectionModule,
        FabSpinButtonModule,
        FabTextFieldModule,
        FabPeoplePickerModule,
        FabTagPickerModule,
        FabProgressIndicatorModule,
        // FabNavModule,
        FabContextualMenuModule,
        DiagnosticDataModule,
        SharedModule
    ],
    exports: [
        FabricSearchResultsComponent,
        FabricFeedbackComponent,
        DetectorCommandBarComponent,
        CategorySummaryComponent,
        CategoryOverviewComponent,
        CategoryNavComponent,
        SectionDividerComponent,
        CollapsibleMenuItemComponent
    ],
    providers: [
    ]
})
export class FabricModule {
}
