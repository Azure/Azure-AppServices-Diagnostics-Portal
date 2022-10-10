import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SectionDividerComponent } from './section-divider.component';

describe('SectionDividerComponent', () => {
  let component: SectionDividerComponent;
  let fixture: ComponentFixture<SectionDividerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SectionDividerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SectionDividerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
