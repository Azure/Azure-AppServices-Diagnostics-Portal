import { Component, OnInit, Input } from '@angular/core';
import { WindowService } from '../../../shared/services/window.service';
import { SiteService } from '../../services/site.service';
import { Site } from '../../models/site';
import { ArmService } from '../../services/arm.service';
import { Observable } from 'rxjs/Observable';

@Component({
    selector: 'liveagent-chat',
    template: ''
})
export class LiveAgentChatComponent implements OnInit {

    @Input() autoOpen: boolean = false;
    @Input() source: string = '';
    private restoreIdTagName: string;

    // As we dont have any Resource Service yet, Right now using Site as resource.
    // After refactoring, this has to come from a generic Resource service.
    private currentResource: Site;

    constructor(private windowService: WindowService, private siteService: SiteService, private armService: ArmService) {
    }

    ngOnInit(): void {

        let restoreId: string = '';
        let externalId: string = '';
        let window = this.windowService.window;

        this.siteService.currentSite.subscribe((site: Site) => {

            this.currentResource = site;
            this.restoreIdTagName = `hidden-related:${this.currentResource.id}/diagnostics/chatRestorationId`;
            externalId = site.id;

            restoreId = this.getChatRestoreId();

            if (window && window.fcWidget) {

                window.fcWidget.init({
                    token: "a1d90d4d-900d-4282-9270-d4a6c2eb94af",
                    host: "https://wchat.freshchat.com",
                    open: this.autoOpen,
                    externalId: externalId,
                    restoreId: restoreId,
                    firstName: this.currentResource.name
                });

                window.fcWidget.on("widget:loaded", ((resp) => {
                    this.getOrCreateUser();
                }));
            }
        });
    }

    private getOrCreateUser() {

        let window = this.windowService.window;

        window.fcWidget.user.get().then((result: any) => {
            this.updateChatRestoreId(result.data.restoreId);
        }, (err: any) => {
            // User doesnt exist. Create the user and update the RestoreId.
            window.fcWidget.user.create().then((createResponse: any) => {
                this.updateChatRestoreId(createResponse.data.restoreId);
            }, (err1: any) => {
            });
        });
    }

    private updateChatRestoreId(restoreId: string) {

        if (this.currentResource && this.currentResource.tags && this.currentResource.tags[this.restoreIdTagName]) {

            // if restoreId is already present, dont update it again
            if (this.currentResource.tags[this.restoreIdTagName] === restoreId) {
                return;
            }
        }

        this.currentResource.tags[this.restoreIdTagName] = restoreId;

        let body: any = {
            tags: this.currentResource.tags
        };

        // Limitation : If for the first time, resource was opened by RBAC role which doesn't have access to patch the resource,
        // then the current chat session will not be restored next-time. 
        // TODO : We might need to store this restoreId somewhere else globally.
        this.armService.patchResource(this.currentResource.id, body).subscribe((data: any) => { });
    }

    private getChatRestoreId(): string {

        if (this.currentResource && this.currentResource.tags && this.currentResource.tags[this.restoreIdTagName]) {
            return this.currentResource.tags[this.restoreIdTagName];
        }

        return '';
    }
}
