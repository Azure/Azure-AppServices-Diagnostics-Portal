import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CollapsibleMenuComponent } from './components/collapsible-menu/collapsible-menu.component';
import { CollapsibleMenuItemComponent } from './components/collapsible-menu-item/collapsible-menu-item.component';
import { SectionDividerComponent } from './components/section-divider/section-divider.component';
import { SearchBoxComponent } from './components/search-box/search-box.component';
import { MenuScrollComponent } from './components/menu-scroll/menu-scroll.component';
import { SearchPipe, SearchMatchPipe } from './pipes/search.pipe';
import { FabIconModule } from '@angular-react/fabric/lib/components/icon';
import { FabTooltipModule } from '@angular-react/fabric/lib/components/tooltip';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FabIconModule,
    FabTooltipModule
  ],
  declarations: [CollapsibleMenuComponent, CollapsibleMenuItemComponent, SectionDividerComponent, SearchBoxComponent, MenuScrollComponent, SearchPipe, SearchMatchPipe],
  exports: [CollapsibleMenuComponent, CollapsibleMenuItemComponent, SectionDividerComponent, SearchBoxComponent, MenuScrollComponent, SearchPipe],
  providers: [SearchPipe]
})
export class CollapsibleMenuModule { }
