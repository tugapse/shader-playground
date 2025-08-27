import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectInspector } from './object-inspector';

describe('ObjectInspector', () => {
  let component: ObjectInspector;
  let fixture: ComponentFixture<ObjectInspector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObjectInspector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ObjectInspector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
