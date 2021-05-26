import { Injectable } from '@angular/core';
import { DetectorControlService,DetectorMetaData } from 'diagnostic-data';
import { ApplensDiagnosticService } from './applens-diagnostic.service';

@Injectable()
export class ApplensCommandBarService {
    constructor(private _detectorControlService: DetectorControlService, private _applensDiagnosticService: ApplensDiagnosticService) {
    }

    public refreshPage() {
        this._detectorControlService.refresh("V3ControlRefresh");
    }

    public getDetectorMeatData(detectorId: string) {
        return this._applensDiagnosticService.getDetectorMetaDataById(detectorId);
    }

    public emailToAuthor(data: DetectorMetaData): void {
        if(!data) return;

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
}