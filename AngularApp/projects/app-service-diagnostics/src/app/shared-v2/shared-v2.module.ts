import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from './services/notification.service';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: []
})
export class SharedV2Module {
  static forRoot(): ModuleWithProviders<SharedV2Module> {
    return {
      ngModule: SharedV2Module,
      providers: [
        NotificationService
      ]
    };
  }
}
