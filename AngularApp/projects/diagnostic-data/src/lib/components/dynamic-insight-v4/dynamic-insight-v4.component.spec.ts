import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DynamicInsightV4Component } from './dynamic-insight-v4.component';

describe('DynamicInsightV4Component', () => {
  let component: DynamicInsightV4Component;
  let fixture: ComponentFixture<DynamicInsightV4Component>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DynamicInsightV4Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DynamicInsightV4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
