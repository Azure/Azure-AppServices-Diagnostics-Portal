import { Injectable } from '@angular/core';
import { DetectorControlService, DetectorMetaData, DetectorType } from 'diagnostic-data';
import { Observable, of, throwError } from 'rxjs';
import { catchError, flatMap, map, take } from 'rxjs/operators';
import { FavoriteDetectors } from '../../../shared/models/user-setting';
import { ApplensDiagnosticService } from './applens-diagnostic.service';
import { UserSettingService } from './user-setting.service';

@Injectable()
export class ApplensCommandBarService {
    constructor(private _detectorControlService: DetectorControlService, private _applensDiagnosticService: ApplensDiagnosticService, private _userSettingService: UserSettingService) {
    }

    public refreshPage() {
        this._detectorControlService.refresh("V3ControlRefresh");
    }

    public getDetectorMeatData(detectorId: string) {
        return this._applensDiagnosticService.getDetectorMetaDataById(detectorId);
    }

    public emailToAuthor(data: DetectorMetaData): void {
        if (!data) return;

        const subject = encodeURIComponent(`Detector Feedback for ${data.id}`);
        const body = encodeURIComponent('Current site: ' + window.location.href + '\n' + 'Please provide feedback here:');
        const authorInfo = data.author;
        let link = "";


        if (authorInfo !== '') {
            const separators = [' ', ',', ';', ':'];
            const authors = authorInfo.split(new RegExp(separators.join('|'), 'g'));
            const authorsArray: string[] = [];
            authors.forEach(author => {
                if (author && author.length > 0) {
                    authorsArray.push(`${author}@microsoft.com`);
                }
            });
            const authorEmails = authorsArray.join(';');

            link = `mailto:${authorEmails}?cc=applensdisc@microsoft.com&subject=${subject}&body=${body}`;

        } else {
            link = `mailto:applensdisc@microsoft.com?subject=${subject}&body=${body}`;
        }

        window.open(link);
    }

    public addFavoriteDetector(detectorId: string, detectorType: DetectorType): Observable<string> {
        const overMaxNumberMessage = `Over ${this._userSettingService.maxFavoriteDetectors} of Pinned detectors, Please remove some pinned detectors in Overview`;
        const successfulMessage = "Successfully pinned to overview page";
        const otherErrorMessage = "Some issue happened while pinning, Please try again later";
        return this._applensDiagnosticService.getDetectors().pipe(
            flatMap(detectors => {
                return this._userSettingService.getUserSetting().pipe(take(1), map(userSetting => this.canAddFavoriteDetector(detectors, userSetting.favoriteDetectors, this._userSettingService.maxFavoriteDetectors)))
            }),
            flatMap(canAdd => {
                if (canAdd) {
                    return this._userSettingService.addFavoriteDetector(detectorId, { type: detectorType }).pipe(
                        map(_ => successfulMessage));
                } else {
                    return throwError(overMaxNumberMessage);
                }
            }),
            catchError(err => {
                if(err !== overMaxNumberMessage) return throwError(otherErrorMessage);
                else return throwError(err);
            }));
    }

    private canAddFavoriteDetector(detectors: DetectorMetaData[], favoriteDetectors: FavoriteDetectors, maxNumber: number) {
        const allFavoriteDetectors = Object.keys(favoriteDetectors);
        const filteredFavoriteDetectors = allFavoriteDetectors.filter(favoriteDetector => detectors.findIndex(d => d.id.toLowerCase() === favoriteDetector.toLowerCase()) > -1);
        return filteredFavoriteDetectors.length < maxNumber;
    }

    public removeFavoriteDetector(detectorId: string): Observable<string> {
        const successfulMessage =  "Successfully unpinned from overview page";
        const errorMessage = "Some issue happened while unpinning, Please try again later";    
        return this._userSettingService.removeFavoriteDetector(detectorId).pipe(
            map(_ => successfulMessage), 
            catchError(err => throwError(errorMessage)));
    }
    public getUserSetting() {
        return this._userSettingService.getUserSetting();
    }
}
