import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MainComponent } from './main/main.component';
import { FormsModule } from '@angular/forms';
import { DiagnosticDataModule } from 'diagnostic-data';
import { SharedModule } from '../../shared/shared.module';
import { FabButtonModule } from '@angular-react/fabric/lib/components/button';
import { FabDialogModule } from '@angular-react/fabric/lib/components/dialog';
import { FabTextFieldModule } from '@angular-react/fabric/lib/components/text-field';
import { FabCalloutModule } from '@angular-react/fabric/lib/components/callout';
import { FabChoiceGroupModule } from '@angular-react/fabric/lib/components/choice-group';
import { FabIconModule } from '@angular-react/fabric/lib/components/icon';
import { FabDropdownModule } from '@angular-react/fabric/lib/components/dropdown';
import { FabPanelModule } from '@angular-react/fabric/lib/components/panel';
import { FabSpinnerModule } from '@angular-react/fabric/lib/components/spinner';

export const MainModuleRoutes : ModuleWithProviders<MainModule> = RouterModule.forChild([
  {
    path: '',
    component: MainComponent
  }
])

@NgModule({
  imports: [
    CommonModule,
    MainModuleRoutes,
    FormsModule,
    SharedModule,
    FabButtonModule,
    FabDialogModule,
    FabTextFieldModule,
    FabCalloutModule,
    FabChoiceGroupModule,
    FabIconModule,
    FabDropdownModule,
    FabPanelModule,
    FabSpinnerModule,
    DiagnosticDataModule,
    SharedModule
  ],
  providers: [],
  declarations: [MainComponent]
})
export class MainModule { }
