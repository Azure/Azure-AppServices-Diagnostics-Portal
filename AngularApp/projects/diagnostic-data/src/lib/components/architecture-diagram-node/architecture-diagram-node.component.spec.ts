import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchitectureDiagramNodeComponent } from './architecture-diagram-node.component';

describe('ArchitectureDiagramNodeComponent', () => {
  let component: ArchitectureDiagramNodeComponent;
  let fixture: ComponentFixture<ArchitectureDiagramNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArchitectureDiagramNodeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ArchitectureDiagramNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
