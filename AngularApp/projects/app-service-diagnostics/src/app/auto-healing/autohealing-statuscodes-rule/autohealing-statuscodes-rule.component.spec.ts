import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AutohealingStatuscodesRuleComponent } from './autohealing-statuscodes-rule.component';

describe('AutohealingStatuscodesRuleComponent', () => {
  let component: AutohealingStatuscodesRuleComponent;
  let fixture: ComponentFixture<AutohealingStatuscodesRuleComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AutohealingStatuscodesRuleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutohealingStatuscodesRuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
