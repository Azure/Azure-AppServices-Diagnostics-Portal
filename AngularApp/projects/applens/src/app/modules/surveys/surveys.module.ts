import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TakeSurveyComponent } from './components/takesurvey/takesurvey.component';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { FormsModule } from '@angular/forms';
import {SurveysService} from "./services/surveys.service";
import { HttpClientModule } from '@angular/common/http';
import { FabButtonModule } from '@angular-react/fabric/lib/components/button';
import { FabChoiceGroupModule } from '@angular-react/fabric/lib/components/choice-group';
import { FabTextFieldModule } from '@angular-react/fabric/lib/components/text-field';
import { FabDropdownModule } from '@angular-react/fabric/lib/components/dropdown';
import { FabPanelModule } from '@angular-react/fabric/lib/components/panel';


export const SurveysModuleRoutes : ModuleWithProviders<SurveysModule> = RouterModule.forChild([
  {
    path: '',
    component: TakeSurveyComponent
  }
]);

@NgModule({
  imports: [
    CommonModule,
    SurveysModuleRoutes,
    SharedModule,
    HttpClientModule,
    FormsModule,
    FabButtonModule, FabChoiceGroupModule, FabTextFieldModule, FabDropdownModule, FabPanelModule
  ],
  providers: [SurveysService],
  declarations: [TakeSurveyComponent]
})
export class SurveysModule { }
