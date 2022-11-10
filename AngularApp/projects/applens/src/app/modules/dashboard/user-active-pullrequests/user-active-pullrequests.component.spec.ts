import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UserActivePullrequestsComponent } from './user-active-pullrequests.component';

describe('UserActivePullrequestsComponent', () => {
  let component: UserActivePullrequestsComponent;
  let fixture: ComponentFixture<UserActivePullrequestsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ UserActivePullrequestsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserActivePullrequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
