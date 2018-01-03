import { Component, OnChanges, SimpleChanges, Input } from '@angular/core';
import { SolutionMetadata } from '../../models/solution-ui-model/solutionproperties';
import { WindowService } from '../../services';

@Component({
    selector: 'blog',
    templateUrl: 'blog.component.html',
    styleUrls: ['blog.component.css']
})
export class BlogComponent implements OnChanges {

    @Input() blogEntry: SolutionMetadata;

    constructor(private _windowService: WindowService) {

    }

    ngOnChanges(changes: SimpleChanges): void {
    }

    openBlogUrl(): void {
        this._windowService.window.open(this.blogEntry.og_Url, "_blank");
    }
}