import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CardSelectionComponent } from './card-selection.component';

describe('CardSelectionComponent', () => {
  let component: CardSelectionComponent;
  let fixture: ComponentFixture<CardSelectionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CardSelectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
