import { Injectable } from '@angular/core';
import { DefaultUrlSerializer, UrlSerializer, UrlTree } from '@angular/router';

@Injectable()
export class CustomUrlSerializerService
  extends DefaultUrlSerializer
  implements UrlSerializer
{
  parse(url: string) {
    url = url.replace(/\(/g, '%28').replace(/\)/g, '%29');
    return super.parse(url);
  }

  serialize(tree: UrlTree) {
    return super.serialize(tree).replace(/%28/g, '(').replace(/%29/g, ')');
  }
}
