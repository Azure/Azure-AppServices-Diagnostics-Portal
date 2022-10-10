import { NgModule } from '@angular/core';
import { FabFabricModule } from '@angular-react/fabric/lib/components/fabric';
import { FabIconModule } from '@angular-react/fabric/lib/components/icon';
import { FabButtonModule } from '@angular-react/fabric/lib/components/button';
import { FabDialogModule } from '@angular-react/fabric/lib/components/dialog';
import { FabImageModule } from '@angular-react/fabric/lib/components/image';
import { FabDropdownModule } from '@angular-react/fabric/lib/components/dropdown';
import { FabPanelModule } from '@angular-react/fabric/lib/components/panel';
import { FabCommandBarModule } from '@angular-react/fabric/lib/components/command-bar';
import { FabBreadcrumbModule } from '@angular-react/fabric/lib/components/breadcrumb';
import { FabCheckboxModule } from '@angular-react/fabric/lib/components/checkbox';
import { FabChoiceGroupModule } from '@angular-react/fabric/lib/components/choice-group';
import { FabGroupedListModule } from '@angular-react/fabric/lib/components/grouped-list';
import { FabDatePickerModule } from '@angular-react/fabric/lib/components/date-picker';
import { FabSpinnerModule } from '@angular-react/fabric/lib/components/spinner';
import { FabToggleModule } from '@angular-react/fabric/lib/components/toggle';
import { FabPivotModule } from '@angular-react/fabric/lib/components/pivot';
import { FabLinkModule } from '@angular-react/fabric/lib/components/link';
import { FabMessageBarModule } from '@angular-react/fabric/lib/components/message-bar';
import { FabHoverCardModule } from '@angular-react/fabric/lib/components/hover-card';
import { FabModalModule } from '@angular-react/fabric/lib/components/modal';
import { FabTooltipModule } from '@angular-react/fabric/lib/components/tooltip';
import { FabSliderModule } from '@angular-react/fabric/lib/components/slider';
import { FabSearchBoxModule } from '@angular-react/fabric/lib/components/search-box';
import { FabCalendarModule } from '@angular-react/fabric/lib/components/calendar';
import { FabDetailsListModule } from '@angular-react/fabric/lib/components/details-list';
import { FabGroupModule } from '@angular-react/fabric/lib/components/group';
import { FabSpinButtonModule } from '@angular-react/fabric/lib/components/spin-button';
import { FabTextFieldModule } from '@angular-react/fabric/lib/components/text-field';
import { FabContextualMenuModule } from '@angular-react/fabric/lib/components/contextual-menu';
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
        FabCheckboxModule,
        FabChoiceGroupModule,
        FabGroupedListModule,
        FabDatePickerModule,
        FabSpinnerModule,
        FabToggleModule,
        FabPivotModule,
        FabLinkModule,
        FabMessageBarModule,
        FabHoverCardModule,
        FabModalModule,
        FabTooltipModule,
        FabSliderModule,
        FabSearchBoxModule,
        FabCalendarModule,
        FabDetailsListModule,
        FabGroupModule,
        FabSpinButtonModule,
        FabTextFieldModule,
        FabContextualMenuModule,
        DiagnosticDataModule,
        SharedModule
    ],
    exports: [
        FabricSearchResultsComponent,
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
