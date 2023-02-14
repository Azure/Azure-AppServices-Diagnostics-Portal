import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonNodePropertiesComponent } from './common-node-properties.component';

describe('CommonNodePropertiesComponent', () => {
  let component: CommonNodePropertiesComponent;
  let fixture: ComponentFixture<CommonNodePropertiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommonNodePropertiesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommonNodePropertiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
