import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextInputInspector } from './text-input-inspector';

describe('TextInputInspector', () => {
  let component: TextInputInspector;
  let fixture: ComponentFixture<TextInputInspector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextInputInspector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextInputInspector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
