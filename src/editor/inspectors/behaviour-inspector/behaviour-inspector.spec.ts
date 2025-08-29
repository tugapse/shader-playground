import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BehaviourInspector } from './behaviour-inspector';

describe('BehaviourInspector', () => {
  let component: BehaviourInspector;
  let fixture: ComponentFixture<BehaviourInspector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BehaviourInspector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BehaviourInspector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
