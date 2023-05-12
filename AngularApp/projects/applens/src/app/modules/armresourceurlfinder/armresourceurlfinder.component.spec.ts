import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ArmResourceUrlFinder } from './armresourceurlfinder.component';

describe('StampFinderComponent', () => {
  let component: ArmResourceUrlFinder;
  let fixture: ComponentFixture<ArmResourceUrlFinder>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ArmResourceUrlFinder ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ArmResourceUrlFinder);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
