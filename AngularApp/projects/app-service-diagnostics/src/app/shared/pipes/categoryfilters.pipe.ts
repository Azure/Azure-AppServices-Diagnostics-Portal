import { Pipe, PipeTransform } from '@angular/core';
import { Subcategory } from '../models/problem-category';
import { AppType } from '../models/portal';
import { OperatingSystem } from '../models/site';
import { Sku } from '../models/server-farm';

@Pipe({ name: 'toolstack' })
export class ToolStackPipe implements PipeTransform {
  transform(subcategories: Subcategory[], stack: string): Subcategory[] {
    return subcategories.filter(
      (x) =>
        x.AppStack === '' ||
        x.AppStack.toLowerCase().indexOf(stack.toLowerCase()) > -1
    );
  }
}

@Pipe({ name: 'platformfilter' })
export class PlatformPipe implements PipeTransform {
  transform(
    subcategories: Subcategory[],
    platform: OperatingSystem
  ): Subcategory[] {
    return subcategories.filter((x) => x.OperatingSystem & platform);
  }
}

@Pipe({ name: 'apptype' })
export class AppTypePipe implements PipeTransform {
  transform(subcategories: Subcategory[], appType: AppType): Subcategory[] {
    return subcategories.filter((x) => !appType || x.AppType & appType);
  }
}

@Pipe({ name: 'skufilter' })
export class SkuPipe implements PipeTransform {
  transform(subcategories: Subcategory[], sku: Sku): Subcategory[] {
    return subcategories.filter((x) => x.Sku & sku);
  }
}
