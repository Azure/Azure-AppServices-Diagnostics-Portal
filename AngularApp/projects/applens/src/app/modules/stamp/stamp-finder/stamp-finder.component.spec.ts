import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { StampFinderComponent } from './stamp-finder.component';

describe('StampFinderComponent', () => {
  let component: StampFinderComponent;
  let fixture: ComponentFixture<StampFinderComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ StampFinderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StampFinderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
