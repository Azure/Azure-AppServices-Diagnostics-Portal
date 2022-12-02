import { PipeTransform, Pipe } from '@angular/core';

@Pipe({
  name: 'limitToFilter'
})
export class LimitToFilter implements PipeTransform {
  transform(itemArray: any[], limitBy: number): any[] {
    return limitBy ? itemArray.slice(0, limitBy) : itemArray;
  }
}
