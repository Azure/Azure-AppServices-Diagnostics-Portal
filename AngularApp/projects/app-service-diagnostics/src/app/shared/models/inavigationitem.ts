import { Params } from '@angular/router';

export interface INavigationItem {
  title: string;
  url: string;
  params?: Params;
  isActive: boolean;
}
