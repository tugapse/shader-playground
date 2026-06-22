import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EngineStats } from './engine-stats';

describe('EngineStats', () => {
  let component: EngineStats;
  let fixture: ComponentFixture<EngineStats>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EngineStats]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EngineStats);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
