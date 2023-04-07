import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForeachNodeComponent } from './foreach-node.component';

describe('ForeachNodeComponent', () => {
  let component: ForeachNodeComponent;
  let fixture: ComponentFixture<ForeachNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ForeachNodeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ForeachNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
