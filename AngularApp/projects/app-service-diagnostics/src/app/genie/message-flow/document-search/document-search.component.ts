import {
  Component,
  AfterViewInit,
  Output,
  EventEmitter,
  Injector
} from '@angular/core';
import { IChatMessageComponent } from '../../interfaces/ichatmessagecomponent';
import { Message } from '../../models/message';
import { MessageSender } from '../../models/message-enums';
import { ContentService } from '../../../shared-v2/services/content.service';
import { LoggingV2Service } from '../../../shared-v2/services/logging-v2.service';
import { CategoryChatStateService } from '../../../shared-v2/services/category-chat-state.service';

@Component({
  selector: 'document-search',
  templateUrl: './document-search.component.html',
  styleUrls: ['./document-search.component.scss']
})
export class DocumentSearchComponent
  implements AfterViewInit, IChatMessageComponent
{
  content: any[];

  pressedSearch: boolean = false;

  searchValue: string;

  @Output() onViewUpdate = new EventEmitter();
  @Output() onComplete = new EventEmitter<{ status: boolean; data?: any }>();

  constructor(
    private _injector: Injector,
    private _contentService: ContentService,
    private _chatState: CategoryChatStateService,
    private _logger: LoggingV2Service
  ) {}

  ngAfterViewInit() {
    this.onViewUpdate.emit();
  }

  onSubmit(formValue: any) {
    this._logger.LogChatSearch(
      formValue.documentSearchInput,
      this._chatState.category.name
    );
    this.searchValue = formValue.documentSearchInput;
    this._contentService
      .searchWeb(formValue.documentSearchInput)
      .subscribe((searchResults) => {
        if (
          searchResults &&
          searchResults.webPages &&
          searchResults.webPages.value &&
          searchResults.webPages.value.length > 0
        ) {
          this.content = searchResults.webPages.value.map((result) => {
            return {
              title: result.name,
              description: result.snippet,
              link: result.url
            };
          });
        }

        if (!this.pressedSearch) {
          this.pressedSearch = true;
          this.onComplete.emit({ status: true });
        }
      });
  }

  openArticle(article: any) {
    this._logger.LogChatSearchSelection(
      this.searchValue,
      this._chatState.category.name,
      article.title,
      article.link,
      'content'
    );
    window.open(article.link, '_blank');
  }

  getLink(link: string) {
    return !link || link.length < 20 ? link : link.substr(0, 25) + '...';
  }
}

export class DocumentSearchMessage extends Message {
  constructor(messageDelayInMs: number = 1000) {
    super(
      DocumentSearchComponent,
      { sender: MessageSender.User },
      messageDelayInMs
    );
  }
}
