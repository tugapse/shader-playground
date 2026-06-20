import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColorInspector } from './color-inspector';

describe('ColorInspector', () => {
  let component: ColorInspector;
  let fixture: ComponentFixture<ColorInspector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColorInspector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ColorInspector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
