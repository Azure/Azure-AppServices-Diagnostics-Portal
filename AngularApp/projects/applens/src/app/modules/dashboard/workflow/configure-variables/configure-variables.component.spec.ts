import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigureVariablesComponent } from './configure-variables.component';

describe('ConfigureVariablesComponent', () => {
  let component: ConfigureVariablesComponent;
  let fixture: ComponentFixture<ConfigureVariablesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfigureVariablesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigureVariablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
