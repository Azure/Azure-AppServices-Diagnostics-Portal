import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputNodeComponent } from './input-node.component';

describe('InputNodeComponent', () => {
  let component: InputNodeComponent;
  let fixture: ComponentFixture<InputNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InputNodeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InputNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
