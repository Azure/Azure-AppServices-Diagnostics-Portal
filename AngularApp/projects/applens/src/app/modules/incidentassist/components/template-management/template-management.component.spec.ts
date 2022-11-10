import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TemplateManagementComponent } from './template-management.component';

describe('TemplateManagementComponent', () => {
  let component: TemplateManagementComponent;
  let fixture: ComponentFixture<TemplateManagementComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TemplateManagementComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TemplateManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
