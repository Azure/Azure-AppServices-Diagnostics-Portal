import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DaasComponent } from './daas.component';

describe('DaasComponent', () => {
  let component: DaasComponent;
  let fixture: ComponentFixture<DaasComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DaasComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DaasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
