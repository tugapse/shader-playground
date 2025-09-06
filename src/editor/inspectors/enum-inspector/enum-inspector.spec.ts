import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnumInspector } from './enum-inspector';

describe('EnumInspector', () => {
  let component: EnumInspector;
  let fixture: ComponentFixture<EnumInspector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnumInspector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnumInspector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
