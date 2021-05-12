import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MainComponent } from './main/main.component';
import { FormsModule } from '@angular/forms';
import { OwlDateTimeModule, OwlNativeDateTimeModule, OWL_DATE_TIME_FORMATS } from 'ng-pick-datetime';
import { OwlMomentDateTimeModule } from 'ng-pick-datetime-moment';
import { CUSTOM_MOMENT_FORMATS } from '../../shared/models/datetime';
import { FabDialogModule, FabButtonModule, FabTextFieldModule, FabCalloutModule, FabChoiceGroupModule, FabIconModule, FabDropdownModule } from '@angular-react/fabric';
import { DiagnosticDataModule } from 'diagnostic-data';
import { SharedModule } from '../../shared/shared.module';

export const MainModuleRoutes : ModuleWithProviders = RouterModule.forChild([
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
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    OwlMomentDateTimeModule ,
    FabButtonModule, 
    FabDialogModule,
    FabTextFieldModule,
    FabCalloutModule,
    FabChoiceGroupModule,
    FabIconModule,
    FabDropdownModule,
    DiagnosticDataModule,
    SharedModule
  ],
  providers: [{
    provide: OWL_DATE_TIME_FORMATS, 
    useValue: CUSTOM_MOMENT_FORMATS
  }],
  declarations: [MainComponent]
})
export class MainModule { }
