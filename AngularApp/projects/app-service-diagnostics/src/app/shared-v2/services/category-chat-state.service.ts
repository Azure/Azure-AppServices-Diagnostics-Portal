import { Injectable } from '@angular/core';
import { Feature } from '../models/features';
import { Category } from '../models/category';

@Injectable()
export class CategoryChatStateService {
  public selectedFeature: Feature;
  public category: Category;

  constructor() {}
}
