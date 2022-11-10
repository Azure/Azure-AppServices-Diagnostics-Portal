import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CollapsibleMenuItemComponent } from './collapsible-menu-item.component';

describe('CollapsibleMenuItemComponent', () => {
  let component: CollapsibleMenuItemComponent;
  let fixture: ComponentFixture<CollapsibleMenuItemComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CollapsibleMenuItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollapsibleMenuItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
