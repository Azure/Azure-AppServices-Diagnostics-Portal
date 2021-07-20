import { Component, OnInit } from '@angular/core';
import { CategoryItem } from '../resource-home/resource-home.component';
import { DetectorMetaData, SupportTopic } from 'diagnostic-data';
import { map } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { Router, ActivatedRoute, NavigationExtras, NavigationEnd, Params } from '@angular/router';
import { DiagnosticService } from 'diagnostic-data';
import { AvatarModule } from 'ngx-avatar';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { HttpMethod } from '../../../shared/models/http';
import { ApplensSupportTopicService } from '../services/applens-support-topic.service';
import { Location } from '@angular/common';
import { DetectorType } from '../../../../../../diagnostic-data/src/lib/models/detector';
import { TelemetryService } from '../../../../../../diagnostic-data/src/lib/services/telemetry/telemetry.service';
import { TelemetryEventNames } from '../../../../../../diagnostic-data/src/lib/services/telemetry/telemetry.common';


@Component({
    selector: 'category-page',
    templateUrl: './category-page.component.html',
    styleUrls: ['./category-page.component.scss']
})
export class CategoryPageComponent implements OnInit {

    categoryName: string;
    category: CategoryItem;
    categories: CategoryItem[] = [];
    detectors: DetectorItem[] = [];
    categoryIcon: string;
    detectorsNumber: number = 0;

    allDetectors: DetectorMetaData[] = [];
    detectorsWithSupportTopics: DetectorMetaData[] = [];
    publicDetectorsList: DetectorMetaData[] = [];
    filterdDetectors: DetectorMetaData[] = [];
    filteredDetectorsLoaded: boolean = false;
    filterdDetectorAuthors: string[] = [];
    supportTopicIdMapping: any[] = [];
    supportTopicsNumber: number = 0;

    authors: any[] = [];
    authorsList: string[] = [];
    authorsNumber: number = 0;
    userImages: { [name: string]: string };

    detectorsPublicOrWithSupportTopics: DetectorMetaData[] = [];


    constructor(private _route: Router, private _activatedRoute: ActivatedRoute, private _diagnosticService: ApplensDiagnosticService, private _supportTopicService: ApplensSupportTopicService, private _location: Location, private _telemetryService: TelemetryService) { }

    ngOnInit() {
        this.categoryName = this._activatedRoute.snapshot.params['category'];
        const supportTopicImage = this._supportTopicService.getCategoryImage(this.categoryName).pipe(map(iconString => {
            this.categoryIcon = iconString;
        }));

        // Observable to get all the detectors
        const allDetectorsList = this._diagnosticService.getDetectors().pipe(map((detectors: DetectorMetaData[]) => {
            this.allDetectors = detectors;
            // Get all the detectors with support topics
            var detectorsWithSupportTopics = detectors.filter(detector => detector.category && detector.category.toLowerCase() === this.categoryName.toLowerCase() && detector.supportTopicList && detector.supportTopicList.length > 0);

            detectorsWithSupportTopics.forEach(detector => {
                this.detectorsWithSupportTopics.push(detector);
                detector.supportTopicList.forEach(supportTopic => {
                    this.supportTopicIdMapping.push({ supportTopic: supportTopic, detectorName: detector.name });
                });
            });

            // This is to get the full detectors authors list, and make graph API call
            let authorString = "";
            detectors.forEach(detector => {
                if (detector.author != undefined && detector.author !== '') {
                    authorString = authorString + "," + detector.author;
                }
            });

            const separators = [' ', ',', ';', ':'];
            let authors = authorString.toLowerCase().split(new RegExp(separators.join('|'), 'g'));
            authors.forEach(author => {
                if (author && author.length > 0 && !this.authorsList.find(existingAuthor => existingAuthor === author)) {
                    this.authorsList.push(author);
                }
            });
        }));

        // Observable to get all the public detectors
        const publicDetectors = this._diagnosticService.getDetectors("", false).pipe(map((publicDetectors: DetectorMetaData[]) => {
            this.publicDetectorsList = publicDetectors.filter(detector => detector.category && detector.category.toLowerCase() === this.categoryName.toLowerCase());
        }));

        forkJoin(supportTopicImage, allDetectorsList, publicDetectors).subscribe((res) => {
            this.detectorsWithSupportTopics.forEach((detector) => {
                if (!this.filterdDetectors.find((d) => d.id === detector.id)) {
                    this.filterdDetectors.push(detector);
                }
            })

            // For the public detectors, since there is no PII returned from the backend. Get the detector metadata from the full list with public detector id.
            this.publicDetectorsList.forEach((detector) => {
                var detectorId = detector.id;
                var publicDetectorWithPII = this.allDetectors.find((detectorWithPII) => detectorWithPII.id === detectorId);
                if (publicDetectorWithPII && !this.filterdDetectors.find((d) => d.id === detectorId)) {
                    this.filterdDetectors.push(publicDetectorWithPII);
                }
            });

            var body = {
                authors: this.authorsList
            };

            if (res[2] !== null) {
                this._diagnosticService.getUsers(body).subscribe((userImages) => {
                    this.userImages = userImages;

                    this.filterdDetectors.forEach((detector) => {
                        this._supportTopicService.getCategoryImage(detector.name).subscribe((iconString) => {
                            let onClick = () => {
                                this._telemetryService.logEvent(TelemetryEventNames.DetectorCardClicked, { "detector": detector.id });
                                if (detector.type === DetectorType.Analysis) {
                                    this.navigateTo(`../../analysis/${detector.id}`);
                                }
                                else {
                                    this.navigateTo(`../../detectors/${detector.id}`);
                                }
                            };

                            let detectorUsersImages: { [name: string]: string } = {};
                            if (detector.author != undefined) {
                                let authors = detector.author.toLowerCase();
                                const separators = [' ', ',', ';', ':'];
                                let detectorAuthors = authors.split(new RegExp(separators.join('|'), 'g')).filter(author => author != '');
                                detectorAuthors.forEach(author => {
                                    if (!this.filterdDetectorAuthors.find(existingAuthor => existingAuthor === author)) {
                                        this.filterdDetectorAuthors.push(author);
                                        this.authorsNumber++;
                                    }
                                    detectorUsersImages[author] = this.userImages.hasOwnProperty(author) ? this.userImages[author] : undefined;
                                });
                            }

                            let detectorSupportTopics = [];
                            if (detector.supportTopicList && detector.supportTopicList.length > 0) {
                                detector.supportTopicList.forEach((supportTopic) => {
                                    detectorSupportTopics.push(supportTopic);
                                });
                            }

                            let detectorItem = new DetectorItem(detector.name, detector.description, iconString, detector.author, [], detectorUsersImages, detectorSupportTopics, onClick);
                            this.detectors.push(detectorItem);
                        });

                        this.filteredDetectorsLoaded = true;
                    });
                    this._telemetryService.logPageView(TelemetryEventNames.CategoryPageLoaded, { "numDetectors": this.filterdDetectors.length.toString(), "categoryName": this.categoryName });

                    this.detectorsNumber = this.filterdDetectors.length;
                    this.supportTopicsNumber = this.supportTopicIdMapping.length;
                });
            }

        });
    }

    navigateTo(path: string) {
        let navigationExtras: NavigationExtras = {
            queryParamsHandling: 'preserve',
            preserveFragment: true,
            relativeTo: this._activatedRoute
        };
        this._route.navigate([path], navigationExtras);
    }

    navigateBack() {
        this._location.back();
    }

    navigateToUserPage(userId: string) {
        this.navigateTo(`../../users/${userId}`);
    }

}

export class DetectorItem {
    name: string;
    description: string;
    icon: string;
    authorString: string;
    authors: any[] = [];
    userImages: any;
    supportTopics: any[] = [];
    onClick: Function;
    category: string;

    constructor(name: string, description: string, icon: string, authorString: string, authors: any[], userImages: any, supportTopics: any[], onClick: Function, category: string = "") {
        this.name = name;

        if (description == undefined || description === "") {
            description = "This detector doesn't have any description."
        }
        this.description = description;
        this.icon = icon;
        this.authorString = authorString;
        this.authors = authors;
        this.userImages = userImages;
        this.supportTopics = supportTopics;
        this.onClick = onClick;
        this.category = category;
    }
}



