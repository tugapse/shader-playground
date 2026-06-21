import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorInpector } from './inpector';

describe('Inpector', () => {
  let component: EditorInpector;
  let fixture: ComponentFixture<EditorInpector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorInpector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditorInpector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
