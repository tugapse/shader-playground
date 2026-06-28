import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DefaultInspector } from './default-inspector';

describe('DefaultInspector', () => {
  let component: DefaultInspector;
  let fixture: ComponentFixture<DefaultInspector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DefaultInspector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DefaultInspector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
