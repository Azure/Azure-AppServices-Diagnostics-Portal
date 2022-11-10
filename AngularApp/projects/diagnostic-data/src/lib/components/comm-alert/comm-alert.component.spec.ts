import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommAlertComponent } from './comm-alert.component';

describe('CommAlertComponent', () => {
  let component: CommAlertComponent;
  let fixture: ComponentFixture<CommAlertComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CommAlertComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CommAlertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
