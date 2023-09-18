import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeComposerComponent } from './node-composer.component';

describe('NodeComposerComponent', () => {
  let component: NodeComposerComponent;
  let fixture: ComponentFixture<NodeComposerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NodeComposerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeComposerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
