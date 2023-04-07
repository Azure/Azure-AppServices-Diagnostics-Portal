import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncidentValidationComponent } from './components/incidentvalidation/incidentvalidation.component';
import { TemplateManagementComponent } from './components/template-management/template-management.component';
import { NgxSmartModalModule } from 'ngx-smart-modal';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { FormsModule } from '@angular/forms';
import { IncidentAssistanceService } from "./services/incident-assistance.service";
import { HttpClientModule } from '@angular/common/http';
import { MonacoEditorModule } from 'ngx-monaco-editor';
import { DiagnosticDataModule } from 'diagnostic-data';
import { FabButtonModule } from '@angular-react/fabric/lib/components/button';
import { FabPanelModule } from '@angular-react/fabric/lib/components/panel';
import { FabDropdownModule } from '@angular-react/fabric/lib/components/dropdown';
import { FabTextFieldModule } from '@angular-react/fabric/lib/components/text-field';
import { FabCommandBarModule } from '@angular-react/fabric/lib/components/command-bar';


export const IncidentAssistModuleRoutes: ModuleWithProviders<IncidentAssistModule> = RouterModule.forChild([
  {
    path: 'manage',
    component: TemplateManagementComponent
  },
  {
    path: ':incidentId',
    component: IncidentValidationComponent
  }
]);

@NgModule({
  imports: [
    CommonModule,
    MonacoEditorModule.forRoot(),
    NgxSmartModalModule.forRoot(),
    IncidentAssistModuleRoutes,
    SharedModule,
    HttpClientModule,
    FormsModule,
    FabButtonModule,
    FabPanelModule,
    FabDropdownModule,
    FabTextFieldModule,
    FabCommandBarModule,
    DiagnosticDataModule
  ],
  providers: [IncidentAssistanceService],
  declarations: [IncidentValidationComponent, TemplateManagementComponent]
})
export class IncidentAssistModule { }
