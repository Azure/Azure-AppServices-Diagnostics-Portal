import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CollapsibleMenuComponent } from './components/collapsible-menu/collapsible-menu.component';
import { CollapsibleMenuItemComponent } from './components/collapsible-menu-item/collapsible-menu-item.component';
import { SectionDividerComponent } from './components/section-divider/section-divider.component';
import { SearchBoxComponent } from './components/search-box/search-box.component';
import { MenuScrollComponent } from './components/menu-scroll/menu-scroll.component';
import { SearchPipe, SearchMatchPipe } from './pipes/search.pipe';
import { FabIconModule, FabTooltipModule } from '@angular-react/fabric';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    FabIconModule,
    FabTooltipModule
  ],
  declarations: [CollapsibleMenuComponent, CollapsibleMenuItemComponent, SectionDividerComponent, SearchBoxComponent, MenuScrollComponent, SearchPipe, SearchMatchPipe],
  exports: [CollapsibleMenuComponent, CollapsibleMenuItemComponent, SectionDividerComponent, SearchBoxComponent, MenuScrollComponent, SearchPipe],
  providers: [SearchPipe]
})
export class CollapsibleMenuModule { }
