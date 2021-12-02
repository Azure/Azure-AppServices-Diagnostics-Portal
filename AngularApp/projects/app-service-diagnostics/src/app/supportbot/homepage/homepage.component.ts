import { Component, OnInit } from '@angular/core';
import { OperatingSystem, SiteExtensions } from '../../shared/models/site';
import { WindowService } from '../../startup/services/window.service';
import { SiteService } from '../../shared/services/site.service';
import { LoggingService } from '../../shared/services/logging/logging.service';
import { AuthService } from '../../startup/services/auth.service';
import { ResourceType, AppType } from '../../shared/models/portal';
import { DetectorControlService } from 'diagnostic-data';

@Component({
    selector: 'home-page',
    templateUrl: 'homepage.component.html'
})
export class HomepageComponent implements OnInit {
    public listCollection: any;
    public toolsContainerHeight: number;
    public isSite: boolean;
    public showSupportTools: boolean;

    constructor(private _windowService: WindowService, private _siteService: SiteService, private _logger: LoggingService, private _authService: AuthService, private _detectorControlService: DetectorControlService) {
        this.listCollection = [];
        this.toolsContainerHeight = 0;
        this.showSupportTools = false;

        if (!this._detectorControlService.startTime) {
            this._detectorControlService.setDefault();
        }
    }

    ngOnInit(): void {
        this.isSite = this._authService.resourceType === ResourceType.Site;
        if (this.isSite) {
            this.isSite = true;
            this._siteService.currentSite.subscribe(site => {
                if (site) {

                    if (site.appType != AppType.FunctionApp) {
                        this.showSupportTools = true;
                    }

                    if (SiteExtensions.operatingSystem(site) == OperatingSystem.linux) {
                        this.listCollection.push(this._getLinuxFAQItems());
                        this.listCollection.push(this._getLinuxResourceCenterItems());
                    } else {
                        this.listCollection.push(this._getFAQItems());
                        this.listCollection.push(this._getResourceCenterItems());
                    }

                    this.listCollection.push(this._getCommunityItems());
                    this.listCollection.push(this._getRecentUpdateItems());
                    this.listCollection.push(this._getContributeItems());
                }
            });
        } else {
            this.listCollection.push(this._getAseFAQItems());
            this.listCollection.push(this._getAseResourceCenterItems());
            this.listCollection.push(this._getCommunityItems());
            this.listCollection.push(this._getRecentUpdateItems());
            this.listCollection.push(this._getContributeItems());
        }

        this.toolsContainerHeight = this._windowService.window.innerHeight - 60;
    }

    public openUrl(link: string, name: string, container: string): void {
        this._logger.LogClickEvent(name, container, 'Support Home');
        this._windowService.window.open(link, '_blank');
    }

    private _getResourceCenterItems() {
        return {
            title: 'Resource Center',
            collapsed: true,
            items: [{
                title: 'Quick Starts',
                href: 'https://goo.gl/fp23A5'
            }, {
                title: 'App Service Team Blog',
                href: 'https://goo.gl/44J8ki'
            }, {
                title: 'Video Walkthroughs',
                href: 'https://goo.gl/1QEx17'
            }, {
                title: 'How-To Docs',
                href: 'https://goo.gl/hxnzZf'
            }, {
                title: 'App Service Overview',
                href: 'https://goo.gl/2v9uLn'
            }, {
                title: 'About Azure Support Plans',
                href: 'https://goo.gl/1JzP1P'
            }]
        };
    }

    private _getLinuxResourceCenterItems() {
        return {
            title: 'Resource Center',
            collapsed: true,
            items: [{
                title: 'Quick Starts',
                href: 'https://goo.gl/exFu9W'
            }, {
                title: 'App Service Team Blog',
                href: 'https://goo.gl/44J8ki'
            }, {
                title: 'How-To Docs',
                href: 'https://goo.gl/FjrtHn'
            }, {
                title: 'App Service Overview',
                href: 'https://goo.gl/6sKo3y'
            }, {
                title: 'About Azure Support Plans',
                href: 'https://goo.gl/1JzP1P'
            }]
        };
    }

    private _getAseResourceCenterItems() {
        return {
            title: 'Resource Center',
            collapsed: false,
            items: [{
                title: 'About App Service Environment',
                href: 'https://goo.gl/US7t2c'
            }, {
                title: 'About Network Architecture',
                href: 'https://goo.gl/JZtp7r'
            }, {
                title: 'High Scale Scenarios with ASE',
                href: 'https://goo.gl/Yzg665'
            }, {
                title: 'Integrate with Application Gateway',
                href: 'https://goo.gl/QeMoa4'
            }]
        };
    }

    private _getFAQItems() {
        return {
            title: 'FAQs',
            collapsed: false,
            items: [{
                title: 'Application Performance FAQs',
                href: 'https://goo.gl/xc33CM'
            }, {
                title: 'Deployment FAQs',
                href: 'https://goo.gl/RCvhA1'
            }, {
                title: 'OSS FAQs',
                href: 'https://goo.gl/XNnrmk'
            }, {
                title: 'Configuration and Management FAQs',
                href: 'https://goo.gl/AVqGCS'
            }]
        };
    }

    private _getLinuxFAQItems() {
        return {
            title: 'FAQs',
            collapsed: false,
            items: [{
                title: 'Azure App Service on Linux FAQ',
                href: 'https://goo.gl/Mu1LCE'
            }]
        };
    }

    private _getAseFAQItems() {
        return {
            title: 'FAQs',
            collapsed: false,
            items: [{
                title: 'How scaling works',
                href: 'https://goo.gl/47k12h'
            }, {
                title: 'Integrate with a WAF',
                href: 'https://goo.gl/GcDu9C'
            }, {
                title: 'Azure Virtual Network FAQ',
                href: 'https://goo.gl/5ut2JM'
            }, {
                title: 'More info about Network Security Groups',
                href: 'https://goo.gl/5jw7tc'
            }]
        };
    }

    private _getCommunityItems() {
        return {
            title: 'Community',
            collapsed: false,
            items: [{
                title: 'MSDN Forums',
                href: 'https://goo.gl/NwNyec'
            }, {
                title: 'Stack Overflow',
                href: 'https://goo.gl/MhG5Ec'
            }, {
                title: '@AzureSupport',
                href: 'https://twitter.com/intent/tweet?text=@azuresupport+%23azhelp:'
            }, {
                title: 'Azure @ ServerFault',
                href: 'https://serverfault.com/questions/tagged/azure'
            }]
        };
    }

    private _getRecentUpdateItems() {
        return {
            title: 'Recent Updates',
            collapsed: true,
            items: [{
                title: 'App Service Announcements',
                href: 'https://goo.gl/ecTdFo'
            }, {
                title: 'Azure Status History',
                href: 'https://goo.gl/eG7od5'
            }, {
                title: 'News on Azure Releases',
                href: 'https://goo.gl/53b1m3'
            }, {
                title: '.NET Updates',
                href: 'https://goo.gl/uUMJdJ'
            }, {
                title: 'Node.js Updates',
                href: 'https://goo.gl/dvaux4'
            }, {
                title: 'PHP Updates',
                href: 'http://php.net/releases/'
            }, {
                title: 'Java Updates',
                href: 'https://www.java.com/en/download/faq/index_general.xml'
            }]
        };
    }

    private _getContributeItems() {
        return {
            title: 'Contribute',
            collapsed: true,
            items: [{
                title: 'Github repo',
                href: 'https://github.com/Azure/Azure-AppServices-Diagnostics-Portal'
            }]
        };
    }
}
