import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeTitleComponent } from './node-title.component';

describe('NodeTitleComponent', () => {
  let component: NodeTitleComponent;
  let fixture: ComponentFixture<NodeTitleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NodeTitleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeTitleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
