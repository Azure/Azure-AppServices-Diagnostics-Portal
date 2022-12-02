import { PipeTransform, Pipe } from '@angular/core';

@Pipe({ name: 'mapValues' })
export class MapValuesPipe implements PipeTransform {
  transform(value: any, args?: any[]): Object[] {
    const returnArray = [];

    value.forEach((entryVal, entryKey) => {
      returnArray.push({
        key: entryKey,
        val: entryVal
      });
    });

    return returnArray;
  }
}
