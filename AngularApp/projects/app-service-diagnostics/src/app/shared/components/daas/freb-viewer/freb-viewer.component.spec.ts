import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FrebViewerComponent } from './freb-viewer.component';

describe('FrebViewerComponent', () => {
  let component: FrebViewerComponent;
  let fixture: ComponentFixture<FrebViewerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FrebViewerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FrebViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
