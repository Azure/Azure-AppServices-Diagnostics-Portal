import { Injectable } from '@angular/core';
import * as clipboardProxy from 'copy-html-to-clipboard';

// below line is to make sure it packages correctly and runs correctly
// See: https://github.com/rollup/rollup/issues/1267 comment by epiqueras
const clipboard: any = (<any>clipboardProxy).default || clipboardProxy;

@Injectable()
export class ClipboardService {
  copyAsHtml(htmlString: string) {
    clipboard(htmlString, {
      asHtml: true
    });
  }
}
