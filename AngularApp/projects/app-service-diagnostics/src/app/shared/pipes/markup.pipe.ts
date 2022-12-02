import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'markup' })
export class MarkupPipe implements PipeTransform {
  transform(value: string): any {
    if (!value) {
      return value;
    }

    value = value.replace(/\[sitename\]\'(\w+)\'/, '<b>$1</b>');
    value = value.replace(/\[instance\]\'(\w+)\'/, '<b>$1</b>');
    value = value.replace(/\[number\]\'(\w+)\'/, '$1');
    value = value.replace(
      /\[countername\]\'([a-zA-Z\s\/]+)\'/,
      "<b style='color=#32247b'>$1</b>"
    );

    return value;
  }
}
