import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeComposer } from './node-composer.component';

describe('NodeComposerComponent', () => {
  let component: NodeComposer;
  let fixture: ComponentFixture<NodeComposer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NodeComposer ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeComposer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
