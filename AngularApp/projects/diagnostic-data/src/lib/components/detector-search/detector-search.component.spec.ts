import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DetectorSearchComponent } from './detector-search.component';

describe('DetectorSearchComponent', () => {
  let component: DetectorSearchComponent;
  let fixture: ComponentFixture<DetectorSearchComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DetectorSearchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetectorSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
