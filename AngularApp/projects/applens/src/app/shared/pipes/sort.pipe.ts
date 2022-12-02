import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'sort' })
export class Sort implements PipeTransform {
  transform(value: any[], attr: string, reverse: boolean): any[] {
    if (reverse) {
      return value.sort((a, b) => {
        return b[attr] - a[attr];
      });
    } else {
      return value.sort((a, b) => {
        return a[attr] - b[attr];
      });
    }
  }
}
