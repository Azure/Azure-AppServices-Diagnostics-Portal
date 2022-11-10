import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AppDependenciesComponent } from './app-dependencies.component';

describe('AppDependenciesComponent', () => {
  let component: AppDependenciesComponent;
  let fixture: ComponentFixture<AppDependenciesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AppDependenciesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppDependenciesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
