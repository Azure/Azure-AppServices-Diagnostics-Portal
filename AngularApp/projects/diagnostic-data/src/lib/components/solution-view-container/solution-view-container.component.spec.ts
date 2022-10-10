import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SolutionViewContainerComponent } from './solution-view-container.component';

describe('SolutionViewContainerComponent', () => {
  let component: SolutionViewContainerComponent;
  let fixture: ComponentFixture<SolutionViewContainerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SolutionViewContainerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SolutionViewContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
