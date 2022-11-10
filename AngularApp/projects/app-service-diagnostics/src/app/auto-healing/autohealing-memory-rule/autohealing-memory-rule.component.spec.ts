import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AutohealingMemoryRuleComponent } from './autohealing-memory-rule.component';

describe('AutohealingMemoryRuleComponent', () => {
  let component: AutohealingMemoryRuleComponent;
  let fixture: ComponentFixture<AutohealingMemoryRuleComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AutohealingMemoryRuleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutohealingMemoryRuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
