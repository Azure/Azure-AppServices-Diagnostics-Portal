import { Component, OnInit, Injector } from '@angular/core';
import { MessageProcessor } from '../../../supportbot/message-processor.service';
import { ActivatedRoute } from '@angular/router';
import { CategoryService } from '../../../shared-v2/services/category.service';
import { Category } from '../../../shared-v2/models/category';
import { CategoryChatStateService } from '../../../shared-v2/services/category-chat-state.service';

@Component({
  selector: 'category-chat',
  templateUrl: './category-chat.component.html',
  styleUrls: ['./category-chat.component.scss'],
  providers: [CategoryChatStateService]
})
export class CategoryChatComponent implements OnInit {
  startingKey: string;
  category: Category;

  constructor(
    private _injector: Injector,
    private _activatedRoute: ActivatedRoute,
    private _categoryService: CategoryService,
    private _chatState: CategoryChatStateService
  ) {
    this._activatedRoute.params.subscribe((params) => {
      this._categoryService.categories.subscribe((categories) => {
        this.category = categories.find(
          (category) =>
            category.id === this._activatedRoute.snapshot.params.category
        );
        this._chatState.category = this.category;
        let categoryId =
          this.category != undefined && this.category.id != undefined
            ? this.category.id
            : '';
        this.startingKey = `welcome-${categoryId}`;
      });
    });
  }

  ngOnInit() {}
}
