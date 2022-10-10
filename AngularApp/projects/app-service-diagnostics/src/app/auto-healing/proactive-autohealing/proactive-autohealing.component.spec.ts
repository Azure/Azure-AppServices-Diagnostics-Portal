import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ProactiveAutohealingComponent } from './proactive-autohealing.component';

describe('ProactiveAutohealingComponent', () => {
  let component: ProactiveAutohealingComponent;
  let fixture: ComponentFixture<ProactiveAutohealingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ProactiveAutohealingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProactiveAutohealingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
