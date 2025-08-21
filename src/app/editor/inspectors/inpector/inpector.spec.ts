import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Inpector } from './inpector';

describe('Inpector', () => {
  let component: Inpector;
  let fixture: ComponentFixture<Inpector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Inpector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Inpector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
