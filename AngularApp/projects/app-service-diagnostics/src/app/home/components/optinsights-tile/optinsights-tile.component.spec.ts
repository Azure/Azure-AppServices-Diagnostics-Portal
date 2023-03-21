import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptinsightsTileComponent } from './optinsights-tile.component';

describe('OptinsightsTileComponent', () => {
  let component: OptinsightsTileComponent;
  let fixture: ComponentFixture<OptinsightsTileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OptinsightsTileComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OptinsightsTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
