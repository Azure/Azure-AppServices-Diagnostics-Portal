import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SolutionOrchestratorComponent } from './solution-orchestrator.component';

describe('SolutionOrchestratorComponent', () => {
  let component: SolutionOrchestratorComponent;
  let fixture: ComponentFixture<SolutionOrchestratorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SolutionOrchestratorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SolutionOrchestratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
