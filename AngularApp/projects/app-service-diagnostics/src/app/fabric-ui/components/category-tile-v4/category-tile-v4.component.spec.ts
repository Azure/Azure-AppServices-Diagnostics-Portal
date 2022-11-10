import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CategoryTileV4Component } from './category-tile-v4.component';

describe('CategoryTileV4Component', () => {
  let component: CategoryTileV4Component;
  let fixture: ComponentFixture<CategoryTileV4Component>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CategoryTileV4Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CategoryTileV4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
