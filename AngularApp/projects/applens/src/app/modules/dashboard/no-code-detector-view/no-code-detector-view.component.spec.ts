import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoCodeDetectorViewComponent } from './no-code-detector-view.component';

describe('NoCodeDetectorViewComponent', () => {
  let component: NoCodeDetectorViewComponent;
  let fixture: ComponentFixture<NoCodeDetectorViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NoCodeDetectorViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NoCodeDetectorViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
