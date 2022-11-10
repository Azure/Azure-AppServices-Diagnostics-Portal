import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CategoryMenuComponent } from './category-menu.component';

describe('CategoryMenuComponent', () => {
  let component: CategoryMenuComponent;
  let fixture: ComponentFixture<CategoryMenuComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CategoryMenuComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CategoryMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
