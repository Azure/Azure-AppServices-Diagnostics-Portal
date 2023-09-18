import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateExperiencePicker } from './create-experience-picker.component';

describe('CreateWorkflowComponent', () => {
  let component: CreateExperiencePicker;
  let fixture: ComponentFixture<CreateExperiencePicker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateExperiencePicker ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateExperiencePicker);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
