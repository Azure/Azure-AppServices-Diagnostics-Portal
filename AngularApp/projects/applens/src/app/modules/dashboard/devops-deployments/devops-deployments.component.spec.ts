import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DevopsDeploymentsComponent } from './devops-deployments.component';

describe('DevopsDeploymentsComponent', () => {
  let component: DevopsDeploymentsComponent;
  let fixture: ComponentFixture<DevopsDeploymentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DevopsDeploymentsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DevopsDeploymentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
