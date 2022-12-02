import {
  Component,
  OnInit,
  EventEmitter,
  Output,
  Injector,
  AfterViewInit
} from '@angular/core';
import { IChatMessageComponent } from '../../interfaces/ichatmessagecomponent';
import { Message } from '../../models/message';
import { ContentService } from '../../../shared-v2/services/content.service';

@Component({
  selector: 'document-search-results',
  templateUrl: './document-search-results.component.html',
  styleUrls: ['./document-search-results.component.scss']
})
export class DocumentSearchResultsComponent
  implements OnInit, AfterViewInit, IChatMessageComponent
{
  content: any[];

  @Output() onViewUpdate = new EventEmitter();
  @Output() onComplete = new EventEmitter<{ status: boolean; data?: any }>();

  constructor(
    private _injector: Injector,
    private _contentService: ContentService
  ) {}

  ngOnInit() {
    this._contentService.getContent().subscribe((content) => {
      this.content = content;
      this.onComplete.emit({ status: true });
    });
  }

  ngAfterViewInit() {
    this.onViewUpdate.emit();
  }

  openArticle(link) {
    window.open(link, '_blank');
  }
}

export class DocumentSearchResultsMessage extends Message {
  constructor(messageDelayInMs: number = 1000) {
    super(DocumentSearchResultsComponent, {}, messageDelayInMs);
  }
}
