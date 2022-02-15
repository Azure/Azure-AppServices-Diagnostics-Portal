import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable()
export class GenericSupportTopicService {
    // TODO: Figure out if this can be done with an abstract class
    // Ran into difficulties in Support Center when this was abstract
    // This class is never supposed to be used directly
    // In applens we provide this withValue: applens-diagnostics.service
    // In Support Center we provide this withValue: generic-api.service
    public supportTopicId: string;
    public sapSupportTopicId: string;

    public getSelfHelpContentDocument(): Observable<any> {
        return null;
    }

    public getPathForSupportTopic(supportTopicId: string, pesId: string, searchTerm: string, sapSupportTopicId: string, sapProductId: string): Observable<any> {
        return null;
    }
}
