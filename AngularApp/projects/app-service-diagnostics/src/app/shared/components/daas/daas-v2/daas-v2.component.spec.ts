import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DaasV2Component } from './daas-v2.component';

describe('DaasV2Component', () => {
  let component: DaasV2Component;
  let fixture: ComponentFixture<DaasV2Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DaasV2Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DaasV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
