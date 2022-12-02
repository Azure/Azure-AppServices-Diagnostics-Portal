import { Pipe, PipeTransform, Injectable } from '@angular/core';
import { CollapsibleMenuItem } from '../collapsible-menu-item/collapsible-menu-item.component';

@Pipe({
  name: 'search',
  pure: false
})
@Injectable()
export class SearchPipe implements PipeTransform {
  transform(items: CollapsibleMenuItem[], searchString: string) {
    return searchString && items
      ? items.filter(
          (item) =>
            item.label.toLowerCase().indexOf(searchString.toLowerCase()) >= 0
        )
      : items;
  }
}

@Pipe({
  name: 'searchmatch',
  pure: false
})
export class SearchMatchPipe implements PipeTransform {
  transform(label: string, searchString: string) {
    if (searchString) {
      let matchIndex = label.toLowerCase().indexOf(searchString.toLowerCase());
      if (matchIndex >= 0) {
        return `${label.substr(0, matchIndex)}<b>${label.substr(
          matchIndex,
          searchString.length
        )}</b>${label.substr(matchIndex + searchString.length)}`;
      }
    }

    return label;
  }
}
