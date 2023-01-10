import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KustoNodeComponent } from './kusto-node.component';

describe('KustoNodeComponent', () => {
  let component: KustoNodeComponent;
  let fixture: ComponentFixture<KustoNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KustoNodeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KustoNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
