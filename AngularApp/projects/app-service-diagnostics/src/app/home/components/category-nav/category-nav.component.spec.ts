import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CategoryNavComponent } from './category-nav.component';

describe('CategoryNavComponent', () => {
  let component: CategoryNavComponent;
  let fixture: ComponentFixture<CategoryNavComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CategoryNavComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CategoryNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
