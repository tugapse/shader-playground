import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InpectorTogglePanel } from './inpector-toggle-panel';

describe('InpectorTogglePanel', () => {
  let component: InpectorTogglePanel;
  let fixture: ComponentFixture<InpectorTogglePanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InpectorTogglePanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InpectorTogglePanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
