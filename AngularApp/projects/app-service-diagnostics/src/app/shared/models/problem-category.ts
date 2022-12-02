import { OperatingSystem } from './site';
import { AppType } from './portal';
import { Sku } from './server-farm';

export class Category {
  Name: string;
  Subcategories: Subcategory[];
  Collapsed: boolean = true;
  BgColor: string;
  TextColor: string;
}

export class Subcategory {
  Name: string;
  BgColor: string;
  TextColor: string;
  Href: string;
  OperatingSystem: OperatingSystem;
  AppType: AppType;
  AppStack: string;
  Sku: Sku;
}
