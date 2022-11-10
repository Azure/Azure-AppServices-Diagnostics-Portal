import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DaasScaleupComponent } from './daas-scaleup.component';

describe('DaasScaleupComponent', () => {
  let component: DaasScaleupComponent;
  let fixture: ComponentFixture<DaasScaleupComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DaasScaleupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DaasScaleupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
