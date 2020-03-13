import { RouteReuseStrategy, ActivatedRouteSnapshot, DetachedRouteHandle } from '@angular/router';
import { Injectable, ComponentRef } from '@angular/core';

@Injectable()
export class CustomReuseStrategy implements RouteReuseStrategy {

    handlers: { [key: string]: DetachedRouteHandle } = {};

    closedTab: string;

    /**
    * Determines if this route (and its subtree) should be detached to be reused later.
    */
    shouldDetach(route: ActivatedRouteSnapshot): boolean {
        const url = this._getUrl(route);
        // console.log("route in shoulddetach", route.routeConfig, route.data);
        if (!route.routeConfig) { // console.log("route in shoulddetach 1");
         return false; }
        if (route.routeConfig.loadChildren) { // console.log("route in shoulddetach 2");
        return false; }
        var res = !!route.data && !!(route.data as any).cacheComponent;
        //console.log("route in shoulddetach 3", res);
        return res;
        // return !!route.data && !!(route.data as any).cacheComponent;
    }

    /**
     * Stores the detached route.
     */
    store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
        const url = this._getUrl(route);

        if (this.closedTab === url) {
            this._deactivateOutlet(handle);
            this.closedTab = null;
            return;
        }

        this.handlers[url] = handle;
    }

    /**
     * Determines if this route (and its subtree) should be reattached.
     */
    shouldAttach(route: ActivatedRouteSnapshot): boolean {
        const url = this._getUrl(route);
        return !!route.routeConfig && !!this.handlers[url];
    }

    /**
     * Retrieves the previously stored route.
     */
    retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle {

        if (!route.routeConfig) { //console.log("route retrive 1 routeconfig empty", route);
        return null; }
        if (route.routeConfig.loadChildren) { //console.log("route retrive 2 loadchildren empty", route.routeConfig);
        return null; }

        const url = this._getUrl(route);
        // console.log("route retrive 3 retrieve url", url, this.handlers, this.handlers[url], route);
        return this.handlers[url];
    }

    /**
     * Determines if a route should be reused.
     */
    shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
        if (curr.routeConfig === null && future.routeConfig === null) {
            return true;
        }
        if (future.routeConfig !== curr.routeConfig) {
            return false;
        }

        return this._getUrl(future) === this._getUrl(curr);

    }

    removeCachedRoute(url: string) {
        this.closedTab = url;
        this._deactivateOutlet(this.handlers[url]);
        this.handlers[url] = null;
    }

    private _deactivateOutlet(handle: DetachedRouteHandle): void {
        if (handle) {
            const componentRef: ComponentRef<any> = handle['componentRef'];
            if (componentRef) {
                componentRef.destroy();
            }
        }
    }

    private _getUrl(route: ActivatedRouteSnapshot): string {
        const topLevelParent = this._getParent(route);
        const fullUrl = '/' + this._getFullUrl(topLevelParent);

        return fullUrl;
    }

    private _getParent(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
        return route.parent ? this._getParent(route.parent) : route;
    }

    private _getFullUrl(route: ActivatedRouteSnapshot): string {
        if (!route) {
            return null;
        }

        const childRoute = this._getFullUrl(route.firstChild);
        if (!route.url || route.url.length === 0) {
            return childRoute;
        }

        const currentRoute = route.url.join('/');
        const returnValue = childRoute && childRoute !== '' ? [currentRoute, childRoute].join('/') : currentRoute;
        return returnValue;
    }
}
