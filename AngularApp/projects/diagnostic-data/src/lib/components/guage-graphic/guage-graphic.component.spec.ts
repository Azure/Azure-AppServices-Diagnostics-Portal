import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GuageGraphicComponent } from './guage-graphic.component';

describe('GuageGraphicComponent', () => {
  let component: GuageGraphicComponent;
  let fixture: ComponentFixture<GuageGraphicComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GuageGraphicComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GuageGraphicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
