import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BooleanInspector } from './boolean-inspector';

describe('BooleanInspector', () => {
  let component: BooleanInspector;
  let fixture: ComponentFixture<BooleanInspector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BooleanInspector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BooleanInspector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
