import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CategorySummaryComponent } from './category-summary.component';

describe('CategorySummaryComponent', () => {
  let component: CategorySummaryComponent;
  let fixture: ComponentFixture<CategorySummaryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CategorySummaryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CategorySummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
