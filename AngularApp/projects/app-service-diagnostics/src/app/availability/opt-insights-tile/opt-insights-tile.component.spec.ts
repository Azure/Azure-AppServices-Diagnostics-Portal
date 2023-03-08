import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptInsightsTileComponent } from './opt-insights-tile.component';

describe('OptInsightsTileComponent', () => {
  let component: OptInsightsTileComponent;
  let fixture: ComponentFixture<OptInsightsTileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OptInsightsTileComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OptInsightsTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
