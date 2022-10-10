import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TileListComponent } from './tile-list.component';

describe('TileListComponent', () => {
  let component: TileListComponent;
  let fixture: ComponentFixture<TileListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TileListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TileListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
