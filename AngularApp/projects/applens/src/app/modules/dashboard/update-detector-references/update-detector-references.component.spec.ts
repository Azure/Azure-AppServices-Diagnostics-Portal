import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateDetectorReferencesComponent } from './update-detector-references.component';

describe('UpdateDetectorReferencesComponent', () => {
  let component: UpdateDetectorReferencesComponent;
  let fixture: ComponentFixture<UpdateDetectorReferencesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpdateDetectorReferencesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateDetectorReferencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
