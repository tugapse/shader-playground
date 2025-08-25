import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VectorInspector } from './vector-inspector';

describe('VectorInspector', () => {
  let component: VectorInspector;
  let fixture: ComponentFixture<VectorInspector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VectorInspector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VectorInspector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
