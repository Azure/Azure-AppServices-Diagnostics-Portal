import { Injectable } from '@angular/core';

function _getWindow(): any {
  // return the native window obj
  return window;
}

@Injectable()
export class WindowService {
  window: any = _getWindow();

  public open(url: string, target?: string) {
    this.window.open(url);
  }
}
