import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfilerComponent } from './profiler.component';

describe('ProfilerComponent', () => {
  let component: ProfilerComponent;
  let fixture: ComponentFixture<ProfilerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProfilerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfilerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
