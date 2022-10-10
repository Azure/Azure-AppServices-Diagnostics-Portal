import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { IntegratedSolutionsViewComponent } from './integrated-solutions-view.component';

describe('IntegratedSolutionsViewComponent', () => {
  let component: IntegratedSolutionsViewComponent;
  let fixture: ComponentFixture<IntegratedSolutionsViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ IntegratedSolutionsViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IntegratedSolutionsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
