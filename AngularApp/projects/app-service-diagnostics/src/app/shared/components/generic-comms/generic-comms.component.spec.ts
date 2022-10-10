import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GenericCommsComponent } from './generic-comms.component';

describe('GenericCommsComponent', () => {
  let component: GenericCommsComponent;
  let fixture: ComponentFixture<GenericCommsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GenericCommsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GenericCommsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
