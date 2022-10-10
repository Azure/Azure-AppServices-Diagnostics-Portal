import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GuageControlComponent } from './guage-control.component';

describe('GuageControlComponent', () => {
  let component: GuageControlComponent;
  let fixture: ComponentFixture<GuageControlComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GuageControlComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GuageControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
