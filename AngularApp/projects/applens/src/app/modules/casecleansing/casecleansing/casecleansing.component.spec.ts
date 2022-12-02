import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CaseCleansingComponent } from './casecleansing.component';

describe('CasecleansingComponent', () => {
  let component: CaseCleansingComponent;
  let fixture: ComponentFixture<CaseCleansingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CaseCleansingComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CaseCleansingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
