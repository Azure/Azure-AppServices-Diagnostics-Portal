import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetectorNodeComponent } from './detector-node.component';

describe('DetectorNodeComponent', () => {
  let component: DetectorNodeComponent;
  let fixture: ComponentFixture<DetectorNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetectorNodeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetectorNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
