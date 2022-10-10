import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ChangesViewComponent } from './changes-view.component';

describe('ChangesViewComponent', () => {
  let component: ChangesViewComponent;
  let fixture: ComponentFixture<ChangesViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ChangesViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangesViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
