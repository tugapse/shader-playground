import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InspectorHeader } from './inspector-header';

describe('InspectorHeader', () => {
  let component: InspectorHeader;
  let fixture: ComponentFixture<InspectorHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InspectorHeader]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InspectorHeader);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
