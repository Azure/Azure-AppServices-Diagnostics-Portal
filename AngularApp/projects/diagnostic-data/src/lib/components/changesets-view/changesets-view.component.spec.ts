import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ChangesetsViewComponent } from './changesets-view.component';

describe('ChangesetsViewComponent', () => {
  let component: ChangesetsViewComponent;
  let fixture: ComponentFixture<ChangesetsViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ChangesetsViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangesetsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
