import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphRenderingSettingsComponent } from './graph-rendering-settings.component';

describe('GraphRenderingSettingsComponent', () => {
  let component: GraphRenderingSettingsComponent;
  let fixture: ComponentFixture<GraphRenderingSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GraphRenderingSettingsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GraphRenderingSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
