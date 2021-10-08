import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfilerV2Component } from './profiler-v2.component';

describe('ProfilerV2Component', () => {
  let component: ProfilerV2Component;
  let fixture: ComponentFixture<ProfilerV2Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProfilerV2Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfilerV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
