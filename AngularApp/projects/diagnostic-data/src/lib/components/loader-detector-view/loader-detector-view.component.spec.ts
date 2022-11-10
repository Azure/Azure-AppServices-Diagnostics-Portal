import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LoaderDetectorViewComponent } from './loader-detector-view.component';

describe('LoaderDetectorViewComponent', () => {
  let component: LoaderDetectorViewComponent;
  let fixture: ComponentFixture<LoaderDetectorViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LoaderDetectorViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoaderDetectorViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
