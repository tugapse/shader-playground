import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetGrid } from './asset-grid';

describe('AssetGrid', () => {
  let component: AssetGrid;
  let fixture: ComponentFixture<AssetGrid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetGrid]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetGrid);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
