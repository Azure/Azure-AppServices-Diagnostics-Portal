import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CollapsibleMenuComponent } from './collapsible-menu.component';

describe('CollapsibleMenuComponent', () => {
  let component: CollapsibleMenuComponent;
  let fixture: ComponentFixture<CollapsibleMenuComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CollapsibleMenuComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollapsibleMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
