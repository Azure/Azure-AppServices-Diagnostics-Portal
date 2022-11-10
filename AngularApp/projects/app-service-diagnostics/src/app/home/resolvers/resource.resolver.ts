import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { ResourceService } from '../../shared-v2/services/resource.service';
import { ArmResource } from '../../shared-v2/models/arm';
import { DetectorControlService, TimePickerOptions } from 'diagnostic-data';

@Injectable()
export class ResourceResolver implements Resolve<Observable<{} | ArmResource>> {
    constructor(private _resourceService: ResourceService, private _detectorControlService: DetectorControlService) { }
    // Live Chat Service is included here so that we ensure an instance is created

    resolve(activatedRouteSnapshot: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<{} | ArmResource> {
        let startTime = activatedRouteSnapshot.queryParams['startTime'];
        let endTime = activatedRouteSnapshot.queryParams['endTime'];
        if (!!startTime && !!endTime)
        {
            this._detectorControlService.setCustomStartEnd(startTime, endTime);
            this._detectorControlService.updateTimePickerInfo({
                selectedKey: TimePickerOptions.Custom,
                selectedText: TimePickerOptions.Custom,
                startDate: new Date(startTime),
                endDate: new Date(endTime)
            });
        }

        if (!this._detectorControlService.startTime) {

            this._detectorControlService.setDefault();
        }

        //Try get resourceUri from activatedRoute,if not then get from Routerstate
        let resourceUri = activatedRouteSnapshot.parent.url
            .map(x => x.path)
            .join('/');

        if (this.checkResourceUriIsEmpty(resourceUri)) {
            const url = state.url;
            const startIndex = url.indexOf("subscriptions/") > -1 ? url.indexOf("subscriptions/") : 0;
            let endIndex = url.length;
            if(url.indexOf('/categories') > -1) {
                endIndex = url.indexOf("/categories");
            }else if (url.indexOf('/supportTopicId') > -1){
                endIndex = url.indexOf('/supportTopicId');
            }
            resourceUri = url.substring(startIndex, endIndex);
        }

        if(this.validateResourceUri(resourceUri)){
            return this._resourceService.registerResource(resourceUri);
        }else {
            return of({});
        }
    }

    private checkResourceUriIsEmpty(resourceUri: string): boolean {
        return resourceUri === "" || resourceUri === "/";
    }

    //if it is invalidate resource uri, block call to registerResource
    private validateResourceUri(resourceUri: string): boolean {
        return resourceUri.toLowerCase().startsWith("subscriptions") || resourceUri.toLowerCase().startsWith("/subscriptions");
    }
}
